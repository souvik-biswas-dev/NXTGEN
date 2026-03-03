export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserActions } from '@/components/users/user-actions';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, Calendar, Shield, Building2,
  MessageSquare, CreditCard, Star, User,
} from 'lucide-react';

interface UserProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  type: string;
  bhk: string;
  verified: boolean;
  featured: boolean;
  created_at: string;
}

interface UserInquiry {
  id: string;
  message: string;
  created_at: string;
  property: { title: string }[];
}

interface UserReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  property: { title: string }[];
}

async function getUserDetail(id: string) {
  const supabase = createAdminClient();

  const [
    { data: profile },
    { data: properties },
    { data: inquiries },
    { data: subscription },
    { data: reviews },
  ] = await Promise.all([
    supabase.from('users_profiles').select('*').eq('user_id', id).single(),
    supabase.from('properties').select('id, title, city, price, type, bhk, verified, featured, created_at').eq('owner_id', id).order('created_at', { ascending: false }),
    supabase.from('inquiries').select('id, message, created_at, property:properties(title)').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('subscriptions').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('reviews').select('id, rating, comment, created_at, property:properties(title)').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
  ]);

  return { profile, properties: properties || [], inquiries: inquiries || [], subscription, reviews: reviews || [] };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, properties, inquiries, subscription, reviews } = await getUserDetail(id);

  if (!profile) notFound();

  const roleBadgeVariant =
    profile.role === 'admin' ? 'danger' :
    profile.role === 'broker' ? 'info' :
    profile.role === 'owner' ? 'warning' : 'secondary';

  return (
    <div>
      <Topbar title="User Profile" subtitle={profile.name} />

      <div className="p-6 space-y-6">
        {/* Back */}
        <a href="/users" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Users
        </a>

        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center border-2 border-[#FF6B35]/30">
                  <span className="text-3xl font-bold text-[#FF6B35]">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <Badge variant={roleBadgeVariant}>{profile.role}</Badge>
                {profile.verified_broker && <Badge variant="success">Verified Broker</Badge>}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Mail size={13} /> {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Phone size={13} /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Calendar size={13} /> Joined {formatDate(profile.created_at)}
                </span>
              </div>
              {profile.bio && (
                <p className="mt-2 text-sm text-gray-500 max-w-xl">{profile.bio}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              <UserActions
                userId={profile.user_id}
                currentRole={profile.role}
                isVerifiedBroker={profile.verified_broker}
              />
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-white">{properties.length}</p>
              <p className="text-xs text-gray-500">Properties</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-purple-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-white">{inquiries.length}</p>
              <p className="text-xs text-gray-500">Inquiries</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-white">{reviews.length}</p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#FF6B35] flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-white capitalize">{subscription?.plan || 'Free'}</p>
              <p className="text-xs text-gray-500">
                {subscription ? (
                  <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                    {subscription.status}
                  </Badge>
                ) : 'No plan'}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Properties Listed</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">No properties listed</p>
              ) : (
                <div className="space-y-2">
                  {properties.map((p: UserProperty) => (
                    <a
                      key={p.id}
                      href={`/properties/${p.id}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-800 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate group-hover:text-[#FF6B35] transition-colors">
                          {p.title}
                        </p>
                        <p className="text-xs text-gray-500">{p.city} · {formatDate(p.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-sm font-medium text-white">{formatCurrency(p.price)}</span>
                        {p.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {!subscription ? (
                <p className="text-gray-600 text-sm text-center py-6">No subscription found</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Plan', value: <span className="capitalize font-semibold text-white">{subscription.plan}</span> },
                    { label: 'Status', value: <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'}>{subscription.status}</Badge> },
                    { label: 'Started', value: subscription.created_at ? formatDate(subscription.created_at) : '—' },
                    { label: 'Expires', value: subscription.expires_at ? formatDate(subscription.expires_at) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-gray-300">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              {inquiries.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">No inquiries sent</p>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq: UserInquiry) => (
                    <div key={inq.id} className="py-2 border-b border-gray-800 last:border-0">
                      <p className="text-xs text-[#FF6B35] font-medium mb-0.5 truncate">
                        {inq.property?.[0]?.title || 'Unknown property'}
                      </p>
                      <p className="text-sm text-gray-300 line-clamp-2">{inq.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(inq.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews Given</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-6">No reviews given</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev: UserReview) => (
                    <div key={rev.id} className="py-2 border-b border-gray-800 last:border-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs text-[#FF6B35] font-medium truncate max-w-[200px]">
                          {rev.property?.[0]?.title || 'Unknown property'}
                        </p>
                        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={11}
                              className={i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">{rev.comment}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(rev.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
