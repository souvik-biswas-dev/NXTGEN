export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card } from '@/components/ui/card';
import { PlatformDataEditor } from '@/components/platform/platform-data-editor';
import { Database } from 'lucide-react';

interface PlatformDataRow {
  key: string;
  data: unknown;
  updated_at: string;
}

async function getPlatformData() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('platform_data').select('*').order('key');
  return data || [];
}

export default async function PlatformDataPage() {
  const platformData = await getPlatformData();

  return (
    <div>
      <Topbar title="Platform Data" subtitle="Manage app-wide dynamic content" />

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 bg-blue-900/20 border border-blue-800 rounded-xl px-4 py-3">
          <Database className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-300">
            Changes here affect the mobile app immediately. Be careful with JSON structure.
          </p>
        </div>

        {platformData.length === 0 ? (
          <Card className="py-12 text-center">
            <Database className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No platform data entries found.</p>
            <p className="text-gray-600 text-xs mt-1">Run the migration script to seed initial data.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {platformData.map((item: PlatformDataRow) => (
              <PlatformDataEditor key={item.key} dataKey={item.key} initialData={item.data} updatedAt={item.updated_at} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
