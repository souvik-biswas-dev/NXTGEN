import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import type { AppEnv } from '@/types';

// user_preferences: preferred cities/types/categories + search history.
// (Notification toggles live on the same row but are managed via /notifications/prefs.)
export const preferenceRoutes = new Hono<AppEnv>();

preferenceRoutes.get('/', requireAuth, async (c) => {
  const u = mustUser(c);
  let pref = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, u.id) });
  if (!pref) {
    [pref] = await db.insert(userPreferences).values({ userId: u.id }).returning();
  }
  return c.json(pref);
});

preferenceRoutes.put('/', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({
      preferred_cities: z.array(z.string()).optional(),
      preferred_types: z.array(z.string()).optional(),
      preferred_categories: z.array(z.string()).optional(),
      search_history: z.array(z.any()).optional(),
      last_search_at: z.string().optional(),
    })
    .parse(await c.req.json());

  const set = {
    ...(b.preferred_cities && { preferredCities: b.preferred_cities }),
    ...(b.preferred_types && { preferredTypes: b.preferred_types }),
    ...(b.preferred_categories && { preferredCategories: b.preferred_categories }),
    ...(b.search_history && { searchHistory: b.search_history }),
    ...(b.last_search_at && { lastSearchAt: new Date(b.last_search_at) }),
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(userPreferences)
    .values({ userId: u.id, ...set })
    .onConflictDoUpdate({ target: userPreferences.userId, set })
    .returning();
  return c.json(row);
});
