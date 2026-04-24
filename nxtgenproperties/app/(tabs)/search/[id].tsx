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
  Modal,
  TextInput,
  Alert,
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
import { useCompareStore, MAX_COMPARE_SIZE } from '@/stores/compareStore';
import { PropertyCard } from '@/components/PropertyCard';
import { Property } from '@/types';
import { supabase } from '@/lib/supabase';

Dimensions.get('window');

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPropertyById, getSimilarProperties } = usePropertiesStore();
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToRecentlyViewed } = useRecentlyViewedStore();
  const compare = useCompareStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'details'>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      setLoading(true);
      const data = await getPropertyById(id);
      setProperty(data || null);
      setLoading(false);
      if (data) {
        getSimilarProperties(data).then(setSimilar);
      }
    };
    if (id) loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (property?.id) {
      addToRecentlyViewed(property.id);
      // Record view for seller analytics (fire-and-forget)
      supabase
        .from('property_views')
        .insert({
          property_id: property.id,
          viewer_id: user?.user_id ?? null,
        })
        .then(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  if (loading || !property) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0F766E" />
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

  const handleCall = async () => {
    if (!contact?.phone) return;
    const url = `tel:${contact.phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleWhatsApp = async () => {
    if (!contact?.phone) return;
    const message = encodeURIComponent(`Hi, I'm interested in ${property.title}`);
    const url = `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${message}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
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

  const handleSendInquiry = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to send an inquiry.');
      return;
    }
    if (!inquiryMsg.trim()) {
      Alert.alert('Message required', 'Please enter your message before sending.');
      return;
    }
    const toUserId = property.broker?.user_id ?? property.owner?.user_id;
    if (!toUserId) {
      Alert.alert('Not available', 'Contact information is not available for this property.');
      return;
    }
    setSendingInquiry(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        from_user_id: user.user_id,
        to_user_id: toUserId,
        property_id: property.id,
        message: inquiryMsg.trim(),
      });
      if (error) throw error;
      Alert.alert('Inquiry sent!', 'The owner/broker will get back to you shortly.');
      setShowInquiry(false);
      setInquiryMsg('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not send inquiry');
    } finally {
      setSendingInquiry(false);
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
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
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

          {/* Badges — placed above the price rail so they stay visible. */}
          <View style={{ position: 'absolute', bottom: 56, left: 16, flexDirection: 'row' }}>
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

        {/* Price rail — navy strip that breaks the image-content boundary.
            A departure from the usual flat "price + small-text" block. */}
        <View
          style={{
            marginTop: -24,
            marginHorizontal: 16,
            backgroundColor: '#1B2838',
            borderRadius: 18,
            padding: 16,
            shadowColor: '#1B2838',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.2 }}>
              {formatPrice(property.price)}
            </Text>
            {property.type === 'rent' && (
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginLeft: 4 }}>
                /mo
              </Text>
            )}
            <View
              style={{
                marginLeft: 'auto',
                backgroundColor: 'rgba(255,255,255,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                ₹{(property.price / property.area_sqft).toFixed(0)}/sqft
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="location" size={14} color="#0F766E" />
            <Text
              style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginLeft: 4 }}
              numberOfLines={1}
            >
              {property.locality}, {property.city}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-gray-900 text-xl font-semibold">{property.title}</Text>
        </View>

        {/* Key stats as floating bubble row — distinct from bordered grid */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}>
          {[
            { icon: 'bed-outline' as const, value: property.bedrooms, label: 'Beds' },
            { icon: 'water-outline' as const, value: property.bathrooms, label: 'Baths' },
            { icon: 'resize-outline' as const, value: property.area_sqft, label: 'Sq.ft' },
            { icon: 'car-outline' as const, value: property.parkings, label: 'Parking' },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 10,
                backgroundColor: '#F4F7F6',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#CBD5D1',
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: '#1B2838',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <Ionicons name={s.icon} size={16} color="#0F766E" />
              </View>
              <Text style={{ color: '#1B2838', fontWeight: '800', fontSize: 14 }}>{s.value}</Text>
              <Text style={{ color: '#64766F', fontSize: 10, fontWeight: '600' }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Segmented tab control — single rounded pill with navy active state */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            backgroundColor: '#E0EDEA',
            padding: 4,
            borderRadius: 14,
            marginBottom: 8,
          }}
        >
          {(['overview', 'amenities', 'details'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: active ? '#1B2838' : 'transparent',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    color: active ? '#fff' : '#64766F',
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
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
                  <View className="w-8 h-8 bg-teal-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="home-outline" size={16} color="#0F766E" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Property Type</Text>
                    <Text className="text-gray-900 font-medium capitalize">
                      {property.category}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-teal-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="layers-outline" size={16} color="#0F766E" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Floor</Text>
                    <Text className="text-gray-900 font-medium">
                      {property.floor || 'G'} of {property.total_floors || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-teal-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="compass-outline" size={16} color="#0F766E" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Facing</Text>
                    <Text className="text-gray-900 font-medium capitalize">
                      {property.facing || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-teal-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="construct-outline" size={16} color="#0F766E" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Furnishing</Text>
                    <Text className="text-gray-900 font-medium capitalize">
                      {property.furnishing}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-teal-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="calendar-outline" size={16} color="#0F766E" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Possession</Text>
                    <Text className="text-gray-900 font-medium capitalize">
                      {property.possession.replace('-', ' ')}
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 flex-row items-center mb-3">
                  <View className="w-8 h-8 bg-teal-50 rounded-lg items-center justify-center mr-2">
                    <Ionicons name="time-outline" size={16} color="#0F766E" />
                  </View>
                  <View>
                    <Text className="text-gray-500 text-xs">Property Age</Text>
                    <Text className="text-gray-900 font-medium">
                      {property.age_years ? `${property.age_years} years` : 'New'}
                    </Text>
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
                <View key={index} className="w-1/2 flex-row items-center mb-4">
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
                <Text className="text-gray-500">
                  {property.type === 'buy' ? 'Property Price' : 'Monthly Rent'}
                </Text>
                <Text className="text-gray-900 font-medium">{formatPrice(property.price)}</Text>
              </View>
              {property.maintenance && (
                <View className="flex-row justify-between py-2 border-b border-gray-200">
                  <Text className="text-gray-500">Maintenance</Text>
                  <Text className="text-gray-900 font-medium">
                    ₹{property.maintenance.toLocaleString()}/month
                  </Text>
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
                <Ionicons name="location" size={20} color="#0F766E" />
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
                    uri:
                      contact.avatar_url ||
                      `https://ui-avatars.com/api/?name=${contact.name}&size=100&background=0F766E&color=fff`,
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

        {/* Action Row — Site Visit / Compare / Report / Locality reviews */}
        <View style={{ paddingHorizontal: 20, marginTop: 4, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push(`/site-visit/${property.id}` as never)}
              style={{
                flex: 1,
                backgroundColor: '#1B2838',
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={16} color="#0F766E" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Site visit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const ok = compare.toggle(property.id);
                if (!ok && !compare.has(property.id)) {
                  // max reached; guide user
                  router.push('/compare' as never);
                }
              }}
              style={{
                flex: 1,
                backgroundColor: compare.has(property.id) ? '#0F766E' : '#F4F7F6',
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: '#0F766E',
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="git-compare"
                size={16}
                color={compare.has(property.id) ? '#fff' : '#0F766E'}
              />
              <Text
                style={{
                  color: compare.has(property.id) ? '#fff' : '#0F766E',
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                {compare.has(property.id) ? 'Added' : 'Compare'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/reviews/locality',
                  params: { locality: property.locality, city: property.city },
                } as never)
              }
              style={{
                flex: 1,
                backgroundColor: '#F4F7F6',
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: '#CBD5D1',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="star-outline" size={16} color="#1B2838" />
              <Text style={{ color: '#1B2838', fontWeight: '700', fontSize: 13 }}>
                Locality reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/report/${property.id}` as never)}
              style={{
                flex: 1,
                backgroundColor: '#F4F7F6',
                paddingVertical: 12,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: '#CBD5D1',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="flag-outline" size={16} color="#BA1A1A" />
              <Text style={{ color: '#BA1A1A', fontWeight: '700', fontSize: 13 }}>Report</Text>
            </TouchableOpacity>
          </View>
          {compare.propertyIds.length > 1 && (
            <TouchableOpacity
              onPress={() => router.push('/compare' as never)}
              style={{
                marginTop: 10,
                backgroundColor: '#1B2838',
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                Compare {compare.propertyIds.length} / {MAX_COMPARE_SIZE}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Similar Properties */}
        {similar.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text
              style={{
                color: '#1B2838',
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 10,
              }}
            >
              Similar properties
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similar.map((sp) => (
                <View key={sp.id} style={{ width: 240, marginRight: 12 }}>
                  <PropertyCard property={sp} variant="featured" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* EMI Calculator Banner */}
        <TouchableOpacity
          onPress={() => router.push('/tools/emi-calculator' as any)}
          className="mx-5 mb-4"
        >
          <LinearGradient
            colors={['#0F766E', '#0F1923']}
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
            • Never pay any advance without visiting the property{'\n'}• Verify all documents before
            making payment{'\n'}• Meet the owner/broker in person
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar — split pill: Save + Call + WhatsApp */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 16,
          backgroundColor: '#FFFBFF',
          borderTopWidth: 1,
          borderTopColor: '#CBD5D1',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F4F7F6',
            borderRadius: 32,
            padding: 6,
            gap: 6,
          }}
        >
          <TouchableOpacity
            onPress={handleFavorite}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#CBD5D1',
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#0F766E' : '#1B2838'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCall}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#0F766E',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, marginLeft: 8 }}>
              Call Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowInquiry(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#1B2838',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={20} color="#0F766E" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#25D366',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inquiry Modal */}
      <Modal
        visible={showInquiry}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFBFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#1B2838' }}>
                Send Inquiry
              </Text>
              <TouchableOpacity onPress={() => setShowInquiry(false)}>
                <Ionicons name="close" size={24} color="#1B2838" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#64766F', fontSize: 13, marginBottom: 12 }}>
              Your message will be sent directly to the {contact?.role ?? 'owner'}.
            </Text>
            <TextInput
              value={inquiryMsg}
              onChangeText={setInquiryMsg}
              multiline
              numberOfLines={4}
              placeholder={`Hi, I'm interested in ${property?.title ?? 'this property'}. Please share more details.`}
              placeholderTextColor="#B0A09A"
              style={{
                backgroundColor: '#E0EDEA',
                borderRadius: 14,
                padding: 14,
                minHeight: 110,
                textAlignVertical: 'top',
                color: '#1B2838',
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <TouchableOpacity
              onPress={handleSendInquiry}
              disabled={sendingInquiry}
              style={{
                backgroundColor: '#0F766E',
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {sendingInquiry ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    Send Inquiry
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
