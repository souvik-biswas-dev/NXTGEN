import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

  // Fetch user preferences on component mount or when user changes
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

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No preferences found, create default
          const newPreferences = await createUserPreferences();
          setPreferences(newPreferences);
        } else {
          throw fetchError;
        }
      } else {
        setPreferences(data);
      }
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  const createUserPreferences = async (): Promise<UserPreferences | null> => {
    if (!user?.id) return null;

    // The Supabase session JWT may not be committed to the client yet right
    // after onAuthStateChange fires (OTP flow timing). Poll briefly until
    // getUser() confirms an active session before hitting RLS-protected tables.
    let sessionUserId: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser?.id) {
        sessionUserId = authUser.id;
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!sessionUserId) {
      // Session genuinely not available — skip silently
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: sessionUserId,
            preferred_cities: [],
            preferred_types: [],
            preferred_categories: [],
            search_history: [],
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating user preferences:', err);
      return null;
    }
  };

  const addToSearchHistory = async (
    query: string,
    filters?: SearchFilters,
    city?: string
  ): Promise<void> => {
    if (!user?.id || !preferences) return;

    try {
      const newSearchEntry: SearchHistory = {
        id: Date.now().toString(),
        query,
        filters,
        city: city || filters?.city,
        timestamp: new Date().toISOString(),
      };

      // Keep only last 50 searches
      const updatedHistory = [newSearchEntry, ...preferences.search_history].slice(0, 50);

      // Update preferred_cities if city is provided
      let updatedPreferences = { ...preferences };
      if (city) {
        const currentCities = preferences.preferred_cities || [];
        if (!currentCities.includes(city)) {
          updatedPreferences.preferred_cities = [...currentCities, city].slice(0, 5); // Keep top 5
        }
      }

      // Update preferred_types if provided
      if (filters?.type) {
        const currentTypes = preferences.preferred_types || [];
        if (!currentTypes.includes(filters.type)) {
          updatedPreferences.preferred_types = [...currentTypes, filters.type];
        }
      }

      // Update preferred_categories if provided
      if (filters?.category) {
        const currentCategories = preferences.preferred_categories || [];
        if (!currentCategories.includes(filters.category)) {
          updatedPreferences.preferred_categories = [...currentCategories, filters.category];
        }
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          search_history: updatedHistory,
          preferred_cities: updatedPreferences.preferred_cities,
          preferred_types: updatedPreferences.preferred_types,
          preferred_categories: updatedPreferences.preferred_categories,
          last_search_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (err) {
      console.error('Error adding to search history:', err);
    }
  };

  const updatePreferredCities = async (cities: string[]): Promise<void> => {
    if (!user?.id || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          preferred_cities: cities.slice(0, 5), // Keep max 5
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (err) {
      console.error('Error updating preferred cities:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cities');
    }
  };

  const updatePreferredTypes = async (types: PropertyType[]): Promise<void> => {
    if (!user?.id || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          preferred_types: types,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (err) {
      console.error('Error updating preferred types:', err);
      setError(err instanceof Error ? err.message : 'Failed to update types');
    }
  };

  const updatePreferredCategories = async (categories: PropertyCategory[]): Promise<void> => {
    if (!user?.id || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          preferred_categories: categories,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (err) {
      console.error('Error updating preferred categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to update categories');
    }
  };

  const clearSearchHistory = async (): Promise<void> => {
    if (!user?.id || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          search_history: [],
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (err) {
      console.error('Error clearing search history:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  const getPreferredCities = (): string[] => {
    return preferences?.preferred_cities || [];
  };

  const getSearchHistory = (): SearchHistory[] => {
    return preferences?.search_history || [];
  };

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
