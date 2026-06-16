import { desc, eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { usersProfiles, properties, subscriptions, inquiries } from '$lib/server/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const n = async (rows: Promise<{ n: number }[]>) => Number((await rows)[0]?.n ?? 0);

  const [
    totalUsers,
    totalProperties,
    activeSubs,
    totalInquiries,
    verified,
    featured,
    recentProperties,
    recentUsers,
    planRows,
  ] = await Promise.all([
    n(db.select({ n: count() }).from(usersProfiles)),
    n(db.select({ n: count() }).from(properties)),
    n(db.select({ n: count() }).from(subscriptions).where(eq(subscriptions.status, 'active'))),
    n(db.select({ n: count() }).from(inquiries)),
    n(db.select({ n: count() }).from(properties).where(eq(properties.verified, true))),
    n(db.select({ n: count() }).from(properties).where(eq(properties.featured, true))),
    db
      .select({
        id: properties.id,
        title: properties.title,
        city: properties.city,
        price: properties.price,
        type: properties.type,
        verified: properties.verified,
        createdAt: properties.createdAt,
      })
      .from(properties)
      .orderBy(desc(properties.createdAt))
      .limit(6),
    db
      .select({
        userId: usersProfiles.userId,
        name: usersProfiles.name,
        email: usersProfiles.email,
        role: usersProfiles.role,
        createdAt: usersProfiles.createdAt,
      })
      .from(usersProfiles)
      .orderBy(desc(usersProfiles.createdAt))
      .limit(6),
    db
      .select({ plan: subscriptions.plan })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active')),
  ]);

  const planCounts: Record<string, number> = {};
  for (const r of planRows) planCounts[r.plan] = (planCounts[r.plan] ?? 0) + 1;

  return {
    stats: { totalUsers, totalProperties, activeSubs, totalInquiries, verified, featured },
    recentProperties,
    recentUsers,
    planCounts,
  };
};
