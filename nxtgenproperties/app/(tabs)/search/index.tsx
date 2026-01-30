import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PropertyCard } from '@/components/PropertyCard';
import { useProperties } from '@/hooks/useProperties';

export default function SearchScreen() {
  const { properties, loading } = useProperties();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4">
        {/* Search Bar */}
        <View className="bg-white rounded-xl flex-row items-center px-4 py-3 mb-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search for properties"
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-900 text-base"
          />
        </View>

        {/* Recent Searches */}
        <View className="mb-4">
          <Text className="text-gray-900 text-base font-semibold mb-3">Your recent searches</Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#9CA3AF" />
              <Text className="text-gray-600 text-sm ml-2">4 Bhk Bunglow</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#9CA3AF" />
              <Text className="text-gray-600 text-sm ml-2">2 Bhk Bunglow</Text>
            </View>
          </View>
        </View>

        {/* Featured Properties */}
        <Text className="text-gray-900 text-xl font-bold mb-4">Featured Properties</Text>
      </View>

      <FlatList
        data={properties}
        renderItem={({ item }) => (
          <View className="px-6 mb-4">
            <PropertyCard property={item} variant="featured" />
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
