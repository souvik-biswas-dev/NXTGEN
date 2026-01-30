import React from 'react';
import { View, Text, Image, TouchableOpacity, Pressable } from 'react-native';
import { Property } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured';
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, variant = 'default' }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const isLiked = isFavorite(property.id);

  const handleFavorite = async (e: any) => {
    e.stopPropagation();
    if (user) {
      try {
        await toggleFavorite(user.id, property.id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const isFeatured = variant === 'featured';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/search/${property.id}`)}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm mb-4 ${isFeatured ? 'w-full' : 'w-[48%]'}`}
      activeOpacity={0.7}
    >
      <View className="relative">
        <Image
          source={{ uri: property.photos[0] || 'https://via.placeholder.com/400x300' }}
          className={`w-full ${isFeatured ? 'h-64' : 'h-40'}`}
          resizeMode="cover"
        />
        
        {/* Favorite Button */}
        <Pressable
          onPress={handleFavorite}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#FF6B35' : '#6C757D'}
          />
        </Pressable>

        {/* Price Badge */}
        <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <Text className="text-white text-xl font-bold">
            {formatPrice(property.price)}
          </Text>
        </View>
      </View>

      <View className="p-3">
        <Text className="text-gray-900 text-base font-semibold mb-1" numberOfLines={2}>
          {property.title}
        </Text>
        <Text className="text-gray-500 text-sm mb-2" numberOfLines={1}>
          {property.locality}, {property.city}
        </Text>
        
        {isFeatured && (
          <View className="flex-row items-center space-x-4 mt-2">
            <View className="flex-row items-center">
              <Ionicons name="bed-outline" size={16} color="#6C757D" />
              <Text className="text-gray-600 text-xs ml-1">{property.bedrooms}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={16} color="#6C757D" />
              <Text className="text-gray-600 text-xs ml-1">{property.bathrooms}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="restaurant-outline" size={16} color="#6C757D" />
              <Text className="text-gray-600 text-xs ml-1">{property.kitchens}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="car-outline" size={16} color="#6C757D" />
              <Text className="text-gray-600 text-xs ml-1">{property.parkings}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
