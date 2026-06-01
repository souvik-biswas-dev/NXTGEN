import { Hono } from 'hono';
import { and, eq, or, count, gte } from 'drizzle-orm';
import { db } from '@/db';
import {
  usersProfiles,
  users,
  properties,
  inquiries,
  conversations,
  subscriptions,
  propertyViews,
  siteVisitRequests,
} from '@/db/schema';
import { optionalAuth, requireAuth, mustUser } from '@/middleware/auth';
import { maskPhone, maskEmail } from '@/lib/contact';
import { notFound, forbidden } from '@/lib/errors';
import type { AppEnv } from '@/types';

export const userRoutes = new Hono<AppEnv>();

// ── Public profile ───────────────────────────────────────────────
userRoutes.get('/:id', async (c) => {
  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, c.req.param('id')),
  });
  if (!profile) throw notFound('User not found');
  // Never expose raw phone/email on the public profile.
  return c.json({ ...profile, phone: undefined, email: undefined });
});

// ── Contact gate (Phase 9 #6 — port of get_my_contact privacy) ───
// Returns the real phone only if the viewer has earned access:
//   • admin, OR they ARE this user
//   • they own/broker a listing connected to this user
//   • they've inquired / have a conversation with this user
//   • they hold an active paid subscription
// Otherwise the number is masked.
userRoutes.get('/:id/contact', requireAuth, async (c) => {
  const viewer = mustUser(c);
  const targetId = c.req.param('id');

  const user = await db.query.users.findFirst({ where: eq(users.id, targetId) });
  const profile = await db.query.usersProfiles.findFirst({
    where: eq(usersProfiles.userId, targetId),
  });
  if (!user || !profile) throw notFound('User not found');

  let allowed = viewer.role === 'admin' || viewer.id === targetId;

  if (!allowed) {
    const [{ n: inqN }] = await db
      .select({ n: count() })
      .from(inquiries)
      .where(
        or(
          and(eq(inquiries.fromUserId, viewer.id), eq(inquiries.toUserId, targetId)),
          and(eq(inquiries.fromUserId, targetId), eq(inquiries.toUserId, viewer.id))
        )
      );
    if (Number(inqN) > 0) allowed = true;
  }
  if (!allowed) {
    const [{ n: convN }] = await db
      .select({ n: count() })
      .from(conversations)
      .where(
        or(
          and(eq(conversations.participant1, viewer.id), eq(conversations.participant2, targetId)),
          and(eq(conversations.participant1, targetId), eq(conversations.participant2, viewer.id))
        )
      );
    if (Number(convN) > 0) allowed = true;
  }
  if (!allowed) {
    const sub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, viewer.id), eq(subscriptions.status, 'active')),
    });
    if (sub) allowed = true;
  }

  return c.json({
    allowed,
    name: profile.name,
    phone: allowed ? user.phone ?? profile.phone : maskPhone(user.phone ?? profile.phone),
    email: allowed ? user.email ?? profile.email : maskEmail(user.email ?? profile.email),
  });
});

// ── Seller analytics for a listing (views/inquiries/visits) ──────
userRoutes.get('/analytics/:propertyId', requireAuth, async (c) => {
  const u = mustUser(c);
  const propertyId = c.req.param('propertyId');
  const prop = await db.query.properties.findFirst({ where: eq(properties.id, propertyId) });
  if (!prop) throw notFound('Property not found');
  if (prop.ownerId !== u.id && prop.brokerId !== u.id && u.role !== 'admin') throw forbidden();

  const now = Date.now();
  const day7 = new Date(now - 7 * 86400_000);
  const day30 = new Date(now - 30 * 86400_000);

  // Pull the last-30-day view rows once; aggregate in JS for the daily chart.
  const recentViews = await db
    .select({ viewedAt: propertyViews.viewedAt })
    .from(propertyViews)
    .where(and(eq(propertyViews.propertyId, propertyId), gte(propertyViews.viewedAt, day30)));
  const [allViews] = await db
    .select({ n: count() })
    .from(propertyViews)
    .where(eq(propertyViews.propertyId, propertyId));
  const [inq] = await db
    .select({ n: count() })
    .from(inquiries)
    .where(eq(inquiries.propertyId, propertyId));
  const [visits] = await db
    .select({ n: count() })
    .from(siteVisitRequests)
    .where(eq(siteVisitRequests.propertyId, propertyId));

  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    dailyMap[new Date(now - i * 86400_000).toISOString().slice(0, 10)] = 0;
  }
  let last7 = 0;
  for (const v of recentViews) {
    if (!v.viewedAt) continue;
    const key = v.viewedAt.toISOString().slice(0, 10);
    if (key in dailyMap) dailyMap[key]++;
    if (v.viewedAt >= day7) last7++;
  }

  return c.json({
    totalViews: Number(allViews.n),
    last7Days: last7,
    last30Days: recentViews.length,
    inquiries: Number(inq.n),
    siteVisits: Number(visits.n),
    dailyViews: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    propertyTitle: prop.title,
  });
});
