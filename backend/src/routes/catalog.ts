import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, or, desc, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { projects, siteVisitRequests, propertyReports, homeLoanLeads, properties } from '@/db/schema';
import { requireAuth, optionalAuth, mustUser } from '@/middleware/auth';
import { notFound } from '@/lib/errors';
import { notify } from '@/services/notify';
import type { AppEnv } from '@/types';

export const catalogRoutes = new Hono<AppEnv>();

// ── Projects (new launches) ──────────────────────────────────────
catalogRoutes.get('/projects', async (c) => {
  const city = c.req.query('city');
  const rows = await db
    .select()
    .from(projects)
    .where(city ? eq(projects.city, city) : undefined)
    .orderBy(desc(projects.featured), desc(projects.createdAt));
  return c.json({ items: rows });
});

catalogRoutes.get('/projects/:id', async (c) => {
  const row = await db.query.projects.findFirst({ where: eq(projects.id, c.req.param('id')) });
  if (!row) throw notFound('Project not found');
  return c.json(row);
});

// ── Site visit requests ──────────────────────────────────────────
catalogRoutes.get('/site-visits', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select()
    .from(siteVisitRequests)
    .where(or(eq(siteVisitRequests.userId, u.id), eq(siteVisitRequests.contactUserId, u.id)))
    .orderBy(desc(siteVisitRequests.createdAt));
  // Attach the property for display.
  const propIds = [...new Set(rows.map((r) => r.propertyId))];
  const props = propIds.length
    ? await db.select().from(properties).where(inArray(properties.id, propIds))
    : [];
  const byId = Object.fromEntries(props.map((p) => [p.id, p]));
  return c.json({ items: rows.map((r) => ({ ...r, property: byId[r.propertyId] ?? null })) });
});

catalogRoutes.post('/site-visits', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({
      propertyId: z.string().uuid(),
      preferredDate: z.string(),
      slot: z.string().optional(),
      name: z.string(),
      phone: z.string(),
      notes: z.string().optional(),
    })
    .parse(await c.req.json());
  const prop = await db.query.properties.findFirst({ where: eq(properties.id, b.propertyId) });
  if (!prop) throw notFound('Property not found');
  const contactUserId = prop.ownerId ?? prop.brokerId ?? null;
  const [row] = await db
    .insert(siteVisitRequests)
    .values({
      propertyId: b.propertyId,
      userId: u.id,
      contactUserId,
      preferredDate: new Date(b.preferredDate),
      slot: b.slot,
      name: b.name,
      phone: b.phone,
      notes: b.notes,
    })
    .returning();
  if (contactUserId) {
    await notify({
      userId: contactUserId,
      type: 'site_visit',
      title: 'New site visit request',
      body: `${b.name} requested a visit`,
      data: { propertyId: b.propertyId, visitId: row.id },
    });
  }
  return c.json(row, 201);
});

catalogRoutes.patch('/site-visits/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  const { status } = z
    .object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']) })
    .parse(await c.req.json());
  const [row] = await db
    .update(siteVisitRequests)
    .set({ status })
    .where(
      and(
        eq(siteVisitRequests.id, c.req.param('id')),
        or(eq(siteVisitRequests.userId, u.id), eq(siteVisitRequests.contactUserId, u.id))
      )
    )
    .returning();
  return c.json(row);
});

// ── Property reports ─────────────────────────────────────────────
catalogRoutes.post('/reports', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({ propertyId: z.string().uuid(), reason: z.string(), details: z.string().optional() })
    .parse(await c.req.json());
  const [row] = await db
    .insert(propertyReports)
    .values({ propertyId: b.propertyId, reportedBy: u.id, reason: b.reason, details: b.details })
    .returning();
  return c.json(row, 201);
});

// ── Home loan leads ──────────────────────────────────────────────
catalogRoutes.post('/home-loan-leads', optionalAuth, async (c) => {
  const u = c.get('user');
  const b = z
    .object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email().optional(),
      city: z.string().optional(),
      loanAmount: z.number().int().optional(),
      employmentType: z.enum(['salaried', 'self-employed', 'business', 'other']).optional(),
      monthlyIncome: z.number().int().optional(),
      propertyId: z.string().uuid().optional(),
      partner: z.string().optional(),
    })
    .parse(await c.req.json());
  const [row] = await db
    .insert(homeLoanLeads)
    .values({
      userId: u?.id ?? null,
      name: b.name,
      phone: b.phone,
      email: b.email,
      city: b.city,
      loanAmount: b.loanAmount,
      employmentType: b.employmentType,
      monthlyIncome: b.monthlyIncome,
      propertyId: b.propertyId,
      partner: b.partner,
    })
    .returning();
  return c.json(row, 201);
});
