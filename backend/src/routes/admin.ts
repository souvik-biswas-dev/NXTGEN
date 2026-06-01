import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/db';
import {
  properties,
  propertyReports,
  usersProfiles,
  brokerVerifications,
  adminAuditLog,
  users,
  subscriptions,
} from '@/db/schema';
import { requireAdmin, mustUser } from '@/middleware/auth';
import { notFound } from '@/lib/errors';
import { notify } from '@/services/notify';
import type { AppEnv } from '@/types';

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use('*', requireAdmin);

// Append a row to the audit log (replaces log_admin_action).
async function audit(
  c: { get: (k: 'user') => { id: string } | null },
  action: string,
  subjectType: string,
  subjectId: string,
  before?: unknown,
  after?: unknown
) {
  const actor = mustUser(c as never);
  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, actor.id),
  });
  await db.insert(adminAuditLog).values({
    actorId: actor.id,
    actorEmail: profile?.email ?? null,
    action,
    subjectType,
    subjectId,
    before: before ?? null,
    after: after ?? null,
  });
}

// ── Dashboard stats ──────────────────────────────────────────────
adminRoutes.get('/stats', async (c) => {
  const [[p], [u], [r], [s]] = await Promise.all([
    db.select({ n: count() }).from(properties),
    db.select({ n: count() }).from(usersProfiles),
    db.select({ n: count() }).from(propertyReports),
    db.select({ n: count() }).from(subscriptions),
  ]);
  return c.json({
    properties: Number(p.n),
    users: Number(u.n),
    reports: Number(r.n),
    subscriptions: Number(s.n),
  });
});

// ── Listings moderation ──────────────────────────────────────────
adminRoutes.get('/listings', async (c) => {
  const rows = await db.select().from(properties).orderBy(desc(properties.createdAt)).limit(200);
  return c.json({ items: rows });
});

adminRoutes.patch('/listings/:id', async (c) => {
  const id = c.req.param('id');
  const b = z.object({ verified: z.boolean().optional(), featured: z.boolean().optional() }).parse(await c.req.json());
  const before = await db.query.properties.findFirst({ where: eq(properties.id, id) });
  if (!before) throw notFound('Listing not found');
  const [row] = await db
    .update(properties)
    .set({ ...b, updatedAt: new Date() })
    .where(eq(properties.id, id))
    .returning();
  await audit(c, 'property.moderate', 'property', id, before, row);
  return c.json(row);
});

adminRoutes.delete('/listings/:id', async (c) => {
  const id = c.req.param('id');
  await db.delete(properties).where(eq(properties.id, id));
  await audit(c, 'property.delete', 'property', id);
  return c.json({ ok: true });
});

// ── Reports ──────────────────────────────────────────────────────
adminRoutes.get('/reports', async (c) => {
  const rows = await db.select().from(propertyReports).orderBy(desc(propertyReports.createdAt));
  return c.json({ items: rows });
});

adminRoutes.patch('/reports/:id', async (c) => {
  const id = c.req.param('id');
  const { status } = z
    .object({ status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']) })
    .parse(await c.req.json());
  const [row] = await db
    .update(propertyReports)
    .set({ status })
    .where(eq(propertyReports.id, id))
    .returning();
  await audit(c, 'report.update', 'report', id, undefined, { status });
  return c.json(row);
});

// ── Users ────────────────────────────────────────────────────────
adminRoutes.get('/users', async (c) => {
  const rows = await db.select().from(usersProfiles).orderBy(desc(usersProfiles.createdAt)).limit(200);
  return c.json({ items: rows });
});

adminRoutes.patch('/users/:id', async (c) => {
  const id = c.req.param('id');
  const { role } = z.object({ role: z.enum(['buyer', 'owner', 'broker', 'admin']) }).parse(await c.req.json());
  const [row] = await db
    .update(usersProfiles)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersProfiles.userId, id))
    .returning();
  await audit(c, 'user.role_change', 'user', id, undefined, { role });
  return c.json(row);
});

// ── Broker verifications ─────────────────────────────────────────
adminRoutes.get('/broker-verifications', async (c) => {
  const rows = await db
    .select()
    .from(brokerVerifications)
    .orderBy(desc(brokerVerifications.submittedAt));
  return c.json({ items: rows });
});

// Approve / reject — replicates the sync_broker_verified_flag trigger.
adminRoutes.patch('/broker-verifications/:id', async (c) => {
  const actor = mustUser(c);
  const id = c.req.param('id');
  const b = z
    .object({ status: z.enum(['approved', 'rejected']), notes: z.string().optional() })
    .parse(await c.req.json());
  const verif = await db.query.brokerVerifications.findFirst({ where: eq(brokerVerifications.id, id) });
  if (!verif) throw notFound('Verification not found');

  const [row] = await db
    .update(brokerVerifications)
    .set({
      status: b.status,
      reviewerNotes: b.notes,
      reviewerId: actor.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(brokerVerifications.id, id))
    .returning();

  // Sync the profile flag/role (was a DB trigger).
  if (b.status === 'approved') {
    await db
      .update(usersProfiles)
      .set({ verifiedBroker: true, role: 'broker' })
      .where(eq(usersProfiles.userId, verif.userId));
  } else if (verif.status === 'approved') {
    await db
      .update(usersProfiles)
      .set({ verifiedBroker: false })
      .where(eq(usersProfiles.userId, verif.userId));
  }

  await audit(c, 'broker.verify', 'user', verif.userId, { status: verif.status }, { status: b.status });
  await notify({
    userId: verif.userId,
    type: 'system',
    title: b.status === 'approved' ? 'You are now a verified broker' : 'Verification update',
    body: b.status === 'approved' ? 'Your broker verification was approved.' : 'Your verification was not approved.',
  });
  return c.json(row);
});

// ── Audit log ────────────────────────────────────────────────────
adminRoutes.get('/audit', async (c) => {
  const rows = await db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(200);
  return c.json({ items: rows });
});
