import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PropertyCard } from '@/components/PropertyCard';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { popularCities, newLaunches, marketTrends } from '@/data/dummyProperties';
import { PropertyType } from '@/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<PropertyType>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { 
    getFeaturedProperties, 
    getNearbyProperties,
    recentSearches, 
    setSearchQuery: updateStoreSearch,
    addRecentSearch 
  } = usePropertiesStore();

  const featuredProperties = getFeaturedProperties();
  const nearbyProperties = getNearbyProperties(activeType);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
      updateStoreSearch(searchQuery);
      router.push('/(tabs)/search');
    }
  };

  const navigateToSearch = (query?: string) => {
    if (query) {
      updateStoreSearch(query);
      addRecentSearch(query);
    }
    router.push('/(tabs)/search');
  };

  const navigateToCalculator = (type: 'emi' | 'budget') => {
    router.push(`/tools/${type}-calculator` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#0066CC', '#0052A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pb-6"
        >
          {/* Top Bar */}
          <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
            <TouchableOpacity className="p-2">
              <Ionicons name="menu" size={26} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">NxtGen Properties</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/post')}
              className="bg-primary px-3 py-1.5 rounded-full flex-row items-center"
            >
              <Text className="text-white text-xs font-semibold">Post FREE</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="px-5 mb-4">
            <TouchableOpacity 
              onPress={() => navigateToSearch()}
              className="bg-white rounded-lg flex-row items-center px-4 py-3.5 shadow-lg"
            >
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                placeholder='Search "Sector 150"'
                placeholderTextColor="#999"
                className="flex-1 ml-3 text-gray-800 text-base"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Get Started Section */}
        <View className="bg-white px-5 py-5">
          <Text className="text-gray-900 text-xl font-bold mb-1">Get started with</Text>
          <Text className="text-gray-500 text-sm mb-4">Explore real estate options in top cities</Text>

          {/* Quick Actions */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            {/* Buy */}
            <TouchableOpacity
              onPress={() => {
                setActiveType('buy');
                navigateToSearch();
              }}
              className="items-center mr-4"
            >
              <View className={`w-16 h-16 rounded-xl items-center justify-center border-2 ${activeType === 'buy' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <Ionicons name="home" size={28} color={activeType === 'buy' ? '#0066CC' : '#666'} />
              </View>
              <Text className={`text-sm mt-2 font-medium ${activeType === 'buy' ? 'text-blue-600' : 'text-gray-600'}`}>Buy</Text>
            </TouchableOpacity>

            {/* Rent */}
            <TouchableOpacity
              onPress={() => {
                setActiveType('rent');
                navigateToSearch();
              }}
              className="items-center mr-4"
            >
              <View className={`w-16 h-16 rounded-xl items-center justify-center border-2 ${activeType === 'rent' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <Ionicons name="key" size={28} color={activeType === 'rent' ? '#0066CC' : '#666'} />
              </View>
              <Text className={`text-sm mt-2 font-medium ${activeType === 'rent' ? 'text-blue-600' : 'text-gray-600'}`}>Rent</Text>
            </TouchableOpacity>

            {/* New Projects */}
            <TouchableOpacity
              onPress={() => router.push('/projects' as any)}
              className="items-center mr-4"
            >
              <View className="w-16 h-16 rounded-xl items-center justify-center border-2 border-gray-200 bg-white">
                <Ionicons name="business" size={28} color="#666" />
              </View>
              <Text className="text-gray-600 text-sm mt-2 font-medium">Projects</Text>
            </TouchableOpacity>

            {/* Insights */}
            <TouchableOpacity
              onPress={() => router.push('/insights' as any)}
              className="items-center mr-4"
            >
              <View className="w-16 h-16 rounded-xl items-center justify-center border-2 border-gray-200 bg-white">
                <Ionicons name="bulb" size={28} color="#666" />
              </View>
              <Text className="text-gray-600 text-sm mt-2 font-medium">Insights</Text>
            </TouchableOpacity>

            {/* Commercial */}
            <TouchableOpacity
              onPress={() => {
                router.push('/(tabs)/search');
              }}
              className="items-center mr-4"
            >
              <View className="w-16 h-16 rounded-xl items-center justify-center border-2 border-gray-200 bg-white">
                <Ionicons name="storefront" size={28} color="#666" />
              </View>
              <Text className="text-gray-600 text-sm mt-2 font-medium">Commercial</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Popular Tools Section */}
        <View className="bg-blue-50 px-5 py-5 mt-2">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="bg-blue-500 p-2 rounded-lg mr-3">
                <Ionicons name="bulb" size={20} color="white" />
              </View>
              <View>
                <Text className="text-gray-900 text-base font-bold">Use popular tools</Text>
                <Text className="text-gray-500 text-xs">Go from browsing to buying</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text className="text-blue-600 text-sm font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row">
            {/* Budget Calculator */}
            <TouchableOpacity 
              onPress={() => navigateToCalculator('budget')}
              className="flex-1 bg-white rounded-xl p-4 mr-3 shadow-sm"
            >
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="calculator" size={24} color="#F97316" />
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-900 text-sm font-semibold">Budget Calculator</Text>
                <Ionicons name="arrow-forward" size={16} color="#666" style={{ marginLeft: 4 }} />
              </View>
              <Text className="text-gray-500 text-xs mt-1">Check your affordability range for buying home</Text>
            </TouchableOpacity>

            {/* EMI Calculator */}
            <TouchableOpacity 
              onPress={() => navigateToCalculator('emi')}
              className="flex-1 bg-white rounded-xl p-4 shadow-sm"
            >
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="wallet" size={24} color="#F97316" />
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-900 text-sm font-semibold">EMI Calculator</Text>
                <Ionicons name="arrow-forward" size={16} color="#666" style={{ marginLeft: 4 }} />
              </View>
              <Text className="text-gray-500 text-xs mt-1">Calculate your home loan EMI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buying a Home Section */}
        <View className="bg-white px-5 py-5 mt-2">
          <Text className="text-gray-900 text-xl font-bold mb-1">Buying a home</Text>
          <Text className="text-gray-500 text-sm mb-4">Apartments, land, builder floors, villas and more</Text>

          <View className="flex-row flex-wrap justify-between">
            {nearbyProperties.slice(0, 4).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>

          <TouchableOpacity 
            onPress={() => navigateToSearch()}
            className="bg-blue-600 rounded-xl py-3 mt-2"
          >
            <Text className="text-white text-center font-semibold">
              See all {activeType === 'buy' ? 'Buy' : 'Rent'} properties
            </Text>
          </TouchableOpacity>
        </View>

        {/* Popular Cities */}
        <View className="bg-gray-50 px-5 py-5">
          <Text className="text-gray-900 text-xl font-bold mb-4">Popular Cities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularCities.slice(0, 6).map((city) => (
              <TouchableOpacity
                key={city.id}
                onPress={() => navigateToSearch(city.name)}
                className="mr-3 items-center"
              >
                <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="location" size={24} color="#0066CC" />
                </View>
                <Text className="text-gray-900 text-sm font-medium">{city.name}</Text>
                <Text className="text-gray-500 text-xs">{city.properties}+ properties</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Properties */}
        <View className="bg-white px-5 py-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 text-xl font-bold">Featured Properties</Text>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text className="text-blue-600 text-sm font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProperties.map((property) => (
              <View key={property.id} className="mr-4" style={{ width: width * 0.7 }}>
                <FeaturedPropertyCard property={property} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* New Launches */}
        <View className="bg-blue-50 px-5 py-5">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="bg-red-500 px-2 py-1 rounded mr-2">
                <Text className="text-white text-xs font-bold">NEW</Text>
              </View>
              <Text className="text-gray-900 text-xl font-bold">Project Launches</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {newLaunches.map((project) => (
              <TouchableOpacity 
                key={project.id}
                className="bg-white rounded-xl overflow-hidden mr-4 shadow-sm"
                style={{ width: width * 0.65 }}
              >
                <Image
                  source={{ uri: project.image }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
                <View className="p-3">
                  <Text className="text-gray-900 font-semibold" numberOfLines={1}>{project.name}</Text>
                  <Text className="text-gray-500 text-xs mt-1">by {project.developer}</Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>{project.location}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-blue-600 font-semibold text-sm">{project.priceRange}</Text>
                    <View className="bg-green-100 px-2 py-0.5 rounded">
                      <Text className="text-green-700 text-xs">{project.launchDate}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Market Trends */}
        <View className="bg-white px-5 py-5 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 text-xl font-bold">Market Trends</Text>
            <TouchableOpacity onPress={() => router.push('/insights' as any)}>
              <Text className="text-blue-600 text-sm font-semibold">View Details</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {marketTrends.map((trend, index) => (
              <View 
                key={index}
                className="bg-gray-50 rounded-xl p-4 mr-3 items-center"
                style={{ minWidth: 100 }}
              >
                <Text className="text-gray-600 text-sm">{trend.city}</Text>
                <Text className="text-green-600 text-xl font-bold mt-1">{trend.trend}</Text>
                <Text className="text-gray-400 text-xs mt-1">{trend.period}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Post Property Banner */}
        <View className="mx-5 mb-6">
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-5"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-bold mb-1">Post Your Property FREE</Text>
                <Text className="text-white/80 text-sm mb-3">Reach out to 10 Lakh+ buyers</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(tabs)/post')}
                  className="bg-white rounded-lg py-2 px-4 self-start"
                >
                  <Text className="text-orange-600 font-semibold">Post Now →</Text>
                </TouchableOpacity>
              </View>
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
                <Ionicons name="home" size={40} color="white" />
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// Featured Property Card Component
interface FeaturedPropertyCardProps {
  property: any;
}

const FeaturedPropertyCard: React.FC<FeaturedPropertyCardProps> = ({ property }) => {
  const router = useRouter();
  
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString()}`;
  };

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/search/${property.id}`)}
      className="bg-white rounded-xl overflow-hidden shadow-sm"
    >
      <View className="relative">
        <Image
          source={{ uri: property.photos[0] }}
          className="w-full h-40"
          resizeMode="cover"
        />
        {property.featured && (
          <View className="absolute top-2 left-2 bg-yellow-400 px-2 py-1 rounded">
            <Text className="text-xs font-bold">FEATURED</Text>
          </View>
        )}
        {property.broker?.verified_broker && (
          <View className="absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded flex-row items-center">
            <Ionicons name="shield-checkmark" size={12} color="white" />
            <Text className="text-white text-xs font-medium ml-1">Verified</Text>
          </View>
        )}
        <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <Text className="text-white text-lg font-bold">{formatPrice(property.price)}</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-gray-900 font-semibold" numberOfLines={1}>{property.title}</Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text className="text-gray-500 text-sm ml-1" numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>
        <View className="flex-row items-center mt-2">
          <View className="flex-row items-center mr-3">
            <Ionicons name="bed-outline" size={14} color="#666" />
            <Text className="text-gray-600 text-xs ml-1">{property.bedrooms}</Text>
          </View>
          <View className="flex-row items-center mr-3">
            <Ionicons name="water-outline" size={14} color="#666" />
            <Text className="text-gray-600 text-xs ml-1">{property.bathrooms}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="resize-outline" size={14} color="#666" />
            <Text className="text-gray-600 text-xs ml-1">{property.area_sqft} sqft</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
