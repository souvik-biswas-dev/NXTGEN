import { and, eq, or, ilike, desc, type SQL } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, usersProfiles } from '$lib/server/schema';
import { auditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

const ROLES = ['buyer', 'owner', 'broker', 'admin'];

export const load: PageServerLoad = async ({ url }) => {
  const search = url.searchParams.get('search') ?? '';
  const role = url.searchParams.get('role') ?? '';
  const conds: SQL[] = [];
  if (search) conds.push(or(ilike(usersProfiles.name, `%${search}%`), ilike(usersProfiles.email, `%${search}%`))!);
  if (role && role !== 'all') conds.push(eq(usersProfiles.role, role));

  const items = await db
    .select({
      userId: usersProfiles.userId,
      name: usersProfiles.name,
      email: usersProfiles.email,
      phone: usersProfiles.phone,
      role: usersProfiles.role,
      verifiedBroker: usersProfiles.verifiedBroker,
      createdAt: usersProfiles.createdAt,
    })
    .from(usersProfiles)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(usersProfiles.createdAt))
    .limit(200);

  return { items, filters: { search, role } };
};

export const actions: Actions = {
  setRole: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const role = String(fd.get('role'));
    if (!ROLES.includes(role)) return fail(400, { error: 'invalid role' });
    await db.update(usersProfiles).set({ role, updatedAt: new Date() }).where(eq(usersProfiles.userId, id));
    await auditLog(locals.session!, { action: 'user.role_change', subject_type: 'user', subject_id: id, after: { role } });
    return { ok: true };
  },
  toggleBroker: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const verified = fd.get('verified') === 'true';
    await db.update(usersProfiles).set({ verifiedBroker: verified, updatedAt: new Date() }).where(eq(usersProfiles.userId, id));
    await auditLog(locals.session!, { action: verified ? 'broker.verify' : 'broker.unverify', subject_type: 'user', subject_id: id });
    return { ok: true };
  },
  delete: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id'));
    if (id === locals.session!.userId) return fail(400, { error: 'cannot delete yourself' });
    await db.delete(users).where(eq(users.id, id)); // cascades to profile
    await auditLog(locals.session!, { action: 'user.delete', subject_type: 'user', subject_id: id });
    return { ok: true };
  },
};
