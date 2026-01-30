import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface FavoritesState {
  favorites: Set<string>;
  loading: boolean;
  fetchFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (userId: string, propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set<string>(),
  loading: false,

  fetchFavorites: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', userId);

      if (error) throw error;

      const favoriteIds = new Set(data?.map(f => f.property_id) || []);
      set({ favorites: favoriteIds, loading: false });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      set({ loading: false });
    }
  },

  toggleFavorite: async (userId: string, propertyId: string) => {
    const { favorites } = get();
    const isFav = favorites.has(propertyId);

    try {
      if (isFav) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId);

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.delete(propertyId);
        set({ favorites: newFavorites });
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, property_id: propertyId });

        if (error) throw error;

        const newFavorites = new Set(favorites);
        newFavorites.add(propertyId);
        set({ favorites: newFavorites });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  },

  isFavorite: (propertyId: string) => {
    return get().favorites.has(propertyId);
  },
}));
