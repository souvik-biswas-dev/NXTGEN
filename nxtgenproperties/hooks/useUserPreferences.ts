import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  UserPreferences,
  SearchHistory,
  SearchFilters,
  PropertyType,
  PropertyCategory,
} from '@/types';
import { useAuthStore } from '@/stores/authStore';

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchUserPreferences();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend creates a default row on first fetch.
      const data = await api.get<UserPreferences>('/preferences');
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  const save = async (patch: Record<string, unknown>) => {
    try {
      const data = await api.put<UserPreferences>('/preferences', patch);
      setPreferences(data);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    }
  };

  const addToSearchHistory = async (
    query: string,
    filters?: SearchFilters,
    city?: string
  ): Promise<void> => {
    if (!user?.id || !preferences) return;
    const newSearchEntry: SearchHistory = {
      id: Date.now().toString(),
      query,
      filters,
      city: city || filters?.city,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [newSearchEntry, ...(preferences.search_history ?? [])].slice(0, 50);

    let preferred_cities = preferences.preferred_cities || [];
    if (city && !preferred_cities.includes(city)) {
      preferred_cities = [...preferred_cities, city].slice(0, 5);
    }
    let preferred_types = preferences.preferred_types || [];
    if (filters?.type && !preferred_types.includes(filters.type)) {
      preferred_types = [...preferred_types, filters.type];
    }
    let preferred_categories = preferences.preferred_categories || [];
    if (filters?.category && !preferred_categories.includes(filters.category)) {
      preferred_categories = [...preferred_categories, filters.category];
    }

    await save({
      search_history: updatedHistory,
      preferred_cities,
      preferred_types,
      preferred_categories,
      last_search_at: new Date().toISOString(),
    });
  };

  const updatePreferredCities = async (cities: string[]): Promise<void> => {
    if (!user?.id) return;
    await save({ preferred_cities: cities.slice(0, 5) });
  };

  const updatePreferredTypes = async (types: PropertyType[]): Promise<void> => {
    if (!user?.id) return;
    await save({ preferred_types: types });
  };

  const updatePreferredCategories = async (categories: PropertyCategory[]): Promise<void> => {
    if (!user?.id) return;
    await save({ preferred_categories: categories });
  };

  const clearSearchHistory = async (): Promise<void> => {
    if (!user?.id) return;
    await save({ search_history: [] });
  };

  const getPreferredCities = (): string[] => preferences?.preferred_cities || [];
  const getSearchHistory = (): SearchHistory[] => preferences?.search_history || [];

  return {
    preferences,
    loading,
    error,
    addToSearchHistory,
    updatePreferredCities,
    updatePreferredTypes,
    updatePreferredCategories,
    clearSearchHistory,
    getPreferredCities,
    getSearchHistory,
    refetch: fetchUserPreferences,
  };
};
