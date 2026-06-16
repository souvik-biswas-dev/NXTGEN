import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { propertyReports, properties } from '$lib/server/schema';
import { auditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const rows = await db.select().from(propertyReports).orderBy(desc(propertyReports.createdAt)).limit(200);
  const ids = [...new Set(rows.map((r) => r.propertyId))];
  const props = ids.length
    ? await db.select({ id: properties.id, title: properties.title, city: properties.city }).from(properties).where(inArray(properties.id, ids))
    : [];
  const byId = Object.fromEntries(props.map((p) => [p.id, p]));
  return { items: rows.map((r) => ({ ...r, property: byId[r.propertyId] ?? null })) };
};

export const actions: Actions = {
  setStatus: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = String(fd.get('id'));
    const status = String(fd.get('status'));
    await db.update(propertyReports).set({ status }).where(eq(propertyReports.id, id));
    await auditLog(locals.session!, { action: 'report.update', subject_type: 'report', subject_id: id, after: { status } });
    return { ok: true };
  },
};
