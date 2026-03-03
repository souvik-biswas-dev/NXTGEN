export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserActions } from '@/components/users/user-actions';
import { formatDate } from '@/lib/utils';
import { Users } from 'lucide-react';

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  verified_broker: boolean;
  created_at: string;
}

async function getUsers(search?: string, role?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('users_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  const { data, error } = await query.limit(200);
  return data || [];
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const params = await searchParams;
  const users = await getUsers(params.search, params.role);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <Topbar title="Users" subtitle={`${users.length} total users`} />

      <div className="p-6 space-y-6">
        {/* Role Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['buyer', 'owner', 'broker', 'admin'].map((role) => (
            <Card key={role} className="p-4">
              <p className="text-2xl font-bold text-white">{roleCounts[role] || 0}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{role}s</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form className="flex flex-wrap gap-3">
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Search by name or email..."
              className="flex-1 min-w-50 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
            <select
              name="role"
              defaultValue={params.role || 'all'}
              className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="owner">Owner</option>
              <option value="broker">Broker</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-[#FF6B35] text-white text-sm rounded-lg hover:bg-[#e55a25] transition-colors"
            >
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
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user: UserProfile) => (
                  <tr key={user.user_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <a href={`/users/${user.user_id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] text-sm font-bold shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || '?'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-[#FF6B35] transition-colors">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.role === 'admin' ? 'danger' :
                          user.role === 'broker' ? 'info' :
                          user.role === 'owner' ? 'warning' : 'secondary'
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{user.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      {user.verified_broker ? (
                        <Badge variant="success">Verified Broker</Badge>
                      ) : (
                        <Badge variant="secondary">Standard</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <UserActions
                        userId={user.user_id}
                        currentRole={user.role}
                        isVerifiedBroker={user.verified_broker}
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No users found</p>
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
