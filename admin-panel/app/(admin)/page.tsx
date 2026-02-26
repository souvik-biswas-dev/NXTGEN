export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, CreditCard, MessageSquare, TrendingUp, Star, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { DashboardCharts } from '@/components/dashboard/charts';

async function getDashboardStats() {
  const supabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: activeSubscriptions },
    { count: totalInquiries },
    { count: verifiedProperties },
    { count: featuredProperties },
    { data: recentProperties },
    { data: recentUsers },
    { data: subscriptionStats },
  ] = await Promise.all([
    supabase.from('users_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('properties').select('id, title, city, price, type, created_at, verified').order('created_at', { ascending: false }).limit(5),
    supabase.from('users_profiles').select('user_id, name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('subscriptions').select('plan, status').eq('status', 'active'),
  ]);

  const planCounts = (subscriptionStats || []).reduce(
    (acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalUsers: totalUsers || 0,
    totalProperties: totalProperties || 0,
    activeSubscriptions: activeSubscriptions || 0,
    totalInquiries: totalInquiries || 0,
    verifiedProperties: verifiedProperties || 0,
    featuredProperties: featuredProperties || 0,
    recentProperties: recentProperties || [],
    recentUsers: recentUsers || [],
    planCounts,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Properties', value: stats.totalProperties, icon: Building2, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
    { label: 'Total Inquiries', value: stats.totalInquiries, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Verified Properties', value: stats.verifiedProperties, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Featured Properties', value: stats.featuredProperties, icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  ];

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Welcome back! Here's what's happening." />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <DashboardCharts planCounts={stats.planCounts} />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Properties */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <CardTitle>Recent Properties</CardTitle>
              <a href="/properties" className="text-xs text-[#FF6B35] flex items-center gap-1 hover:underline">
                View all <ArrowUpRight size={12} />
              </a>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentProperties.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm text-white font-medium truncate max-w-[200px]">{p.title}</p>
                      <p className="text-xs text-gray-500">{p.city} · {formatDateTime(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-white font-medium">{formatCurrency(p.price)}</span>
                      {p.verified ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {stats.recentProperties.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">No properties yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between mb-4">
              <CardTitle>Recent Users</CardTitle>
              <a href="/users" className="text-xs text-[#FF6B35] flex items-center gap-1 hover:underline">
                View all <ArrowUpRight size={12} />
              </a>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentUsers.map((u: any) => (
                  <div key={u.user_id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] text-xs font-bold flex-shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <Badge
                      variant={
                        u.role === 'admin' ? 'danger' :
                        u.role === 'broker' ? 'info' :
                        u.role === 'owner' ? 'warning' : 'secondary'
                      }
                    >
                      {u.role}
                    </Badge>
                  </div>
                ))}
                {stats.recentUsers.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
