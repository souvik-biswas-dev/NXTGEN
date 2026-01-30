import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PropertyCard } from '@/components/PropertyCard';
import { useFeaturedProperties, useProperties } from '@/hooks/useProperties';
import { PropertyType } from '@/types';

export default function HomeScreen() {
  const [activeType, setActiveType] = useState<PropertyType>('buy');
  const { properties: featuredProperties, loading: featuredLoading, refresh: refreshFeatured } = useFeaturedProperties();
  const { properties: nearbyProperties, loading: nearbyLoading, refresh: refreshNearby } = useProperties({ type: activeType }, 10);

  const handleRefresh = () => {
    refreshFeatured();
    refreshNearby();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={featuredLoading || nearbyLoading}
            onRefresh={handleRefresh}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 bg-white">
          <Text className="text-primary text-2xl font-bold">Nxt Gen Properties</Text>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity>
              <Ionicons name="search" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buy/Rent Toggle */}
        <View className="px-6 py-4 flex-row space-x-3">
          <TouchableOpacity
            onPress={() => setActiveType('buy')}
            className={`flex-1 py-3 rounded-xl ${
              activeType === 'buy' ? 'bg-primary' : 'bg-white border border-gray-200'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-center text-base font-semibold ${
                activeType === 'buy' ? 'text-white' : 'text-primary'
              }`}
            >
              Buy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveType('rent')}
            className={`flex-1 py-3 rounded-xl ${
              activeType === 'rent' ? 'bg-primary' : 'bg-white border border-gray-200'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-center text-base font-semibold ${
                activeType === 'rent' ? 'text-white' : 'text-primary'
              }`}
            >
              Rent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Properties */}
        <View className="px-6 py-2">
          <Text className="text-gray-900 text-xl font-bold mb-4">Nearby Properties</Text>
          <View className="flex-row flex-wrap justify-between">
            {nearbyProperties.slice(0, 4).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>
        </View>

        {/* Featured Properties */}
        <View className="px-6 py-4">
          <Text className="text-gray-900 text-xl font-bold mb-4">Featured Properties</Text>
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} variant="featured" />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
