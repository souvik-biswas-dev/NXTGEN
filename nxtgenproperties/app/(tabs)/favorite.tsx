import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function FavoritesScreen() {
  const { favorites, fetchFavorites } = useFavoritesStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      await fetchFavorites();
      const currentFavorites = useFavoritesStore.getState().favorites;

      if (currentFavorites.size === 0) {
        setProperties([]);
        return;
      }

      const favoriteIds = Array.from(currentFavorites);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', favoriteIds);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFavorites]);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadFavorites();
    }, [loadFavorites])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

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
        <View className="flex-1 items-center justify-center px-6">
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 }}
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
