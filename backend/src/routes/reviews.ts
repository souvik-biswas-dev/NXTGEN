import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, sql, desc, avg, count } from 'drizzle-orm';
import { db } from '@/db';
import { brokerReviews, localityReviewsDetailed, properties, usersProfiles } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import { badRequest } from '@/lib/errors';
import type { AppEnv } from '@/types';

export const reviewRoutes = new Hono<AppEnv>();

// ── Broker reviews ───────────────────────────────────────────────
reviewRoutes.get('/broker/:brokerId', async (c) => {
  const brokerId = c.req.param('brokerId');
  const rows = await db
    .select()
    .from(brokerReviews)
    .where(eq(brokerReviews.brokerId, brokerId))
    .orderBy(desc(brokerReviews.createdAt));
  const [agg] = await db
    .select({ avg: avg(brokerReviews.rating), n: count() })
    .from(brokerReviews)
    .where(eq(brokerReviews.brokerId, brokerId));
  return c.json({ items: rows, average: Number(agg.avg ?? 0), total: Number(agg.n) });
});

reviewRoutes.post('/broker/:brokerId', requireAuth, async (c) => {
  const u = mustUser(c);
  const brokerId = c.req.param('brokerId');
  if (brokerId === u.id) throw badRequest('You cannot review yourself');
  const b = z
    .object({ rating: z.number().int().min(1).max(5), title: z.string().optional(), comment: z.string().optional() })
    .parse(await c.req.json());
  const [row] = await db
    .insert(brokerReviews)
    .values({ brokerId, reviewerId: u.id, rating: b.rating, title: b.title, comment: b.comment })
    .onConflictDoUpdate({
      target: [brokerReviews.brokerId, brokerReviews.reviewerId],
      set: { rating: b.rating, title: b.title, comment: b.comment },
    })
    .returning();
  // Refresh the broker's cached rating on their profile.
  const [agg] = await db
    .select({ avg: avg(brokerReviews.rating) })
    .from(brokerReviews)
    .where(eq(brokerReviews.brokerId, brokerId));
  await db
    .update(usersProfiles)
    .set({ rating: String(Number(agg.avg ?? 0).toFixed(2)) })
    .where(eq(usersProfiles.userId, brokerId));
  return c.json(row, 201);
});

// ── Locality reviews (detailed) ──────────────────────────────────
reviewRoutes.get('/locality', async (c) => {
  const locality = c.req.query('locality');
  const city = c.req.query('city');
  if (!locality || !city) throw badRequest('locality and city are required');
  const rows = await db
    .select()
    .from(localityReviewsDetailed)
    .where(and(eq(localityReviewsDetailed.locality, locality), eq(localityReviewsDetailed.city, city)))
    .orderBy(desc(localityReviewsDetailed.createdAt));
  const [agg] = await db
    .select({
      rating: avg(localityReviewsDetailed.rating),
      safety: avg(localityReviewsDetailed.safety),
      connectivity: avg(localityReviewsDetailed.connectivity),
      amenities: avg(localityReviewsDetailed.amenitiesRating),
      cleanliness: avg(localityReviewsDetailed.cleanliness),
      n: count(),
    })
    .from(localityReviewsDetailed)
    .where(and(eq(localityReviewsDetailed.locality, locality), eq(localityReviewsDetailed.city, city)));
  return c.json({ items: rows, aggregates: agg });
});

reviewRoutes.post('/locality', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({
      locality: z.string(),
      city: z.string(),
      rating: z.number().int().min(1).max(5),
      safety: z.number().int().min(1).max(5).optional(),
      connectivity: z.number().int().min(1).max(5).optional(),
      amenities_rating: z.number().int().min(1).max(5).optional(),
      cleanliness: z.number().int().min(1).max(5).optional(),
      title: z.string().optional(),
      comment: z.string().optional(),
    })
    .parse(await c.req.json());
  const [row] = await db
    .insert(localityReviewsDetailed)
    .values({
      locality: b.locality,
      city: b.city,
      reviewerId: u.id,
      rating: b.rating,
      safety: b.safety,
      connectivity: b.connectivity,
      amenitiesRating: b.amenities_rating,
      cleanliness: b.cleanliness,
      title: b.title,
      comment: b.comment,
    })
    .returning();
  return c.json(row, 201);
});

// ── Locality price trends / insights (Phase 9 #3) ────────────────
// Computed live from listings: avg ₹/sqft + count per locality in a city.
reviewRoutes.get('/insights/:city', async (c) => {
  const city = c.req.param('city');
  const rows = await db
    .select({
      locality: properties.locality,
      avgPsf: sql<number>`round(avg(${properties.price}::numeric / nullif(${properties.areaSqft}, 0)))`,
      avgPrice: sql<number>`round(avg(${properties.price}))`,
      listings: count(),
    })
    .from(properties)
    // ₹/sqft trends only make sense for sale listings — rentals skew the average.
    .where(and(eq(properties.city, city), eq(properties.type, 'buy')))
    .groupBy(properties.locality)
    .orderBy(desc(count()))
    .limit(25);
  return c.json({ city, localities: rows });
});
