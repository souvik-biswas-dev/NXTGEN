import { and, eq, desc, inArray, type SQL } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { subscriptions, usersProfiles } from '$lib/server/schema';
import { auditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const status = url.searchParams.get('status') ?? '';
  const conds: SQL[] = [];
  if (status && status !== 'all') conds.push(eq(subscriptions.status, status));

  const rows = await db
    .select()
    .from(subscriptions)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(subscriptions.createdAt))
    .limit(200);
  const ids = [...new Set(rows.map((r) => r.userId))];
  const profiles = ids.length
    ? await db.select({ userId: usersProfiles.userId, name: usersProfiles.name, email: usersProfiles.email }).from(usersProfiles).where(inArray(usersProfiles.userId, ids))
    : [];
  const byId = Object.fromEntries(profiles.map((p) => [p.userId, p]));
  return { items: rows.map((r) => ({ ...r, user: byId[r.userId] ?? null })), filters: { status } };
};

export const actions: Actions = {
  cancel: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id'));
    await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.id, id));
    await auditLog(locals.session!, { action: 'subscription.cancel', subject_type: 'subscription', subject_id: id });
    return { ok: true };
  },
  extend: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const days = Number(fd.get('days'));
    if (!Number.isFinite(days) || days <= 0 || days > 730) return fail(400, { error: 'days 1–730' });
    const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, id) });
    if (!sub) return fail(404, { error: 'not found' });
    const ends = new Date(sub.endsAt);
    ends.setDate(ends.getDate() + days);
    await db.update(subscriptions).set({ endsAt: ends, status: 'active' }).where(eq(subscriptions.id, id));
    await auditLog(locals.session!, { action: 'subscription.extend', subject_type: 'subscription', subject_id: id, metadata: { days } });
    return { ok: true };
  },
};
