import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, desc, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { favorites, recentlyViewed, properties } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import type { AppEnv } from '@/types';

// Favorites + recently-viewed (both are simple per-user join tables).
export const engagementRoutes = new Hono<AppEnv>();

async function hydrate(rows: { propertyId: string }[]) {
  const ids = rows.map((r) => r.propertyId);
  if (!ids.length) return [];
  const props = await db.select().from(properties).where(inArray(properties.id, ids));
  const byId = Object.fromEntries(props.map((p) => [p.id, p]));
  return ids.map((id) => byId[id]).filter(Boolean);
}

// ── Favorites ────────────────────────────────────────────────────
engagementRoutes.get('/favorites', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select({ propertyId: favorites.propertyId })
    .from(favorites)
    .where(eq(favorites.userId, u.id))
    .orderBy(desc(favorites.createdAt));
  return c.json({ ids: rows.map((r) => r.propertyId), items: await hydrate(rows) });
});

engagementRoutes.post('/favorites', requireAuth, async (c) => {
  const u = mustUser(c);
  const { propertyId } = z.object({ propertyId: z.string().uuid() }).parse(await c.req.json());
  await db
    .insert(favorites)
    .values({ userId: u.id, propertyId })
    .onConflictDoNothing({ target: [favorites.userId, favorites.propertyId] });
  return c.json({ ok: true });
});

engagementRoutes.delete('/favorites/:propertyId', requireAuth, async (c) => {
  const u = mustUser(c);
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, u.id), eq(favorites.propertyId, c.req.param('propertyId'))));
  return c.json({ ok: true });
});

// ── Recently viewed (upsert bumps viewed_at) ─────────────────────
engagementRoutes.get('/recently-viewed', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select({ propertyId: recentlyViewed.propertyId })
    .from(recentlyViewed)
    .where(eq(recentlyViewed.userId, u.id))
    .orderBy(desc(recentlyViewed.viewedAt))
    .limit(20);
  return c.json({ items: await hydrate(rows) });
});

engagementRoutes.post('/recently-viewed', requireAuth, async (c) => {
  const u = mustUser(c);
  const { propertyId } = z.object({ propertyId: z.string().uuid() }).parse(await c.req.json());
  await db
    .insert(recentlyViewed)
    .values({ userId: u.id, propertyId, viewedAt: new Date() })
    .onConflictDoUpdate({
      target: [recentlyViewed.userId, recentlyViewed.propertyId],
      set: { viewedAt: new Date() },
    });
  return c.json({ ok: true });
});
