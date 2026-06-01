import { create } from 'zustand';
import { Property } from '@/types';
import { api, hasSession } from '@/lib/api';

interface RecentlyViewedState {
  recentItems: Property[];
  loading: boolean;
  addToRecentlyViewed: (propertyId: string) => Promise<void>;
  fetchRecentlyViewed: () => Promise<void>;
  clearRecentlyViewed: () => Promise<void>;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set) => ({
  recentItems: [],
  loading: false,

  addToRecentlyViewed: async (propertyId: string) => {
    try {
      if (!(await hasSession())) return;
      await api.post('/recently-viewed', { propertyId });
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
  },

  fetchRecentlyViewed: async () => {
    set({ loading: true });
    try {
      if (!(await hasSession())) {
        set({ loading: false });
        return;
      }
      const { items } = await api.get<{ items: Property[] }>('/recently-viewed');
      set({ recentItems: items ?? [] });
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    } finally {
      set({ loading: false });
    }
  },

  clearRecentlyViewed: async () => {
    // Local-only clear (server keeps the rolling history capped at 20).
    set({ recentItems: [] });
  },
}));
