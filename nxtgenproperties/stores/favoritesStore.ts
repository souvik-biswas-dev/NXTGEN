import { create } from 'zustand';
import { api, hasSession } from '@/lib/api';

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
      if (!(await hasSession())) {
        set({ loading: false, favorites: new Set() });
        return;
      }
      const { ids } = await api.get<{ ids: string[] }>('/favorites');
      set({ favorites: new Set(ids), loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorites';
      console.error('Error fetching favorites:', errorMessage);
      set({ loading: false, error: errorMessage });
    }
  },

  toggleFavorite: async (propertyId: string) => {
    const { favorites } = get();
    const isFav = favorites.has(propertyId);
    // Optimistic update.
    const next = new Set(favorites);
    isFav ? next.delete(propertyId) : next.add(propertyId);
    set({ favorites: next });
    try {
      if (isFav) {
        await api.del(`/favorites/${propertyId}`);
      } else {
        await api.post('/favorites', { propertyId });
      }
    } catch (error) {
      // Roll back on failure.
      set({ favorites });
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite';
      console.error('Error toggling favorite:', errorMessage);
      set({ error: errorMessage });
      throw error;
    }
  },

  isFavorite: (propertyId: string) => get().favorites.has(propertyId),

  clearFavorites: () => set({ favorites: new Set(), error: null }),
}));
