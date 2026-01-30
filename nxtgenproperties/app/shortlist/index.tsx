import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PropertyCard } from '@/components/PropertyCard';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';

export default function ShortlistScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          property:properties(
            *,
            owner:users_profiles!properties_owner_id_fkey(*),
            broker:users_profiles!properties_broker_id_fkey(*)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const propertyList = data?.map((fav: any) => fav.property).filter(Boolean) || [];
      setProperties(propertyList);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 bg-white">
        <Text className="text-primary text-2xl font-bold">Shortlisted</Text>
      </View>

      {properties.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg mt-4">No item in shortlist</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={({ item }) => (
            <View className="px-6 mb-4">
              <PropertyCard property={item} variant="featured" />
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
