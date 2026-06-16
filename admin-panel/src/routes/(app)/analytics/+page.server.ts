import { db } from '$lib/server/db';
import { usersProfiles, subscriptions, properties } from '$lib/server/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [roleRows, subRows, cityRows] = await Promise.all([
    db.select({ role: usersProfiles.role }).from(usersProfiles),
    db.select({ plan: subscriptions.plan, status: subscriptions.status }).from(subscriptions),
    db.select({ city: properties.city }).from(properties),
  ]);

  const tally = <T extends string>(arr: T[]) => {
    const m: Record<string, number> = {};
    for (const v of arr) m[v] = (m[v] ?? 0) + 1;
    return Object.entries(m)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    usersByRole: tally(roleRows.map((r) => r.role)),
    subsByPlan: tally(subRows.filter((s) => s.status === 'active').map((s) => s.plan)),
    propsByCity: tally(cityRows.map((r) => r.city)).slice(0, 10),
  };
};
