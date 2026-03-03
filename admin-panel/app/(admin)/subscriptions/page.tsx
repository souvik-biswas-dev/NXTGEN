export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionActions } from '@/components/subscriptions/subscription-actions';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CreditCard } from 'lucide-react';

interface SubscriptionRow {
  id: string;
  plan: string;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  user: { name: string; email: string; phone: string | null } | null;
}

async function getSubscriptions(plan?: string, status?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('subscriptions')
    .select('*, user:user_id(name, email, phone)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (plan && plan !== 'all') query = query.eq('plan', plan);
  if (status && status !== 'all') query = query.eq('status', status);

  const { data } = await query;
  return data || [];
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; status?: string }>;
}) {
  const params = await searchParams;
  const subs = await getSubscriptions(params.plan, params.status);

  const counts = subs.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <Topbar title="Subscriptions" subtitle={`${subs.length} subscriptions`} />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { key: 'active', label: 'Active', variant: 'success' as const },
            { key: 'expired', label: 'Expired', variant: 'danger' as const },
            { key: 'cancelled', label: 'Cancelled', variant: 'secondary' as const },
            { key: 'free', label: 'Free Plan', variant: 'secondary' as const },
            { key: 'silver', label: 'Silver Plan', variant: 'info' as const },
            { key: 'gold', label: 'Gold Plan', variant: 'warning' as const },
          ].map(({ key, label }) => (
            <Card key={key} className="p-4">
              <p className="text-2xl font-bold text-white">{counts[key] || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form className="flex flex-wrap gap-3">
            <select name="plan" defaultValue={params.plan || 'all'} className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]">
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
            <select name="status" defaultValue={params.status || 'all'} className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-[#FF6B35] text-white text-sm rounded-lg hover:bg-[#e55a25] transition-colors">
              Filter
            </button>
          </form>
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Starts</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subs.map((s: SubscriptionRow) => (
                  <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{s.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{s.user?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.plan === 'gold' ? 'warning' : s.plan === 'silver' ? 'info' : 'secondary'}>
                        {s.plan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.status === 'active' ? 'success' : s.status === 'expired' ? 'danger' : 'secondary'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(s.starts_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(s.ends_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <SubscriptionActions subscriptionId={s.id} status={s.status} />
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <CreditCard className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No subscriptions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
