import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, or, desc, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { inquiries, offers, properties, usersProfiles } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import { enforceLimit } from '@/lib/rateLimit';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { notify } from '@/services/notify';
import type { AppEnv } from '@/types';

export const inquiryRoutes = new Hono<AppEnv>();

// ── Inquiries ────────────────────────────────────────────────────
inquiryRoutes.get('/inquiries', requireAuth, async (c) => {
  const u = mustUser(c);
  const box = c.req.query('box') ?? 'received'; // 'received' | 'sent'
  const rows = await db
    .select()
    .from(inquiries)
    .where(box === 'sent' ? eq(inquiries.fromUserId, u.id) : eq(inquiries.toUserId, u.id))
    .orderBy(desc(inquiries.createdAt));
  return c.json({ items: rows });
});

inquiryRoutes.post('/inquiries', requireAuth, async (c) => {
  const u = mustUser(c);
  await enforceLimit(u.id, 'inquiry', 30, 3600, 'Too many inquiries. Please wait a while.');
  const b = z
    .object({ propertyId: z.string().uuid(), message: z.string().min(1) })
    .parse(await c.req.json());

  const prop = await db.query.properties.findFirst({ where: eq(properties.id, b.propertyId) });
  if (!prop) throw notFound('Property not found');
  const toUserId = prop.ownerId ?? prop.brokerId;
  if (!toUserId) throw badRequest('This listing has no contactable owner');
  if (toUserId === u.id) throw badRequest('You cannot inquire on your own listing');

  const [row] = await db
    .insert(inquiries)
    .values({ fromUserId: u.id, toUserId, propertyId: b.propertyId, message: b.message })
    .returning();

  await notify({
    userId: toUserId,
    type: 'inquiry',
    title: 'New inquiry',
    body: b.message.slice(0, 120),
    data: { propertyId: b.propertyId, inquiryId: row.id },
  });
  return c.json(row, 201);
});

inquiryRoutes.patch('/inquiries/:id/read', requireAuth, async (c) => {
  const u = mustUser(c);
  await db
    .update(inquiries)
    .set({ read: true })
    .where(and(eq(inquiries.id, c.req.param('id')), eq(inquiries.toUserId, u.id)));
  return c.json({ ok: true });
});

// ── Offers (Phase 9: make-an-offer / negotiation) ────────────────
inquiryRoutes.get('/offers', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select()
    .from(offers)
    .where(or(eq(offers.fromUserId, u.id), eq(offers.toUserId, u.id)))
    .orderBy(desc(offers.createdAt));

  // Hydrate the property + counterparty name for display.
  const propIds = [...new Set(rows.map((r) => r.propertyId))];
  const userIds = [...new Set(rows.flatMap((r) => [r.fromUserId, r.toUserId]))];
  const [props, profiles] = await Promise.all([
    propIds.length ? db.select().from(properties).where(inArray(properties.id, propIds)) : [],
    userIds.length
      ? db
          .select({ user_id: usersProfiles.userId, name: usersProfiles.name })
          .from(usersProfiles)
          .where(inArray(usersProfiles.userId, userIds))
      : [],
  ]);
  const propById = Object.fromEntries(props.map((p) => [p.id, p]));
  const nameById = Object.fromEntries(profiles.map((p) => [p.user_id, p.name]));

  const items = rows.map((r) => ({
    ...r,
    direction: r.fromUserId === u.id ? 'sent' : 'received',
    counterpartyName: r.fromUserId === u.id ? nameById[r.toUserId] : nameById[r.fromUserId],
    property: propById[r.propertyId] ?? null,
  }));
  return c.json({ items });
});

inquiryRoutes.post('/offers', requireAuth, async (c) => {
  const u = mustUser(c);
  await enforceLimit(u.id, 'offer', 30, 3600, 'Too many offers. Please wait a while.');
  const b = z
    .object({
      propertyId: z.string().uuid(),
      amount: z.number().int().positive(),
      message: z.string().optional(),
    })
    .parse(await c.req.json());
  const prop = await db.query.properties.findFirst({ where: eq(properties.id, b.propertyId) });
  if (!prop) throw notFound('Property not found');
  const toUserId = prop.ownerId ?? prop.brokerId;
  if (!toUserId) throw badRequest('This listing has no contactable owner');
  if (toUserId === u.id) throw badRequest('You cannot make an offer on your own listing');

  const [row] = await db
    .insert(offers)
    .values({ propertyId: b.propertyId, fromUserId: u.id, toUserId, amount: b.amount, message: b.message })
    .returning();
  await notify({
    userId: toUserId,
    type: 'offer',
    title: 'New offer received',
    body: `₹${b.amount.toLocaleString('en-IN')} offered on ${prop.title}`,
    data: { propertyId: b.propertyId, offerId: row.id },
  });
  return c.json(row, 201);
});

// Owner responds: accept / reject / counter.
inquiryRoutes.patch('/offers/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  const id = c.req.param('id');
  const b = z
    .object({
      status: z.enum(['accepted', 'rejected', 'countered', 'withdrawn']),
      counterAmount: z.number().int().positive().optional(),
    })
    .parse(await c.req.json());
  const offer = await db.query.offers.findFirst({ where: eq(offers.id, id) });
  if (!offer) throw notFound('Offer not found');

  const isOwner = offer.toUserId === u.id;
  const isBuyer = offer.fromUserId === u.id;
  if (b.status === 'withdrawn' ? !isBuyer : !isOwner) throw forbidden('Not allowed');

  const [row] = await db
    .update(offers)
    .set({ status: b.status, counterAmount: b.counterAmount, updatedAt: new Date() })
    .where(eq(offers.id, id))
    .returning();

  await notify({
    userId: b.status === 'withdrawn' ? offer.toUserId : offer.fromUserId,
    type: 'offer',
    title: `Offer ${b.status}`,
    body: b.counterAmount ? `Counter: ₹${b.counterAmount.toLocaleString('en-IN')}` : undefined,
    data: { offerId: id, propertyId: offer.propertyId },
  });
  return c.json(row);
});
