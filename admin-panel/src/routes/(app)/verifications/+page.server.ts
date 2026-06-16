import { desc, eq, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { brokerVerifications, usersProfiles } from '$lib/server/schema';
import { auditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const rows = await db
    .select()
    .from(brokerVerifications)
    .orderBy(desc(brokerVerifications.submittedAt))
    .limit(200);
  const ids = [...new Set(rows.map((r) => r.userId))];
  const profiles = ids.length
    ? await db
        .select({ userId: usersProfiles.userId, name: usersProfiles.name, email: usersProfiles.email })
        .from(usersProfiles)
        .where(inArray(usersProfiles.userId, ids))
    : [];
  const byId = Object.fromEntries(profiles.map((p) => [p.userId, p]));
  return { items: rows.map((r) => ({ ...r, profile: byId[r.userId] ?? null })) };
};

export const actions: Actions = {
  review: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const status = String(fd.get('status')); // 'approved' | 'rejected'
    const notes = String(fd.get('notes') ?? '');
    if (!['approved', 'rejected'].includes(status)) return fail(400, { error: 'bad status' });

    const verif = await db.query.brokerVerifications.findFirst({ where: eq(brokerVerifications.id, id) });
    if (!verif) return fail(404, { error: 'not found' });

    await db
      .update(brokerVerifications)
      .set({ status, reviewerNotes: notes || null, reviewerId: locals.session!.userId, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(brokerVerifications.id, id));

    // Replicate the sync_broker_verified_flag trigger.
    if (status === 'approved') {
      await db.update(usersProfiles).set({ verifiedBroker: true, role: 'broker' }).where(eq(usersProfiles.userId, verif.userId));
    } else if (verif.status === 'approved') {
      await db.update(usersProfiles).set({ verifiedBroker: false }).where(eq(usersProfiles.userId, verif.userId));
    }
    await auditLog(locals.session!, { action: 'broker.verify', subject_type: 'user', subject_id: verif.userId, after: { status } });
    return { ok: true };
  },
};
