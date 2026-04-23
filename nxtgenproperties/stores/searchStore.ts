import { create } from 'zustand';
import { SearchFilters } from '@/types';

interface SearchState extends SearchFilters {
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  getActiveFilterCount: () => number;
}

const initialFilters: SearchFilters = {
  city: undefined,
  locality: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  type: undefined,
  category: undefined,
  bhk: [],
  furnishing: [],
  minArea: undefined,
  maxArea: undefined,
  possession: undefined,
  ownerOnly: false,
  facing: [],
  amenities: [],
};

export const useSearchStore = create<SearchState>((set, get) => ({
  ...initialFilters,

  setFilters: (filters) => set((state) => ({ ...state, ...filters })),

  resetFilters: () => set(initialFilters),

  getActiveFilterCount: () => {
    const state = get();
    let count = 0;

    if (state.city) count++;
    if (state.locality) count++;
    if (state.minPrice !== undefined) count++;
    if (state.maxPrice !== undefined) count++;
    if (state.type) count++;
    if (state.category) count++;
    if (state.bhk && state.bhk.length > 0) count++;
    if (state.furnishing && state.furnishing.length > 0) count++;
    if (state.minArea !== undefined) count++;
    if (state.maxArea !== undefined) count++;
    if (state.possession) count++;
    if (state.ownerOnly) count++;
    if (state.facing && state.facing.length > 0) count++;
    if (state.amenities && state.amenities.length > 0) count++;

    return count;
  },
}));
