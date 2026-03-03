export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';

async function getAnalyticsData() {
  const supabase = createAdminClient();

  const [
    { data: usersByRole },
    { data: subsByPlan },
    { data: subsByMonth },
    { count: propertyCount },
  ] = await Promise.all([
    supabase.from('users_profiles').select('role'),
    supabase.from('subscriptions').select('plan, status, created_at'),
    supabase.from('subscriptions').select('plan, created_at').order('created_at', { ascending: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
  ]);

  // Properties by city - use a targeted query instead of fetching all rows
  const { data: allProperties } = await supabase.from('properties').select('city');

  // Properties by city
  const cityMap: Record<string, number> = {};
  (allProperties || []).forEach((p: { city: string }) => {
    cityMap[p.city] = (cityMap[p.city] || 0) + 1;
  });
  const propertiesByCityData = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Users by role
  const roleMap: Record<string, number> = {};
  (usersByRole || []).forEach((u: { role: string }) => {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1;
  });
  const usersByRoleData = Object.entries(roleMap).map(([role, count]) => ({ role, count }));

  // Subscriptions by plan (active)
  const planMap: Record<string, number> = {};
  (subsByPlan || []).forEach((s: { plan: string; status: string }) => {
    if (s.status === 'active') planMap[s.plan] = (planMap[s.plan] || 0) + 1;
  });
  const subsData = Object.entries(planMap).map(([plan, count]) => ({ plan, count }));

  // Monthly subscription signups (last 6 months)
  const monthlyMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    monthlyMap[key] = 0;
  }
  (subsByMonth || []).forEach((s: { plan: string; created_at: string }) => {
    const d = new Date(s.created_at);
    const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
    if (key in monthlyMap) monthlyMap[key]++;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

  return { propertiesByCityData, usersByRoleData, subsData, monthlyData };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div>
      <Topbar title="Analytics" subtitle="Platform insights and trends" />
      <div className="p-6">
        <AnalyticsCharts {...data} />
      </div>
    </div>
  );
}
