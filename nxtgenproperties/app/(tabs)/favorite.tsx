import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { Property } from '@/types';

export default function FavoritesScreen() {
  const { favorites, fetchFavorites } = useFavoritesStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Re-load property details whenever the favorites Set reference changes.
  // toggleFavorite always creates a new Set, so this fires on every add/remove.
  useEffect(() => {
    let cancelled = false;

    const loadPropertyDetails = async () => {
      if (favorites.size === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const favoriteIds = Array.from(favorites);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .in('id', favoriteIds);

        if (error) throw error;
        if (!cancelled) setProperties(data || []);
      } catch (error) {
        console.error('Error fetching favorite properties:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPropertyDetails();
    return () => { cancelled = true; };
  }, [favorites]);

  // Pull-to-refresh: re-fetch from Supabase → updates store Set → triggers effect above
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  const favoriteCount = favorites.size;

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4" style={{ backgroundColor: theme.colors.surface }}>
        <Text className="text-3xl font-bold" style={{ color: theme.colors.secondary }}>
          My Favorites
        </Text>
        <Text className="text-sm mt-2" style={{ color: theme.colors.outline }}>
          {favoriteCount} saved {favoriteCount === 1 ? 'property' : 'properties'}
        </Text>
      </View>

      {/* Content */}
      {favoriteCount === 0 ? (
        <View className="flex-1 items-center justify-center px-6" style={{ paddingBottom: theme.tabBarHeight }}>
          <View className="w-28 h-28 rounded-full items-center justify-center mb-5" style={{ backgroundColor: theme.colors.primaryContainer }}>
            <Ionicons name="heart-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text className="text-xl font-semibold" style={{ color: theme.colors.secondary }}>
            No favorites yet
          </Text>
          <Text className="text-sm mt-3 text-center" style={{ color: theme.colors.outline }}>
            Start exploring and save properties you love!
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: theme.tabBarHeight + 16 }}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
