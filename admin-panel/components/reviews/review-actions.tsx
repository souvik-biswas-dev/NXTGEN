'use client';

import { useState, useTransition } from 'react';
import { updateLocalityReview, deleteLocalityReview } from '@/app/actions/subscriptions';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

interface Props {
  reviewId: string;
  currentRating: number;
  avgPrice?: number;
}

export function ReviewActions({ reviewId, currentRating, avgPrice }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(String(currentRating));
  const [price, setPrice] = useState(String(avgPrice || ''));
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateLocalityReview(reviewId, parseFloat(rating), price ? parseInt(price) : undefined);
      if (result?.error) {
        alert(result.error);
        return;
      }
      setEditing(false);
      setOpen(false);
    });
  };

  const handleDelete = () => {
    if (!confirm('Delete this review?')) return;
    startTransition(async () => {
      const result = await deleteLocalityReview(reviewId);
      if (result?.error) alert(result.error);
    });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <input
          type="number"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          min="0"
          max="5"
          step="0.1"
          className="w-16 rounded bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
          placeholder="Rating"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 rounded bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
          placeholder="Avg Price"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-2 py-1 bg-[#FF6B35] text-white text-xs rounded hover:bg-[#e55a25] transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

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
          <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
            <button
              onClick={() => { setEditing(true); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Edit2 size={14} />
              Edit Rating
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
