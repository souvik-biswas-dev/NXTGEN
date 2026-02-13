import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { PropertyCard } from '@/components/PropertyCard';
import { supabase } from '@/lib/supabase';

export default function FavoritesScreen() {
  const { favorites } = useFavoritesStore();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteProperties();
  }, [favorites]);

  const fetchFavoriteProperties = async () => {
    if (favorites.size === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const favoriteIds = Array.from(favorites);
      
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
  };

  const favoriteCount = favorites.size;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-gray-900 text-2xl font-bold">
          My Favorites
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          {favoriteCount} saved {favoriteCount === 1 ? 'property' : 'properties'}
        </Text>
      </View>

      {/* Content */}
      {favoriteCount === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
          </View>
          <Text className="text-gray-900 text-lg font-semibold">
            No favorites yet
          </Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            Start exploring and save properties you love!
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </SafeAreaView>
  );
}