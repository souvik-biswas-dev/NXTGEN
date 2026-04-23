import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Property, SearchFilters } from '@/types';

export const useProperties = (filters?: SearchFilters, limit: number = 20) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchProperties = async (offset: number = 0) => {
    try {
      setLoading(true);
      let query = supabase
        .from('properties')
        .select(
          `
          *,
          owner:users_profiles!properties_owner_id_fkey(id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at),
          broker:users_profiles!properties_broker_id_fkey(id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at)
        `
        )
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.locality) {
        query = query.ilike('locality', `%${filters.locality}%`);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.bhk && filters.bhk.length > 0) {
        query = query.in('bhk', filters.bhk);
      }
      if (filters?.furnishing && filters.furnishing.length > 0) {
        query = query.in('furnishing', filters.furnishing);
      }
      if (filters?.minArea !== undefined) {
        query = query.gte('area_sqft', filters.minArea);
      }
      if (filters?.maxArea !== undefined) {
        query = query.lte('area_sqft', filters.maxArea);
      }
      if (filters?.possession) {
        query = query.eq('possession', filters.possession);
      }
      if (filters?.ownerOnly) {
        query = query.not('owner_id', 'is', null);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (offset === 0) {
        setProperties(data || []);
      } else {
        setProperties((prev) => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === limit);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProperties(properties.length);
    }
  };

  const refresh = () => {
    setProperties([]);
    fetchProperties(0);
  };

  return { properties, loading, error, hasMore, loadMore, refresh };
};

export const useFeaturedProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
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
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return { properties, loading, refresh: fetchFeatured };
};

export const usePreferredCitiesProperties = (preferredCities?: string[], limit: number = 20) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preferredCities && preferredCities.length > 0) {
      fetchByPreferredCities();
    } else {
      setProperties([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredCities]);

  const fetchByPreferredCities = async () => {
    try {
      setLoading(true);

      // Fetch properties from preferred cities with case-insensitive match
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select(
          `
          *,
          owner:users_profiles!properties_owner_id_fkey(id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at),
          broker:users_profiles!properties_broker_id_fkey(id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at)
        `
        )
        .in('city', preferredCities || [])
        .limit(limit)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProperties(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching properties by preferred cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (preferredCities && preferredCities.length > 0) {
      fetchByPreferredCities();
    }
  };

  return { properties, loading, error, refresh };
};

export const useProperty = (id: string) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError;
      setProperty(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching property:', err);
    } finally {
      setLoading(false);
    }
  };

  return { property, loading, error, refresh: fetchProperty };
};
