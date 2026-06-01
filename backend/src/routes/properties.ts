import { Hono } from 'hono';
import { z } from 'zod';
import { and, or, eq, ne, ilike, inArray, gte, lte, isNotNull, desc, asc, sql, SQL } from 'drizzle-orm';
import { db } from '@/db';
import { properties, usersProfiles, propertyViews, cityCentroids } from '@/db/schema';
import { optionalAuth, requireAuth, mustUser } from '@/middleware/auth';
import { enforceLimit } from '@/lib/rateLimit';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { matchAlertsForProperty } from '@/services/alerts';
import type { AppEnv } from '@/types';

export const propertyRoutes = new Hono<AppEnv>();

const PAGE_SIZE = 20;
const csv = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

/** Build the WHERE clause from query params (mirrors propertiesStore.filterProperties). */
function buildWhere(q: Record<string, string | undefined>): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  const text = q.q?.trim();
  if (text) {
    const pat = `%${text.replace(/[(),*]/g, ' ').trim()}%`;
    conds.push(
      or(
        ilike(properties.title, pat),
        ilike(properties.locality, pat),
        ilike(properties.city, pat),
        ilike(properties.description, pat)
      )
    );
  }
  if (q.city) conds.push(ilike(properties.city, `%${q.city}%`));
  if (q.locality) conds.push(ilike(properties.locality, `%${q.locality}%`));
  if (q.type) conds.push(eq(properties.type, q.type));
  if (q.category) conds.push(eq(properties.category, q.category));
  if (q.minPrice) conds.push(gte(properties.price, Number(q.minPrice)));
  if (q.maxPrice) conds.push(lte(properties.price, Number(q.maxPrice)));
  if (q.minArea) conds.push(gte(properties.areaSqft, Number(q.minArea)));
  if (q.maxArea) conds.push(lte(properties.areaSqft, Number(q.maxArea)));
  if (q.possession) conds.push(eq(properties.possession, q.possession));
  if (q.ownerOnly === 'true') conds.push(isNotNull(properties.ownerId));
  const bhk = csv(q.bhk);
  if (bhk.length) conds.push(inArray(properties.bhk, bhk));
  const furnishing = csv(q.furnishing);
  if (furnishing.length) conds.push(inArray(properties.furnishing, furnishing));
  const facing = csv(q.facing);
  if (facing.length) conds.push(inArray(properties.facing, facing));
  const defined = conds.filter(Boolean) as SQL[];
  return defined.length ? and(...defined) : undefined;
}

function orderFor(sort?: string) {
  switch (sort) {
    case 'price_low_high':
      return [asc(properties.price)];
    case 'price_high_low':
      return [desc(properties.price)];
    case 'area_low_high':
      return [asc(properties.areaSqft)];
    case 'area_high_low':
      return [desc(properties.areaSqft)];
    default:
      return [desc(properties.featured), desc(properties.createdAt)];
  }
}

// ── List / search / filter (paginated) ───────────────────────────
propertyRoutes.get('/', async (c) => {
  const q = c.req.query();
  const offset = Number(q.offset ?? 0);
  const limit = Math.min(Number(q.limit ?? PAGE_SIZE), 50);
  const rows = await db
    .select()
    .from(properties)
    .where(buildWhere(q))
    .orderBy(...orderFor(q.sort))
    .limit(limit)
    .offset(offset);
  return c.json({ items: rows, hasMore: rows.length === limit });
});

// ── Map markers: geo-tagged rows + city centroids ────────────────
propertyRoutes.get('/map', async (c) => {
  const rows = await db
    .select({
      id: properties.id,
      title: properties.title,
      price: properties.price,
      type: properties.type,
      city: properties.city,
      locality: properties.locality,
      latitude: properties.latitude,
      longitude: properties.longitude,
    })
    .from(properties)
    .limit(500);
  const centroids = await db.select().from(cityCentroids);
  const centroidMap = Object.fromEntries(centroids.map((c2) => [c2.city.toLowerCase(), c2]));
  const markers = rows.map((r) => {
    const c2 = centroidMap[r.city.toLowerCase()];
    return {
      ...r,
      latitude: r.latitude ?? c2?.latitude ?? null,
      longitude: r.longitude ?? c2?.longitude ?? null,
    };
  });
  return c.json({ markers });
});

// ── City centroids (for map fallback pins) ──────────────────────
propertyRoutes.get('/centroids', async (c) => {
  const rows = await db.select().from(cityCentroids);
  return c.json({ items: rows });
});

// ── My listings ──────────────────────────────────────────────────
propertyRoutes.get('/mine', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select()
    .from(properties)
    .where(or(eq(properties.ownerId, u.id), eq(properties.brokerId, u.id)))
    .orderBy(desc(properties.createdAt));
  return c.json({ items: rows });
});

// ── Single property (+ owner/broker profile) ─────────────────────
propertyRoutes.get('/:id', optionalAuth, async (c) => {
  const id = c.req.param('id');
  const row = await db.query.properties.findFirst({ where: eq(properties.id, id) });
  if (!row) throw notFound('Property not found');

  const ids = [row.ownerId, row.brokerId].filter(Boolean) as string[];
  const profiles = ids.length
    ? await db.select().from(usersProfiles).where(inArray(usersProfiles.userId, ids))
    : [];
  // Strip phone/email from the public detail — those are revealed only through
  // the gated /users/:id/contact endpoint (99acres-style privacy).
  const publicProfile = (p?: (typeof profiles)[number]) =>
    p ? { ...p, phone: undefined, email: undefined } : null;
  const byId = Object.fromEntries(profiles.map((p) => [p.userId, publicProfile(p)]));
  return c.json({
    ...row,
    owner: row.ownerId ? byId[row.ownerId] ?? null : null,
    broker: row.brokerId ? byId[row.brokerId] ?? null : null,
  });
});

// ── Similar properties (same city + type, ±30% price) ────────────
propertyRoutes.get('/:id/similar', async (c) => {
  const id = c.req.param('id');
  const limit = Math.min(Number(c.req.query('limit') ?? 6), 20);
  const base = await db.query.properties.findFirst({ where: eq(properties.id, id) });
  if (!base) throw notFound('Property not found');
  const rows = await db
    .select()
    .from(properties)
    .where(
      and(
        ne(properties.id, id),
        eq(properties.city, base.city),
        eq(properties.type, base.type),
        gte(properties.price, Math.floor(base.price * 0.7)),
        lte(properties.price, Math.ceil(base.price * 1.3))
      )
    )
    .orderBy(desc(properties.featured))
    .limit(limit);
  return c.json({ items: rows });
});

// ── Track a view (analytics) ─────────────────────────────────────
propertyRoutes.post('/:id/view', optionalAuth, async (c) => {
  const id = c.req.param('id');
  const u = c.get('user');
  await db.insert(propertyViews).values({ propertyId: id, viewerId: u?.id ?? null });
  return c.json({ ok: true });
});

// ── Create ───────────────────────────────────────────────────────
const propertyInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  maintenance: z.number().int().optional(),
  deposit: z.number().int().optional(),
  type: z.enum(['buy', 'rent']),
  category: z.enum(['residential', 'commercial']),
  bhk: z.string(),
  furnishing: z.string(),
  area_sqft: z.number().int().positive(),
  carpet_area: z.number().int().optional(),
  super_built_up: z.number().int().optional(),
  photos: z.array(z.string()).optional(),
  locality: z.string(),
  city: z.string(),
  address: z.string().optional(),
  floor: z.string().optional(),
  total_floors: z.string().optional(),
  facing: z.string().optional(),
  possession: z.enum(['ready', 'under-construction']),
  age_years: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  kitchens: z.number().int().optional(),
  parkings: z.number().int().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  broker_id: z.string().uuid().optional(),
});

propertyRoutes.post('/', requireAuth, async (c) => {
  const u = mustUser(c);
  await enforceLimit(u.id, 'property_post', 10, 86400, 'Daily property post limit reached.');
  const b = propertyInput.parse(await c.req.json());
  const [row] = await db
    .insert(properties)
    .values({
      title: b.title,
      description: b.description,
      price: b.price,
      maintenance: b.maintenance ?? 0,
      deposit: b.deposit ?? 0,
      type: b.type,
      category: b.category,
      bhk: b.bhk,
      furnishing: b.furnishing,
      areaSqft: b.area_sqft,
      carpetArea: b.carpet_area,
      superBuiltUp: b.super_built_up,
      photos: b.photos ?? [],
      locality: b.locality,
      city: b.city,
      address: b.address,
      floor: b.floor,
      totalFloors: b.total_floors,
      facing: b.facing,
      possession: b.possession,
      ageYears: b.age_years,
      amenities: b.amenities ?? [],
      ownerId: u.role === 'broker' && b.broker_id ? null : u.id,
      brokerId: u.role === 'broker' ? u.id : b.broker_id ?? null,
      bedrooms: b.bedrooms ?? 0,
      bathrooms: b.bathrooms ?? 0,
      kitchens: b.kitchens ?? 0,
      parkings: b.parkings ?? 0,
      latitude: b.latitude,
      longitude: b.longitude,
    })
    .returning();

  // Notify users whose saved searches match this new listing (fire-and-forget).
  void matchAlertsForProperty(row);

  return c.json(row, 201);
});

// ── Update (owner/broker/admin only) ─────────────────────────────
propertyRoutes.patch('/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  const id = c.req.param('id');
  const existing = await db.query.properties.findFirst({ where: eq(properties.id, id) });
  if (!existing) throw notFound('Property not found');
  const owns = existing.ownerId === u.id || existing.brokerId === u.id || u.role === 'admin';
  if (!owns) throw forbidden('You cannot edit this listing');

  const patch = (await c.req.json()) as Record<string, unknown>;
  // Whitelist: clients can't flip verified/featured (admin route handles that).
  const allowed: (keyof typeof properties.$inferInsert)[] = [
    'title', 'description', 'price', 'maintenance', 'deposit', 'photos', 'address',
    'floor', 'totalFloors', 'facing', 'possession', 'ageYears', 'amenities',
    'bedrooms', 'bathrooms', 'kitchens', 'parkings', 'latitude', 'longitude',
  ];
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of Object.keys(patch)) {
    // accept both snake_case (from app) and camelCase
    const camel = k.replace(/_([a-z])/g, (_, x) => x.toUpperCase());
    if ((allowed as string[]).includes(camel)) set[camel] = patch[k];
  }
  const [row] = await db.update(properties).set(set).where(eq(properties.id, id)).returning();
  return c.json(row);
});

// ── Delete (owner/broker/admin only) ─────────────────────────────
propertyRoutes.delete('/:id', requireAuth, async (c) => {
  const u = mustUser(c);
  const id = c.req.param('id');
  const existing = await db.query.properties.findFirst({ where: eq(properties.id, id) });
  if (!existing) throw notFound('Property not found');
  const owns = existing.ownerId === u.id || existing.brokerId === u.id || u.role === 'admin';
  if (!owns) throw forbidden('You cannot delete this listing');
  await db.delete(properties).where(eq(properties.id, id));
  return c.json({ ok: true });
});
