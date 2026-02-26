'use client';

import { useState, useTransition } from 'react';
import { updatePlatformData } from '@/app/actions/subscriptions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Save, RotateCcw } from 'lucide-react';

interface Props {
  dataKey: string;
  initialData: unknown;
  updatedAt: string;
}

export function PlatformDataEditor({ dataKey, initialData, updatedAt }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState(JSON.stringify(initialData, null, 2));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError('');
    setSuccess(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch (e) {
      setError('Invalid JSON format');
      return;
    }
    startTransition(async () => {
      const result = await updatePlatformData(dataKey, parsed);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  const handleReset = () => {
    setValue(JSON.stringify(initialData, null, 2));
    setError('');
    setSuccess(false);
  };

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-[#FF6B35]">{dataKey}</span>
          <span className="text-xs text-gray-500">
            Updated: {new Date(updatedAt).toLocaleDateString('en-IN')}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-800">
          <div className="mt-4">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={12}
              spellCheck={false}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-y"
            />
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="mt-2 text-xs text-green-400 bg-green-900/20 border border-green-800 rounded px-3 py-2">
              Saved successfully!
            </p>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} loading={isPending} size="sm">
              <Save size={14} />
              Save Changes
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" disabled={isPending}>
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
