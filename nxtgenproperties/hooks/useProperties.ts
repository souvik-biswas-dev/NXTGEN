import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Property, SearchFilters } from '@/types';

function filtersToParams(filters?: SearchFilters): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (!filters) return p;
  if (filters.city) p.city = filters.city;
  if (filters.locality) p.locality = filters.locality;
  if (filters.type) p.type = filters.type;
  if (filters.category) p.category = filters.category;
  if (filters.minPrice !== undefined) p.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) p.maxPrice = filters.maxPrice;
  if (filters.minArea !== undefined) p.minArea = filters.minArea;
  if (filters.maxArea !== undefined) p.maxArea = filters.maxArea;
  if (filters.possession) p.possession = filters.possession;
  if (filters.ownerOnly) p.ownerOnly = 'true';
  if (filters.bhk?.length) p.bhk = filters.bhk.join(',');
  if (filters.furnishing?.length) p.furnishing = filters.furnishing.join(',');
  if (filters.facing?.length) p.facing = filters.facing.join(',');
  return p;
}

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
      const { items } = await api.get<{ items: Property[] }>(
        '/properties',
        { ...filtersToParams(filters), offset, limit },
        false
      );
      const data = items ?? [];
      setProperties((prev) => (offset === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === limit);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) fetchProperties(properties.length);
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
      // Default sort puts featured first; take the top slice.
      const { items } = await api.get<{ items: Property[] }>('/properties', { limit: 20 }, false);
      setProperties((items ?? []).filter((p) => p.featured).slice(0, 10));
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
      // One request per city, then merge (the API filters a single city at a time).
      const results = await Promise.all(
        (preferredCities ?? []).map((city) =>
          api.get<{ items: Property[] }>('/properties', { city, limit }, false).then((r) => r.items)
        )
      );
      const merged = ([] as Property[]).concat(...results);
      const seen = new Set<string>();
      setProperties(merged.filter((p) => (seen.has(p.id) ? false : seen.add(p.id))));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error fetching properties by preferred cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (preferredCities && preferredCities.length > 0) fetchByPreferredCities();
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
      const data = await api.get<Property>(`/properties/${id}`, undefined, false);
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
