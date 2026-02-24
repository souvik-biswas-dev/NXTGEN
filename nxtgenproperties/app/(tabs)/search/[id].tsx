import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageGallery } from '@/components/ImageGallery';
import { BrokerBadge } from '@/components/BrokerBadge';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { Property } from '@/types';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPropertyById } = usePropertiesStore();
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToRecentlyViewed } = useRecentlyViewedStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'details'>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      setLoading(true);
      const data = await getPropertyById(id);
      setProperty(data || null);
      setLoading(false);
    };
    if (id) loadProperty();
  }, [id]);

  useEffect(() => {
    if (property?.id) {
      addToRecentlyViewed(property.id);
    }
  }, [property?.id]);

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
    return `₹${price.toLocaleString('en-IN')}`;
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property on NxtGen Properties!\n\n${property.title}\n${formatPrice(property.price)}\n${property.locality}, ${property.city}\n\nhttps://nxtgenproperties.app/property/${property.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = async () => {
    if (user) {
      try {
        await toggleFavorite(property.id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View className="relative">
          <ImageGallery images={property.photos} />
          
          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 flex-row items-center justify-between px-5">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/95 rounded-full p-2.5 shadow-lg"
            >
              <Ionicons name="arrow-back" size={22} color="#333" />
            </TouchableOpacity>
            <View className="flex-row">
              <TouchableOpacity 
                onPress={handleFavorite} 
                className="bg-white/95 rounded-full p-2.5 shadow-lg mr-2"
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isLiked ? '#EF4444' : '#333'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleShare}
                className="bg-white/95 rounded-full p-2.5 shadow-lg"
              >
                <Ionicons name="share-social-outline" size={22} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badges */}
          <View className="absolute bottom-4 left-4 flex-row">
            {property.featured && (
              <View className="bg-yellow-400 px-3 py-1 rounded-full mr-2">
                <Text className="text-xs font-bold">FEATURED</Text>
              </View>
            )}
            {property.verified && (
              <View className="bg-green-500 px-3 py-1 rounded-full flex-row items-center">
                <Ionicons name="shield-checkmark" size={12} color="white" />
                <Text className="text-white text-xs font-bold ml-1">VERIFIED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Info Bar */}
        <View className="bg-orange-50 px-5 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={18} color="#FF6B35" />
            <Text className="text-primary text-sm ml-1">125 views</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={18} color="#FF6B35" />
            <Text className="text-primary text-sm ml-1">Posted 2 days ago</Text>
          </View>
        </View>

        {/* Main Info */}
        <View className="px-5 py-4">
          {/* Price */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 text-3xl font-bold">
              {formatPrice(property.price)}
            </Text>
            {property.type === 'rent' && (
              <Text className="text-gray-500 text-lg">/month</Text>
            )}
          </View>

          {/* Price per sqft */}
          <Text className="text-gray-500 text-sm mb-3">
            ₹{(property.price / property.area_sqft).toFixed(0)}/sq.ft
          </Text>

          {/* Title */}
          <Text className="text-gray-900 text-xl font-semibold mb-2">
            {property.title}
          </Text>

          {/* Location */}
          <TouchableOpacity className="flex-row items-center mb-4">
            <Ionicons name="location" size={18} color="#FF6B35" />
            <Text className="text-primary ml-1">
              {property.locality}, {property.city}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
          </TouchableOpacity>

          {/* Key Stats */}
          <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-4">
            <View className="flex-1 items-center border-r border-gray-200">
              <Ionicons name="bed-outline" size={24} color="#FF6B35" />
              <Text className="text-gray-900 text-lg font-bold mt-1">{property.bedrooms}</Text>
              <Text className="text-gray-500 text-xs">Bedrooms</Text>
            </View>
            <View className="flex-1 items-center border-r border-gray-200">
              <Ionicons name="water-outline" size={24} color="#FF6B35" />
              <Text className="text-gray-900 text-lg font-bold mt-1">{property.bathrooms}</Text>
              <Text className="text-gray-500 text-xs">Bathrooms</Text>
            </View>
            <View className="flex-1 items-center border-r border-gray-200">
              <Ionicons name="resize-outline" size={24} color="#FF6B35" />
              <Text className="text-gray-900 text-lg font-bold mt-1">{property.area_sqft}</Text>
              <Text className="text-gray-500 text-xs">Sq.ft</Text>
            </View>
            <View className="flex-1 items-center">
              <Ionicons name="car-outline" size={24} color="#FF6B35" />
              <Text className="text-gray-900 text-lg font-bold mt-1">{property.parkings}</Text>
              <Text className="text-gray-500 text-xs">Parking</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-gray-200">
          {(['overview', 'amenities', 'details'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-primary' : ''}`}
            >
              <Text className={`text-center font-semibold capitalize ${
                activeTab === tab ? 'text-primary' : 'text-gray-500'
              }`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View className="px-5 py-4">
            {/* Description */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-3">Description</Text>
              <Text 
                className="text-gray-600 leading-6"
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {property.description}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFullDescription(!showFullDescription)}
                className="mt-2"
              >
                <Text className="text-primary font-medium">
                  {showFullDescription ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Property Highlights */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-3">Property Highlights</Text>
              <View className="flex-row flex-wrap">
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="home-outline" size={16} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Property Type</Text>
                    <Text className="text-gray-900 font-medium capitalize">{property.category}</Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="layers-outline" size={16} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Floor</Text>
                    <Text className="text-gray-900 font-medium">{property.floor || 'G'} of {property.total_floors || 'N/A'}</Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="compass-outline" size={16} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Facing</Text>
                    <Text className="text-gray-900 font-medium capitalize">{property.facing || 'N/A'}</Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="construct-outline" size={16} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Furnishing</Text>
                    <Text className="text-gray-900 font-medium capitalize">{property.furnishing}</Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="calendar-outline" size={16} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Possession</Text>
                    <Text className="text-gray-900 font-medium capitalize">{property.possession.replace('-', ' ')}</Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="time-outline" size={16} color="#FF6B35" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Property Age</Text>
                    <Text className="text-gray-900 font-medium">{property.age_years ? `${property.age_years} years` : 'New'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'amenities' && (
          <View className="px-5 py-4">
            <Text className="text-gray-900 text-lg font-bold mb-4">Amenities</Text>
            <View className="flex-row flex-wrap">
              {property.amenities.map((amenity, index) => (
                <View 
                  key={index}
                  className="w-1/2 flex-row items-center mb-4"
                >
                  <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                  </View>
                  <Text className="text-gray-700 flex-1">{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'details' && (
          <View className="px-5 py-4">
            <Text className="text-gray-900 text-lg font-bold mb-4">Property Details</Text>
            
            {/* Area Details */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-gray-700 font-semibold mb-3">Area Details</Text>
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-500">Super Built-up Area</Text>
                <Text className="text-gray-900 font-medium">{property.area_sqft} sq.ft</Text>
              </View>
              {property.carpet_area && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-500">Carpet Area</Text>
                  <Text className="text-gray-900 font-medium">{property.carpet_area} sq.ft</Text>
                </View>
              )}
              {property.super_built_up && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-500">Super Built-up</Text>
                  <Text className="text-gray-900 font-medium">{property.super_built_up} sq.ft</Text>
                </View>
              )}
            </View>

            {/* Price Breakdown */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-gray-700 font-semibold mb-3">Price Breakdown</Text>
              <View className="flex-row justify-between py-2 border-b border-gray-200">
                <Text className="text-gray-500">{property.type === 'buy' ? 'Property Price' : 'Monthly Rent'}</Text>
                <Text className="text-gray-900 font-medium">{formatPrice(property.price)}</Text>
              </View>
              {property.maintenance && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-500">Maintenance</Text>
                  <Text className="text-gray-900 font-medium">₹{property.maintenance.toLocaleString()}/month</Text>
                </View>
              )}
              {property.deposit && property.type === 'rent' && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-500">Security Deposit</Text>
                  <Text className="text-gray-900 font-medium">{formatPrice(property.deposit)}</Text>
                </View>
              )}
            </View>

            {/* Address */}
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-gray-700 font-semibold mb-3">Location</Text>
              <View className="flex-row items-start">
                <Ionicons name="location" size={20} color="#FF6B35" />
                <Text className="text-gray-700 ml-2 flex-1">
                  {property.address || `${property.locality}, ${property.city}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Contact Card */}
        {contact && (
          <View className="px-5 py-4">
            <View className="bg-gray-50 rounded-2xl p-4">
              <View className="flex-row items-center mb-4">
                <Image
                  source={{ 
                    uri: contact.avatar_url || `https://ui-avatars.com/api/?name=${contact.name}&size=100&background=FF6B35&color=fff`
                  }}
                  className="w-14 h-14 rounded-full"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 text-lg font-semibold">{contact.name}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 text-sm capitalize">{contact.role}</Text>
                    {contact.verified_broker && (
                      <View className="flex-row items-center ml-2">
                        <BrokerBadge verified={true} size="sm" />
                      </View>
                    )}
                  </View>
                  {contact.rating && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text className="text-gray-600 text-sm ml-1">{contact.rating} rating</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="flex-row">
                <TouchableOpacity
                  onPress={handleCall}
                  className="flex-1 bg-primary rounded-xl py-3.5 flex-row items-center justify-center mr-2"
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  className="flex-1 bg-green-500 rounded-xl py-3.5 flex-row items-center justify-center"
                >
                  <Ionicons name="logo-whatsapp" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* EMI Calculator Banner */}
        <TouchableOpacity 
          onPress={() => router.push('/tools/emi-calculator' as any)}
          className="mx-5 mb-4"
        >
          <LinearGradient
            colors={['#FF6B35', '#0F1923']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                <Ionicons name="calculator" size={20} color="white" />
              </View>
              <View>
                <Text className="text-white font-semibold">Calculate EMI</Text>
                <Text className="text-white/70 text-sm">Plan your home loan</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Safety Tips */}
        <View className="mx-5 mb-6 bg-yellow-50 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
            <Text className="text-gray-900 font-semibold ml-2">Safety Tips</Text>
          </View>
          <Text className="text-gray-600 text-sm">
            • Never pay any advance without visiting the property{'\n'}
            • Verify all documents before making payment{'\n'}
            • Meet the owner/broker in person
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="bg-white px-5 py-4 border-t border-gray-100 flex-row">
        <TouchableOpacity
          onPress={handleFavorite}
          className="w-14 h-14 border border-gray-200 rounded-xl items-center justify-center mr-3"
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#EF4444' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCall}
          className="flex-1 bg-primary rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="call" size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">Contact Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
