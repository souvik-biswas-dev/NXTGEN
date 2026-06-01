import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { inAppNotifications, propertyAlerts, pushTokens, userPreferences } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import type { AppEnv } from '@/types';

export const notificationRoutes = new Hono<AppEnv>();

// ── In-app notification feed ─────────────────────────────────────
notificationRoutes.get('/', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select()
    .from(inAppNotifications)
    .where(eq(inAppNotifications.userId, u.id))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(100);
  return c.json({ items: rows });
});

notificationRoutes.post('/:id/read', requireAuth, async (c) => {
  const u = mustUser(c);
  await db
    .update(inAppNotifications)
    .set({ read: true })
    .where(and(eq(inAppNotifications.id, c.req.param('id')), eq(inAppNotifications.userId, u.id)));
  return c.json({ ok: true });
});

notificationRoutes.post('/read-all', requireAuth, async (c) => {
  const u = mustUser(c);
  await db.update(inAppNotifications).set({ read: true }).where(eq(inAppNotifications.userId, u.id));
  return c.json({ ok: true });
});

notificationRoutes.delete('/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  await db
    .delete(inAppNotifications)
    .where(and(eq(inAppNotifications.id, c.req.param('id')), eq(inAppNotifications.userId, u.id)));
  return c.json({ ok: true });
});

// ── Push token registration ──────────────────────────────────────
notificationRoutes.post('/push-token', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({ token: z.string(), platform: z.enum(['ios', 'android', 'web']).optional() })
    .parse(await c.req.json());
  await db
    .insert(pushTokens)
    .values({ userId: u.id, token: b.token, platform: b.platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: u.id, platform: b.platform, updatedAt: new Date() },
    });
  return c.json({ ok: true });
});

notificationRoutes.delete('/push-token', requireAuth, async (c) => {
  const u = mustUser(c);
  const token = c.req.query('token');
  if (token) {
    await db
      .delete(pushTokens)
      .where(and(eq(pushTokens.userId, u.id), eq(pushTokens.token, token)));
  }
  return c.json({ ok: true });
});

// ── Notification preferences (stored on user_preferences.notifications) ──
notificationRoutes.get('/prefs', requireAuth, async (c) => {
  const u = mustUser(c);
  const pref = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, u.id),
  });
  return c.json({ notifications: pref?.notifications ?? null });
});

notificationRoutes.put('/prefs', requireAuth, async (c) => {
  const u = mustUser(c);
  const notifications = z.record(z.boolean()).parse(await c.req.json());
  await db
    .insert(userPreferences)
    .values({ userId: u.id, notifications })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { notifications, updatedAt: new Date() },
    });
  return c.json({ ok: true });
});

// ── Property alerts (saved searches) ─────────────────────────────
notificationRoutes.get('/alerts', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select()
    .from(propertyAlerts)
    .where(eq(propertyAlerts.userId, u.id))
    .orderBy(desc(propertyAlerts.createdAt));
  return c.json({ items: rows });
});

notificationRoutes.post('/alerts', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({ name: z.string().min(1), filters: z.record(z.any()) })
    .parse(await c.req.json());
  const [row] = await db
    .insert(propertyAlerts)
    .values({ userId: u.id, name: b.name, filters: b.filters })
    .returning();
  return c.json(row, 201);
});

notificationRoutes.patch('/alerts/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z.object({ active: z.boolean().optional(), name: z.string().optional() }).parse(await c.req.json());
  const [row] = await db
    .update(propertyAlerts)
    .set({ ...(b.active !== undefined && { active: b.active }), ...(b.name && { name: b.name }) })
    .where(and(eq(propertyAlerts.id, c.req.param('id')), eq(propertyAlerts.userId, u.id)))
    .returning();
  return c.json(row);
});

notificationRoutes.delete('/alerts/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  await db
    .delete(propertyAlerts)
    .where(and(eq(propertyAlerts.id, c.req.param('id')), eq(propertyAlerts.userId, u.id)));
  return c.json({ ok: true });
});
