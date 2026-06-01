import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { platformData } from '@/db/schema';
import { notFound } from '@/lib/errors';
import type { AppEnv } from '@/types';

export const platformRoutes = new Hono<AppEnv>();

// Public CMS-style key/value blobs (popular_cities, amenities, faqs,
// subscription_plans, home_loan_partners, etc.).
platformRoutes.get('/', async (c) => {
  const rows = await db.select().from(platformData);
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.data;
  return c.json(map);
});

platformRoutes.get('/:key', async (c) => {
  const row = await db.query.platformData.findFirst({
    where: eq(platformData.key, c.req.param('key')),
  });
  if (!row) throw notFound('Unknown platform data key');
  return c.json(row.data);
});
