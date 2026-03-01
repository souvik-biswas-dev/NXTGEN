export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PropertyActions } from '@/components/properties/property-actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building2, CheckCircle, Star, Home } from 'lucide-react';

async function getProperties(search?: string, city?: string, type?: string, verified?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('properties')
    .select(`
      *,
      owner:users_profiles!properties_owner_id_fkey(name, email),
      broker:users_profiles!properties_broker_id_fkey(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`title.ilike.%${search}%,locality.ilike.%${search}%`);
  }
  if (city && city !== 'all') {
    query = query.eq('city', city);
  }
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }
  if (verified === 'true') query = query.eq('verified', true);
  if (verified === 'false') query = query.eq('verified', false);

  const { data } = await query;
  return data || [];
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string; type?: string; verified?: string }>;
}) {
  const params = await searchParams;
  const properties = await getProperties(params.search, params.city, params.type, params.verified);

  const stats = properties.reduce(
    (acc, p) => {
      if (p.verified) acc.verified++;
      if (p.featured) acc.featured++;
      if (p.type === 'buy') acc.buy++;
      if (p.type === 'rent') acc.rent++;
      return acc;
    },
    { verified: 0, featured: 0, buy: 0, rent: 0 }
  );

  return (
    <div>
      <Topbar title="Properties" subtitle={`${properties.length} listings`} />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <Home className="w-8 h-8 text-blue-400 shrink-0" />
            <div><p className="text-xl font-bold text-white">{properties.length}</p><p className="text-xs text-gray-500">Total</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
            <div><p className="text-xl font-bold text-white">{stats.verified}</p><p className="text-xs text-gray-500">Verified</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400 shrink-0" />
            <div><p className="text-xl font-bold text-white">{stats.featured}</p><p className="text-xs text-gray-500">Featured</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-purple-400 shrink-0" />
            <div><p className="text-xl font-bold text-white">{stats.buy} / {stats.rent}</p><p className="text-xs text-gray-500">Buy / Rent</p></div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form className="flex flex-wrap gap-3">
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Search by title or locality..."
              className="flex-1 min-w-50 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
            <select name="type" defaultValue={params.type || 'all'} className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]">
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
            <select name="verified" defaultValue={params.verified || 'all'} className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]">
              <option value="all">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-[#FF6B35] text-white text-sm rounded-lg hover:bg-[#e55a25] transition-colors">
              Search
            </button>
          </form>
        </Card>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {properties.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <a href={`/properties/${p.id}`} className="group">
                        <p className="text-sm font-medium text-white max-w-50 truncate group-hover:text-[#FF6B35] transition-colors">{p.title}</p>
                        <p className="text-xs text-gray-500">{p.locality}, {p.city}</p>
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.type === 'buy' ? 'info' : 'warning'}>
                        {p.type} · {p.bhk}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">{p.owner?.name || p.broker?.name || '—'}</p>
                      <p className="text-xs text-gray-600">{p.owner?.email || p.broker?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {p.verified && <Badge variant="success">Verified</Badge>}
                        {p.featured && <Badge variant="default">Featured</Badge>}
                        {!p.verified && !p.featured && <Badge variant="secondary">Pending</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(p.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <PropertyActions
                        propertyId={p.id}
                        isVerified={p.verified}
                        isFeatured={p.featured}
                      />
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No properties found</p>
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
