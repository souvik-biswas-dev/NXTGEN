import { create } from 'zustand';
import { Property, SearchFilters } from '@/types';
import { supabase } from '@/lib/supabase';

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
      // Single query for all cases — Postgres sorts preferred-city rows first via
      // a CASE expression emulated by ordering on a computed boolean column isn't
      // available in PostgREST, so we fetch one flat batch and re-sort client-side.
      // This halves round-trips when preferredCities is set (was 2 queries → 1).
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      let allProperties = data || [];

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
      const { data, error } = await supabase.from('platform_data').select('*');

      if (error) throw error;

      const platformMap: Record<string, unknown> = {};
      data?.forEach((item) => {
        platformMap[item.key] = item.data;
      });

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
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .or(`title.ilike.%${query}%,locality.ilike.%${query}%,city.ilike.%${query}%`)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      set({ filteredProperties: data || [], loading: false });
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
      let query = supabase.from('properties').select('*');

      const sort = get().sort;
      if (sort === 'price_low_high') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price_high_low') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'area_low_high') {
        query = query.order('area_sqft', { ascending: true });
      } else if (sort === 'area_high_low') {
        query = query.order('area_sqft', { ascending: false });
      } else {
        // newest / relevance / undefined — keep featured first, then recency.
        query = query
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + PAGE_SIZE - 1);

      if (textQuery.length > 0) {
        // Escape PostgREST-significant characters (comma, parens) and
        // search across the useful text columns in a single OR.
        const esc = textQuery.replace(/[(),*]/g, ' ').trim();
        if (esc.length > 0) {
          const pattern = `%${esc}%`;
          query = query.or(
            `title.ilike.${pattern},locality.ilike.${pattern},city.ilike.${pattern},description.ilike.${pattern}`
          );
        }
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.locality) {
        query = query.ilike('locality', `%${filters.locality}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.bhk && filters.bhk.length > 0) {
        query = query.in('bhk', filters.bhk);
      }
      if (filters.furnishing && filters.furnishing.length > 0) {
        query = query.in('furnishing', filters.furnishing);
      }
      if (filters.minArea !== undefined) {
        query = query.gte('area_sqft', filters.minArea);
      }
      if (filters.maxArea !== undefined) {
        query = query.lte('area_sqft', filters.maxArea);
      }
      if (filters.facing && filters.facing.length > 0) {
        query = query.in('facing', filters.facing);
      }
      if (filters.possession) {
        query = query.eq('possession', filters.possession);
      }
      if (filters.ownerOnly) {
        query = query.not('owner_id', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      const page = data ?? [];
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
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          *,
          owner:users_profiles!properties_owner_id_fkey(id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at),
          broker:users_profiles!properties_broker_id_fkey(id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .or(`owner_id.eq.${user.id},broker_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Property[]) ?? [];
    } catch (error) {
      console.error('Error fetching my listings:', error);
      return [];
    }
  },

  updateProperty: async (id, patch) => {
    const { error } = await supabase.from('properties').update(patch).eq('id', id);
    if (error) throw error;
    // Keep local caches in sync.
    set({
      properties: get().properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      filteredProperties: get().filteredProperties.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });
  },

  deleteProperty: async (id) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
    set({
      properties: get().properties.filter((p) => p.id !== id),
      filteredProperties: get().filteredProperties.filter((p) => p.id !== id),
    });
  },

  getSimilarProperties: async (property, limit = 6) => {
    try {
      // Similar = same city, same type, within ±30% price band, exclude self.
      const min = Math.floor(property.price * 0.7);
      const max = Math.ceil(property.price * 1.3);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .neq('id', property.id)
        .eq('city', property.city)
        .eq('type', property.type)
        .gte('price', min)
        .lte('price', max)
        .order('featured', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as Property[]) ?? [];
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
