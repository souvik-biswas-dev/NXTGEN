export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface InquiryRow {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  from_user: { name: string; email: string } | null;
  to_user: { name: string; email: string } | null;
  property: { title: string; city: string } | null;
}

async function getInquiries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('inquiries')
    .select(`
      *,
      from_user:from_user_id(name, email),
      to_user:to_user_id(name, email),
      property:property_id(title, city)
    `)
    .order('created_at', { ascending: false })
    .limit(200);
  return data || [];
}

export default async function InquiriesPage() {
  const inquiries = await getInquiries();
  const unread = inquiries.filter((i: InquiryRow) => !i.read).length;

  return (
    <div>
      <Topbar title="Inquiries" subtitle={`${inquiries.length} total · ${unread} unread`} />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4"><p className="text-2xl font-bold text-white">{inquiries.length}</p><p className="text-xs text-gray-500 mt-1">Total Inquiries</p></Card>
          <Card className="p-4"><p className="text-2xl font-bold text-white">{unread}</p><p className="text-xs text-gray-500 mt-1">Unread</p></Card>
          <Card className="p-4"><p className="text-2xl font-bold text-white">{inquiries.length - unread}</p><p className="text-xs text-gray-500 mt-1">Read</p></Card>
        </div>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">To</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {inquiries.map((i: InquiryRow) => (
                  <tr key={i.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{i.from_user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{i.from_user?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{i.to_user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{i.to_user?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300 max-w-[150px] truncate">{i.property?.title || '—'}</p>
                      <p className="text-xs text-gray-600">{i.property?.city || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400 max-w-[200px] truncate">{i.message}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={i.read ? 'secondary' : 'info'}>{i.read ? 'Read' : 'Unread'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDateTime(i.created_at)}</td>
                  </tr>
                ))}
                {inquiries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No inquiries yet</p>
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
