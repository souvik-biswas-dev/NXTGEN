import { asc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { platformData } from '$lib/server/schema';
import { auditLog } from '$lib/server/audit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const rows = await db.select().from(platformData).orderBy(asc(platformData.key));
  return {
    items: rows.map((r) => ({ key: r.key, json: JSON.stringify(r.data, null, 2), updatedAt: r.updatedAt })),
  };
};

export const actions: Actions = {
  save: async ({ request, locals }) => {
    const fd = await request.formData();
    const key = String(fd.get('key'));
    const raw = String(fd.get('json') ?? '');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fail(400, { error: `Invalid JSON for "${key}"`, key });
    }
    await db
      .insert(platformData)
      .values({ key, data: parsed as object, updatedAt: new Date() })
      .onConflictDoUpdate({ target: platformData.key, set: { data: parsed as object, updatedAt: new Date() } });
    await auditLog(locals.session!, { action: 'platform_data.update', subject_type: 'platform_data', subject_id: key });
    return { ok: true, savedKey: key };
  },
};
