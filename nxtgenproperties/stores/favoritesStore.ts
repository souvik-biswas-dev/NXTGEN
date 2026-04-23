import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface FavoritesState {
  favorites: Set<string>;
  loading: boolean;
  error: string | null;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set<string>(),
  loading: false,
  error: null,

  fetchFavorites: async () => {
    set({ loading: true, error: null });
    try {
      // Use cached session — avoids a network round-trip to Supabase Auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        set({ loading: false, favorites: new Set() });
        return;
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const favoriteIds = new Set(data?.map((f) => f.property_id) || []);
      set({ favorites: favoriteIds, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorites';
      console.error('Error fetching favorites:', errorMessage);
      set({ loading: false, error: errorMessage });
    }
  },

  toggleFavorite: async (propertyId: string) => {
    const { favorites } = get();
    const isFav = favorites.has(propertyId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('User not authenticated');
      }

      if (isFav) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.delete(propertyId);
        set({ favorites: newFavorites });
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, property_id: propertyId });

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.add(propertyId);
        set({ favorites: newFavorites });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite';
      console.error('Error toggling favorite:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },

  isFavorite: (propertyId: string) => {
    return get().favorites.has(propertyId);
  },

  clearFavorites: () => {
    set({ favorites: new Set(), error: null });
  },
}));
