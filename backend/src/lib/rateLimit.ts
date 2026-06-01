import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { tooMany } from './errors';

/**
 * Fixed-window rate limiter — port of the Supabase `rl_check` SQL function.
 * Returns true if the call is allowed. Atomic via INSERT ... ON CONFLICT.
 */
export async function rlCheck(
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const epoch = Math.floor(Date.now() / 1000);
  const windowStart = new Date((epoch - (epoch % windowSeconds)) * 1000);

  const [row] = await db
    .insert(rateLimits)
    .values({ userId, action, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.userId, rateLimits.action, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  return (row?.count ?? 1) <= limit;
}

/** Enforce a limit or throw 429. Mirrors enforce_property_post_limit / enforce_inquiry_limit. */
export async function enforceLimit(
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number,
  message?: string
): Promise<void> {
  const ok = await rlCheck(userId, action, limit, windowSeconds);
  if (!ok) throw tooMany(message ?? 'Rate limit exceeded. Please try again later.');
}

/** Opportunistic cleanup of stale windows (call from a cron). */
export async function rlCleanup(olderThanMs = 24 * 3600 * 1000): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanMs);
  await db.delete(rateLimits).where(sql`${rateLimits.windowStart} < ${cutoff}`);
}
