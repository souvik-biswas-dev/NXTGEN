'use client';

import { useState, useTransition } from 'react';
import { togglePropertyVerified, togglePropertyFeatured, deleteProperty } from '@/app/actions/properties';
import { MoreHorizontal, CheckCircle, XCircle, Star, StarOff, Trash2 } from 'lucide-react';

interface Props {
  propertyId: string;
  isVerified: boolean;
  isFeatured: boolean;
}

export function PropertyActions({ propertyId, isVerified, isFeatured }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleVerify = () => {
    startTransition(async () => {
      await togglePropertyVerified(propertyId, !isVerified);
      setOpen(false);
    });
  };

  const handleFeature = () => {
    startTransition(async () => {
      await togglePropertyFeatured(propertyId, !isFeatured);
      setOpen(false);
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    startTransition(async () => {
      await deleteProperty(propertyId);
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
            <button
              onClick={handleVerify}
              disabled={isPending}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {isVerified ? <XCircle size={14} /> : <CheckCircle size={14} />}
              {isVerified ? 'Remove Verification' : 'Verify Property'}
            </button>
            <button
              onClick={handleFeature}
              disabled={isPending}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {isFeatured ? <StarOff size={14} /> : <Star size={14} />}
              {isFeatured ? 'Remove Featured' : 'Mark as Featured'}
            </button>
            <div className="border-t border-gray-700 mt-1 pt-1">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
              >
                <Trash2 size={14} />
                Delete Property
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
