export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PropertyActions } from '@/components/properties/property-actions';
import { PropertyGallery } from '@/components/properties/property-gallery';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize, Calendar,
  User, Phone, Mail, MessageSquare, Star, IndianRupee, CheckCircle,
} from 'lucide-react';

async function getPropertyDetail(id: string) {
  const supabase = createAdminClient();

  const [
    { data: property },
    { data: inquiries },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('properties')
      .select(`
        *,
        owner:users_profiles!properties_owner_id_fkey(user_id, name, email, phone, avatar_url, role),
        broker:users_profiles!properties_broker_id_fkey(user_id, name, email, phone, avatar_url, role)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('inquiries')
      .select('id, message, created_at, user:users_profiles(name, email, avatar_url)')
      .eq('property_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user:users_profiles(name, avatar_url)')
      .eq('property_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return { property, inquiries: inquiries || [], reviews: reviews || [] };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { property, inquiries, reviews } = await getPropertyDetail(id);

  if (!property) notFound();

  const photos: string[] = property.photos || (property.image_url ? [property.image_url] : []);
  const contact = property.owner || property.broker;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : null;

  return (
    <div>
      <Topbar title="Property Detail" subtitle={property.title} />

      <div className="p-6 space-y-6">
        {/* Back */}
        <a href="/properties" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Properties
        </a>

        {/* Photo Gallery */}
        <PropertyGallery photos={photos} title={property.title} />

        {/* Header Card */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={property.type === 'buy' ? 'info' : 'warning'} className="uppercase text-xs">
                  {property.type}
                </Badge>
                {property.verified && <Badge variant="success">Verified</Badge>}
                {property.featured && <Badge variant="default">Featured</Badge>}
                {!property.verified && !property.featured && <Badge variant="secondary">Pending</Badge>}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{property.title}</h2>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
                <MapPin size={14} />
                <span>{property.locality}, {property.city}</span>
                {property.state && <span className="text-gray-600">· {property.state}</span>}
              </div>
              <p className="text-2xl font-bold text-[#FF6B35]">{formatCurrency(property.price)}</p>
            </div>
            <div className="shrink-0">
              <PropertyActions
                propertyId={property.id}
                isVerified={property.verified}
                isFeatured={property.featured}
              />
            </div>
          </div>

          {/* Quick specs */}
          <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-gray-800">
            {property.bhk && (
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <BedDouble size={15} className="text-gray-500" /> {property.bhk}
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <Bath size={15} className="text-gray-500" /> {property.bathrooms} Bath
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1.5 text-sm text-gray-300">
                <Maximize size={15} className="text-gray-500" /> {property.area} sq.ft
              </div>
            )}
            {property.furnishing && (
              <div className="text-sm text-gray-300 capitalize">{property.furnishing}</div>
            )}
            {property.facing && (
              <div className="text-sm text-gray-300 capitalize">{property.facing} Facing</div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-gray-300">
              <Calendar size={15} className="text-gray-500" /> Listed {formatDate(property.created_at)}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details + Contact */}
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {[
                    { label: 'Property ID', value: property.id?.slice(0, 8) + '...' },
                    { label: 'Category', value: property.category || '—' },
                    { label: 'Floor', value: property.floor != null ? `${property.floor}` : '—' },
                    { label: 'Total Floors', value: property.total_floors != null ? `${property.total_floors}` : '—' },
                    { label: 'Age', value: property.age ? `${property.age} yrs` : '—' },
                    { label: 'Parking', value: property.parking ? 'Yes' : 'No' },
                    { label: 'Pet Friendly', value: property.pet_friendly ? 'Yes' : 'No' },
                    { label: 'Pincode', value: property.pincode || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-sm text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {contact && (
              <Card>
                <CardHeader>
                  <CardTitle>{property.owner ? 'Owner' : 'Broker'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    {contact.avatar_url ? (
                      <img
                        src={contact.avatar_url}
                        alt={contact.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] font-bold text-lg">
                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{contact.name}</p>
                      <Badge variant={contact.role === 'broker' ? 'info' : 'warning'} className="mt-0.5">{contact.role}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                      <Mail size={13} /> {contact.email}
                    </a>
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <Phone size={13} /> {contact.phone}
                      </a>
                    )}
                  </div>
                  <a
                    href={`/users/${contact.user_id}`}
                    className="mt-4 block text-center text-xs text-[#FF6B35] hover:underline"
                  >
                    View full profile →
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Description + Amenities + Inquiries + Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {property.description && (
              <Card>
                <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{property.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a: string) => (
                      <span
                        key={a}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300"
                      >
                        <CheckCircle size={11} className="text-green-400" /> {a}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inquiries */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between mb-0">
                <CardTitle>Inquiries ({inquiries.length})</CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                {inquiries.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No inquiries yet</p>
                ) : (
                  <div className="space-y-3">
                    {inquiries.map((inq: any) => (
                      <div key={inq.id} className="flex gap-3 py-2 border-b border-gray-800 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-purple-400/10 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0">
                          {inq.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{inq.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 mb-1">{inq.user?.email}</p>
                          <p className="text-sm text-gray-400 line-clamp-2">{inq.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{formatDateTime(inq.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between mb-0">
                <CardTitle>Reviews ({reviews.length})</CardTitle>
                {avgRating !== null && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-white">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="mt-4">
                {reviews.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No reviews yet</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="py-2 border-b border-gray-800 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white">{rev.user?.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-3">{rev.comment}</p>
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
    </div>
  );
}
