import { create } from 'zustand';
import { Property, SearchFilters } from '@/types';
import { api } from '@/lib/api';

interface PlatformCity {
  id: string;
  name: string;
  properties: number;
}

interface NewLaunch {
  id: string;
  name: string;
  developer: string;
  location: string;
  priceRange: string;
  image: string;
  launchDate: string;
}

interface MarketTrend {
  city: string;
  trend: string;
  change: string;
  avgPrice: string;
  period: string;
}

interface PriceRange {
  label: string;
  min: number;
  max: number | null;
}

interface PropertiesState {
  properties: Property[];
  filteredProperties: Property[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchQuery: string;
  recentSearches: string[];

  // Platform data
  popularCities: PlatformCity[];
  popularLocalities: Record<string, string[]>;
  newLaunches: NewLaunch[];
  marketTrends: MarketTrend[];
  priceRanges: Record<string, PriceRange[]>;
  allAmenities: string[];
  platformDataLoaded: boolean;
  propertiesLoaded: boolean;

  // Actions
  fetchProperties: (preferredCities?: string[], force?: boolean) => Promise<void>;
  fetchPlatformData: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  searchProperties: (query: string) => Promise<void>;
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  filterProperties: (
    filters: SearchFilters,
    opts?: { query?: string; append?: boolean }
  ) => Promise<void>;
  loadMoreFiltered: () => Promise<void>;
  filterByPreferredCities: (cities: string[]) => Property[];
  getPropertyById: (id: string) => Promise<Property | undefined>;
  getFeaturedProperties: () => Property[];
  getNearbyProperties: (type: 'buy' | 'rent') => Property[];
  getPropertiesByCity: (city: string) => Property[];
  getPropertiesByCategory: (category: 'residential' | 'commercial') => Property[];
  getMyListings: () => Promise<Property[]>;
  updateProperty: (id: string, patch: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  getSimilarProperties: (property: Property, limit?: number) => Promise<Property[]>;
  sort?: import('@/types').SortOrder;
  setSort: (order: import('@/types').SortOrder) => void;
  // Cache of the last filter+query used, so load-more keeps parity.
  _lastFilters?: SearchFilters;
  _lastQuery?: string;
}

const PAGE_SIZE = 20;

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  filteredProperties: [],
  loading: false,
  loadingMore: false,
  hasMore: false,
  searchQuery: '',
  recentSearches: [],

  // Platform data defaults
  popularCities: [],
  popularLocalities: {},
  newLaunches: [],
  marketTrends: [],
  priceRanges: {
    buy: [
      { label: 'Under ₹50 Lakh', min: 0, max: 5000000 },
      { label: '₹50 Lakh - ₹1 Cr', min: 5000000, max: 10000000 },
      { label: '₹1 Cr - ₹2 Cr', min: 10000000, max: 20000000 },
      { label: '₹2 Cr - ₹5 Cr', min: 20000000, max: 50000000 },
      { label: 'Above ₹5 Cr', min: 50000000, max: null },
    ],
    rent: [
      { label: 'Under ₹15K', min: 0, max: 15000 },
      { label: '₹15K - ₹30K', min: 15000, max: 30000 },
      { label: '₹30K - ₹50K', min: 30000, max: 50000 },
      { label: '₹50K - ₹1 Lakh', min: 50000, max: 100000 },
      { label: 'Above ₹1 Lakh', min: 100000, max: null },
    ],
  },
  allAmenities: [],
  platformDataLoaded: false,
  propertiesLoaded: false,

  fetchProperties: async (preferredCities?: string[], force = false) => {
    if (!force && get().propertiesLoaded) return;
    set({ loading: true });
    try {
      const { items } = await api.get<{ items: Property[] }>('/properties', { limit: 50 }, false);
      let allProperties = items || [];

      // Client-side preferred-city sort: O(n) stable partition
      if (preferredCities && preferredCities.length > 0) {
        const preferred = allProperties.filter((p) =>
          preferredCities.some((c) => p.city.toLowerCase() === c.toLowerCase())
        );
        const others = allProperties.filter(
          (p) => !preferredCities.some((c) => p.city.toLowerCase() === c.toLowerCase())
        );
        allProperties = [...preferred, ...others];
      }

      set({
        properties: allProperties,
        filteredProperties: allProperties,
        loading: false,
        propertiesLoaded: true,
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      set({ loading: false });
    }
  },

  fetchPlatformData: async () => {
    try {
      const platformMap = await api.get<Record<string, unknown>>('/platform-data', undefined, false);

      set({
        popularCities: (platformMap.popular_cities as PlatformCity[]) ?? [],
        popularLocalities: (platformMap.popular_localities as Record<string, string[]>) ?? {},
        newLaunches: (platformMap.new_launches as NewLaunch[]) ?? [],
        marketTrends: (platformMap.market_trends as MarketTrend[]) ?? [],
        priceRanges:
          (platformMap.price_ranges as Record<string, PriceRange[]>) ?? get().priceRanges,
        allAmenities: (platformMap.amenities as string[]) ?? [],
        platformDataLoaded: true,
      });
    } catch (error) {
      console.error('Error fetching platform data:', error);
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ filteredProperties: get().properties });
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = get().properties.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.locality.toLowerCase().includes(lowerQuery) ||
        p.city.toLowerCase().includes(lowerQuery) ||
        p.bhk.toLowerCase().includes(lowerQuery)
    );
    set({ filteredProperties: filtered });
  },

  searchProperties: async (query: string) => {
    if (!query.trim()) {
      set({ filteredProperties: get().properties });
      return;
    }

    set({ loading: true });
    try {
      const { items } = await api.get<{ items: Property[] }>(
        '/properties',
        { q: query, limit: 30 },
        false
      );
      set({ filteredProperties: items || [], loading: false });
    } catch (error) {
      console.error('Error searching properties:', error);
      set({ loading: false });
    }
  },

  addRecentSearch: (search) => {
    const { recentSearches } = get();
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5);
    set({ recentSearches: updated });
  },

  clearRecentSearches: () => set({ recentSearches: [] }),

  filterProperties: async (filters: SearchFilters, opts?: { query?: string; append?: boolean }) => {
    const textQuery = (opts?.query ?? get().searchQuery).trim();
    const append = opts?.append === true;
    const existing = append ? get().filteredProperties : [];
    const offset = existing.length;

    set({
      loading: !append,
      loadingMore: append,
      _lastFilters: filters,
      _lastQuery: textQuery,
    });

    try {
      const params: Record<string, unknown> = {
        sort: get().sort,
        offset,
        limit: PAGE_SIZE,
      };
      if (textQuery.length > 0) params.q = textQuery;
      if (filters.city) params.city = filters.city;
      if (filters.locality) params.locality = filters.locality;
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      if (filters.minArea !== undefined) params.minArea = filters.minArea;
      if (filters.maxArea !== undefined) params.maxArea = filters.maxArea;
      if (filters.possession) params.possession = filters.possession;
      if (filters.ownerOnly) params.ownerOnly = 'true';
      if (filters.bhk && filters.bhk.length > 0) params.bhk = filters.bhk.join(',');
      if (filters.furnishing && filters.furnishing.length > 0)
        params.furnishing = filters.furnishing.join(',');
      if (filters.facing && filters.facing.length > 0) params.facing = filters.facing.join(',');

      const { items } = await api.get<{ items: Property[] }>('/properties', params, false);
      const page = items ?? [];
      set({
        filteredProperties: append ? [...existing, ...page] : page,
        hasMore: page.length === PAGE_SIZE,
        loading: false,
        loadingMore: false,
      });
    } catch (error) {
      console.error('Error filtering properties:', error);
      set({ loading: false, loadingMore: false });
    }
  },

  loadMoreFiltered: async () => {
    const state = get();
    if (state.loading || state.loadingMore || !state.hasMore) return;
    const filters = state._lastFilters ?? {};
    await get().filterProperties(filters, { query: state._lastQuery, append: true });
  },

  filterByPreferredCities: (cities) => {
    const { properties } = get();
    if (!cities || cities.length === 0) return properties;

    const preferred = properties.filter((p) =>
      cities.some((city) => p.city.toLowerCase() === city.toLowerCase())
    );
    const others = properties.filter(
      (p) => !cities.some((city) => p.city.toLowerCase() === city.toLowerCase())
    );
    return [...preferred, ...others];
  },

  getPropertyById: async (id: string) => {
    const cached = get().properties.find((p) => p.id === id);
    if (cached) return cached;

    try {
      return await api.get<Property>(`/properties/${id}`, undefined, false);
    } catch (error) {
      console.error('Error fetching property:', error);
      return undefined;
    }
  },

  getFeaturedProperties: () => {
    return get().properties.filter((p) => p.featured);
  },

  getNearbyProperties: (type) => {
    return get()
      .properties.filter((p) => p.type === type)
      .slice(0, 6);
  },

  getPropertiesByCity: (city) => {
    return get().properties.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  },

  getPropertiesByCategory: (category) => {
    return get().properties.filter((p) => p.category === category);
  },

  getMyListings: async () => {
    try {
      const { items } = await api.get<{ items: Property[] }>('/properties/mine');
      return items ?? [];
    } catch (error) {
      console.error('Error fetching my listings:', error);
      return [];
    }
  },

  updateProperty: async (id, patch) => {
    await api.patch(`/properties/${id}`, patch);
    // Keep local caches in sync.
    set({
      properties: get().properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      filteredProperties: get().filteredProperties.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });
  },

  deleteProperty: async (id) => {
    await api.del(`/properties/${id}`);
    set({
      properties: get().properties.filter((p) => p.id !== id),
      filteredProperties: get().filteredProperties.filter((p) => p.id !== id),
    });
  },

  getSimilarProperties: async (property, limit = 6) => {
    try {
      const { items } = await api.get<{ items: Property[] }>(
        `/properties/${property.id}/similar`,
        { limit },
        false
      );
      return items ?? [];
    } catch (error) {
      console.error('Error fetching similar properties:', error);
      return [];
    }
  },

  sort: 'relevance',
  setSort: (order) => {
    set({ sort: order });
    const state = get();
    // Re-apply the last filter set so the new order kicks in immediately.
    get().filterProperties(state._lastFilters ?? {}, { query: state._lastQuery });
  },
}));
