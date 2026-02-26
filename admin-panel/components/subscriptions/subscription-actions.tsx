'use client';

import { useState, useTransition } from 'react';
import { cancelSubscription, extendSubscription } from '@/app/actions/subscriptions';
import { MoreHorizontal, XCircle, CalendarPlus } from 'lucide-react';

interface Props {
  subscriptionId: string;
  status: string;
}

export function SubscriptionActions({ subscriptionId, status }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm('Cancel this subscription?')) return;
    startTransition(async () => {
      await cancelSubscription(subscriptionId);
      setOpen(false);
    });
  };

  const handleExtend = (days: number) => {
    startTransition(async () => {
      await extendSubscription(subscriptionId, days);
      setOpen(false);
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Extend</p>
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => handleExtend(days)}
                disabled={isPending}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <CalendarPlus size={14} />
                +{days} days
              </button>
            ))}
            {status === 'active' && (
              <div className="border-t border-gray-700 mt-1 pt-1">
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
