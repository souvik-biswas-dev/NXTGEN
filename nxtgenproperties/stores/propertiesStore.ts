import { create } from 'zustand';
import { Property, SearchFilters } from '@/types';
import { dummyProperties } from '@/data/dummyProperties';

interface PropertiesState {
  properties: Property[];
  filteredProperties: Property[];
  loading: boolean;
  searchQuery: string;
  recentSearches: string[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  filterProperties: (filters: SearchFilters) => void;
  getPropertyById: (id: string) => Property | undefined;
  getFeaturedProperties: () => Property[];
  getNearbyProperties: (type: 'buy' | 'rent') => Property[];
  getPropertiesByCity: (city: string) => Property[];
  getPropertiesByCategory: (category: 'residential' | 'commercial') => Property[];
}

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: dummyProperties,
  filteredProperties: dummyProperties,
  loading: false,
  searchQuery: '',
  recentSearches: ['4 BHK in Sector 150', '2 BHK Flat in Gurgaon', 'Villa in Hyderabad'],

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    const { properties } = get();
    
    if (!query.trim()) {
      set({ filteredProperties: properties });
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = properties.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.locality.toLowerCase().includes(lowerQuery) ||
        p.city.toLowerCase().includes(lowerQuery) ||
        p.bhk.toLowerCase().includes(lowerQuery)
    );
    set({ filteredProperties: filtered });
  },

  addRecentSearch: (search) => {
    const { recentSearches } = get();
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5);
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => set({ recentSearches: [] }),

  filterProperties: (filters) => {
    const { properties } = get();
    set({ loading: true });

    let filtered = [...properties];

    if (filters.city) {
      filtered = filtered.filter((p) =>
        p.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    if (filters.locality) {
      filtered = filtered.filter((p) =>
        p.locality.toLowerCase().includes(filters.locality!.toLowerCase())
      );
    }

    if (filters.type) {
      filtered = filtered.filter((p) => p.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.bhk && filters.bhk.length > 0) {
      filtered = filtered.filter((p) => filters.bhk!.includes(p.bhk));
    }

    if (filters.furnishing && filters.furnishing.length > 0) {
      filtered = filtered.filter((p) => filters.furnishing!.includes(p.furnishing));
    }

    if (filters.minArea !== undefined) {
      filtered = filtered.filter((p) => p.area_sqft >= filters.minArea!);
    }

    if (filters.maxArea !== undefined) {
      filtered = filtered.filter((p) => p.area_sqft <= filters.maxArea!);
    }

    if (filters.possession) {
      filtered = filtered.filter((p) => p.possession === filters.possession);
    }

    if (filters.ownerOnly) {
      filtered = filtered.filter((p) => p.owner_id !== undefined || p.owner !== undefined);
    }

    set({ filteredProperties: filtered, loading: false });
  },

  getPropertyById: (id) => {
    return get().properties.find((p) => p.id === id);
  },

  getFeaturedProperties: () => {
    return get().properties.filter((p) => p.featured);
  },

  getNearbyProperties: (type) => {
    return get().properties.filter((p) => p.type === type).slice(0, 6);
  },

  getPropertiesByCity: (city) => {
    return get().properties.filter(
      (p) => p.city.toLowerCase() === city.toLowerCase()
    );
  },

  getPropertiesByCategory: (category) => {
    return get().properties.filter((p) => p.category === category);
  },
}));
