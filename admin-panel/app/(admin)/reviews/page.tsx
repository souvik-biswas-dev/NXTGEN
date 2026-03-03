export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { ReviewActions } from '@/components/reviews/review-actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Star } from 'lucide-react';

interface ReviewRow {
  id: string;
  locality: string;
  city: string;
  rating: number;
  avg_price: number | null;
  comment_count: number;
  created_at: string;
  updated_at: string | null;
}

async function getReviews() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('locality_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const avgRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div>
      <Topbar title="Locality Reviews" subtitle={`${reviews.length} reviews`} />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4"><p className="text-2xl font-bold text-white">{reviews.length}</p><p className="text-xs text-gray-500 mt-1">Total Reviews</p></Card>
          <Card className="p-4"><p className="text-2xl font-bold text-white">{avgRating}</p><p className="text-xs text-gray-500 mt-1">Avg. Rating</p></Card>
          <Card className="p-4"><p className="text-2xl font-bold text-white">{new Set(reviews.map((r: ReviewRow) => r.city)).size}</p><p className="text-xs text-gray-500 mt-1">Cities</p></Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Locality</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg. Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reviews.map((r: ReviewRow) => (
                  <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{r.locality}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{r.city}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-white font-medium">{r.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {r.avg_price ? formatCurrency(r.avg_price) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{r.comment_count}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(r.updated_at || r.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <ReviewActions reviewId={r.id} currentRating={r.rating} avgPrice={r.avg_price ?? undefined} />
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Star className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No reviews yet</p>
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
