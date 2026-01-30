import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ImageGallery } from '@/components/ImageGallery';
import { BrokerBadge } from '@/components/BrokerBadge';
import { useProperty } from '@/hooks/useProperties';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { property, loading } = useProperty(id);
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  if (loading || !property) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const isLiked = isFavorite(property.id);
  const contact = property.broker || property.owner;

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  const handleCall = () => {
    if (contact?.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (contact?.phone) {
      Linking.openURL(`whatsapp://send?phone=${contact.phone}&text=Hi, I'm interested in ${property.title}`);
    }
  };

  const handleFavorite = async () => {
    if (user) {
      try {
        await toggleFavorite(user.id, property.id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="absolute top-12 left-0 right-0 z-10 flex-row items-center justify-between px-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white rounded-full p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View className="flex-row space-x-3">
            <TouchableOpacity onPress={handleFavorite} className="bg-white rounded-full p-2">
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#FF6B35' : '#1A1A1A'}
              />
            </TouchableOpacity>
            <TouchableOpacity className="bg-white rounded-full p-2">
              <Ionicons name="share-social-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Gallery */}
        <ImageGallery images={property.photos} />

        {/* Property Info */}
        <View className="p-6">
          <Text className="text-gray-900 text-2xl font-bold mb-2">{property.title}</Text>
          
          <View className="flex-row items-center mb-4">
            <Ionicons name="location-outline" size={16} color="#6C757D" />
            <Text className="text-gray-600 text-sm ml-1">
              {property.locality}, {property.city}
            </Text>
            <Text className="text-gray-900 text-xl font-bold ml-auto">
              {formatPrice(property.price)}
            </Text>
          </View>

          <Text className="text-gray-600 text-sm mb-4">{property.area_sqft}ft2</Text>

          {/* Stats */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="items-center">
              <Text className="text-gray-900 text-2xl font-bold">{property.bedrooms}</Text>
              <Text className="text-gray-600 text-sm">Bedrooms</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-900 text-2xl font-bold">{property.bathrooms}</Text>
              <Text className="text-gray-600 text-sm">Bathrooms</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-900 text-2xl font-bold">{property.kitchens}</Text>
              <Text className="text-gray-600 text-sm">Kitchens</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-900 text-2xl font-bold">{property.parkings}</Text>
              <Text className="text-gray-600 text-sm">Parkings</Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">Description</Text>
            <Text className="text-gray-600 text-sm leading-6">{property.description}</Text>
          </View>

          {/* Contact Card */}
          {contact && (
            <View className="bg-gray-50 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center mr-3">
                  <Ionicons name="person" size={24} color="#6C757D" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-semibold">{contact.name}</Text>
                  {contact.verified_broker && <BrokerBadge verified={true} size="sm" />}
                </View>
              </View>

              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={handleCall}
                  className="flex-1 bg-primary rounded-xl py-3 items-center"
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text className="text-white text-sm font-medium mt-1">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  className="flex-1 bg-green-500 rounded-xl py-3 items-center"
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text className="text-white text-sm font-medium mt-1">WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
