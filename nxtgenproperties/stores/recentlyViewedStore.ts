import { create } from 'zustand';
import { Property } from '@/types';
import { supabase } from '@/lib/supabase';

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { error } = await supabase
        .from('recently_viewed')
        .upsert(
          { user_id: user.id, property_id: propertyId, viewed_at: new Date().toISOString() },
          { onConflict: 'user_id,property_id' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
  },

  fetchRecentlyViewed: async () => {
    set({ loading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('recently_viewed')
        .select('*, property:properties(*)')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      const items = (data ?? []).map((row: { property: Property }) => row.property).filter(Boolean);
      set({ recentItems: items });
    } catch (error) {
      console.error('Error fetching recently viewed:', error);
    } finally {
      set({ loading: false });
    }
  },

  clearRecentlyViewed: async () => {
    set({ loading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        set({ loading: false });
        return;
      }

      const { error } = await supabase.from('recently_viewed').delete().eq('user_id', user.id);

      if (error) throw error;
      set({ recentItems: [] });
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
