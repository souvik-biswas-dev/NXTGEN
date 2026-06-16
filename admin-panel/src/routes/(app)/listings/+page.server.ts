import { and, eq, or, ilike, desc, inArray, type SQL } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { properties, usersProfiles } from '$lib/server/schema';
import { auditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const search = url.searchParams.get('search') ?? '';
  const city = url.searchParams.get('city') ?? '';
  const verified = url.searchParams.get('verified') ?? '';

  const conds: SQL[] = [];
  if (search) conds.push(or(ilike(properties.title, `%${search}%`), ilike(properties.locality, `%${search}%`))!);
  if (city) conds.push(eq(properties.city, city));
  if (verified === 'true') conds.push(eq(properties.verified, true));
  if (verified === 'false') conds.push(eq(properties.verified, false));

  const rows = await db
    .select({
      id: properties.id,
      title: properties.title,
      locality: properties.locality,
      city: properties.city,
      price: properties.price,
      type: properties.type,
      bhk: properties.bhk,
      verified: properties.verified,
      featured: properties.featured,
      createdAt: properties.createdAt,
      ownerId: properties.ownerId,
      brokerId: properties.brokerId,
    })
    .from(properties)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(properties.createdAt))
    .limit(200);

  const ids = [...new Set(rows.flatMap((r) => [r.ownerId, r.brokerId].filter(Boolean) as string[]))];
  const profiles = ids.length
    ? await db
        .select({ userId: usersProfiles.userId, name: usersProfiles.name })
        .from(usersProfiles)
        .where(inArray(usersProfiles.userId, ids))
    : [];
  const nameById = Object.fromEntries(profiles.map((p) => [p.userId, p.name]));

  return {
    items: rows.map((r) => ({
      ...r,
      contact: r.brokerId ? nameById[r.brokerId] : r.ownerId ? nameById[r.ownerId] : null,
    })),
    filters: { search, city, verified },
  };
};

export const actions: Actions = {
  toggleVerified: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const verified = fd.get('verified') === 'true';
    await db.update(properties).set({ verified, updatedAt: new Date() }).where(eq(properties.id, id));
    await auditLog(locals.session!, {
      action: verified ? 'property.verify' : 'property.unverify',
      subject_type: 'property',
      subject_id: id,
    });
    return { ok: true };
  },
  toggleFeatured: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const featured = fd.get('featured') === 'true';
    await db.update(properties).set({ featured, updatedAt: new Date() }).where(eq(properties.id, id));
    await auditLog(locals.session!, {
      action: featured ? 'property.feature' : 'property.unfeature',
      subject_type: 'property',
      subject_id: id,
    });
    return { ok: true };
  },
  delete: async ({ request, locals }) => {
    const id = String((await request.formData()).get('id'));
    if (!id) return fail(400, { error: 'missing id' });
    await db.delete(properties).where(eq(properties.id, id));
    await auditLog(locals.session!, { action: 'property.delete', subject_type: 'property', subject_id: id });
    return { ok: true };
  },
};
