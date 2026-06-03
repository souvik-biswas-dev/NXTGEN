import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

type TimeRange = '1M' | '3M' | '6M' | '1Y';
type PropertyType = 'residential' | 'commercial';

interface MarketTrend {
  city: string;
  trend: 'up' | 'down';
  change: string;
  avgPrice: string;
  period: string;
}

interface PlatformCity {
  id: string;
  name: string;
  properties: number;
}

interface TopLocality {
  name: string;
  price: string;
  change: string;
  trend: 'up' | 'down';
}

export default function InsightsScreen() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [timeRange, setTimeRange] = useState<TimeRange>('6M');
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [popularCities, setPopularCities] = useState<PlatformCity[]>([]);
  const [topLocalities, setTopLocalities] = useState<TopLocality[]>([]);
  const [avgApartmentPrice] = useState<number>(0);
  const [avgVillaPrice] = useState<number>(0);
  // Live locality price trends (₹/sqft) computed from listings for the selected city.
  const [localityPsf, setLocalityPsf] = useState<
    { locality: string; avgPsf: number; listings: number }[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const platformMap = await api.get<Record<string, unknown>>(
          '/platform-data',
          undefined,
          false
        );

        if (Array.isArray(platformMap.market_trends)) {
          setMarketTrends(platformMap.market_trends as MarketTrend[]);
        }
        if (Array.isArray(platformMap.popular_cities)) {
          setPopularCities(platformMap.popular_cities as PlatformCity[]);
        }
        if (Array.isArray(platformMap.top_localities)) {
          setTopLocalities(platformMap.top_localities as TopLocality[]);
        }
      } catch (e) {
        console.error('Error loading insights data:', e);
      }
    };

    loadData();
  }, []);

  // Reload live ₹/sqft per locality whenever the selected city changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{
          localities: { locality: string; avgPsf: number; listings: number }[];
        }>(`/reviews/insights/${encodeURIComponent(selectedCity)}`, undefined, false);
        if (!cancelled) setLocalityPsf(res.localities ?? []);
      } catch {
        if (!cancelled) setLocalityPsf([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  const cityTrend = marketTrends.find((t) => t.city === selectedCity) ||
    marketTrends[0] || {
      city: selectedCity,
      trend: 'up' as const,
      change: '+0.0%',
      avgPrice: '0',
      period: 'YoY',
    };

  const avgPrices = {
    apartment: avgApartmentPrice || 0,
    villa: avgVillaPrice || 0,
  };

  const timeRanges: TimeRange[] = ['1M', '3M', '6M', '1Y'];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#1B2838', '#2A3F55']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-14 pb-8 px-4"
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Market Insights</Text>
        </View>
        <Text className="text-white/80">
          Real estate trends and analytics to help you make informed decisions
        </Text>
      </LinearGradient>

      {/* City Selector */}
      <View className="px-4 -mt-4">
        <View className="bg-white rounded-2xl p-4 shadow-lg">
          <Text className="text-gray-500 text-sm mb-3">Select City</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularCities.slice(0, 6).map((city) => (
              <TouchableOpacity
                key={city.name}
                onPress={() => setSelectedCity(city.name)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedCity === city.name ? 'bg-primary' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCity === city.name ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {city.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Market Overview */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">{selectedCity} Market Overview</Text>

        <View className="flex-row">
          <View className="flex-1 bg-white rounded-xl p-4 mr-2 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  cityTrend.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <Ionicons
                  name={cityTrend.trend === 'up' ? 'trending-up' : 'trending-down'}
                  size={18}
                  color={cityTrend.trend === 'up' ? '#22C55E' : '#EF4444'}
                />
              </View>
              <Text
                className={`ml-2 font-bold ${
                  cityTrend.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {cityTrend.change}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm">Price Change (YoY)</Text>
          </View>

          <View className="flex-1 bg-white rounded-xl p-4 ml-2 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-1">₹{cityTrend.avgPrice}</Text>
            <Text className="text-gray-500 text-sm">Avg. Price/sqft</Text>
          </View>
        </View>
      </View>

      {/* Price Trend Chart */}
      <View className="px-4 mt-6">
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Price Trend</Text>
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              {timeRanges.map((range) => (
                <TouchableOpacity
                  key={range}
                  onPress={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md ${timeRange === range ? 'bg-primary' : ''}`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      timeRange === range ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Simple Chart Visualization */}
          <View className="h-40 flex-row items-end justify-between px-2">
            {[65, 72, 68, 78, 82, 75, 85, 88, 92, 95, 90, 98].map((value, index) => (
              <View key={index} className="items-center flex-1 mx-0.5">
                <LinearGradient
                  colors={['#0F766E', '#14B8A6']}
                  className="w-full rounded-t-sm"
                  style={{ height: value * 1.2 }}
                />
              </View>
            ))}
          </View>
          <View className="flex-row justify-between mt-2 px-2">
            <Text className="text-xs text-gray-400">Jan</Text>
            <Text className="text-xs text-gray-400">Mar</Text>
            <Text className="text-xs text-gray-400">Jun</Text>
            <Text className="text-xs text-gray-400">Sep</Text>
            <Text className="text-xs text-gray-400">Dec</Text>
          </View>
        </View>
      </View>

      {/* Property Type Performance */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">Property Type Performance</Text>

        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row bg-gray-100 rounded-lg p-1 mb-4">
            <TouchableOpacity
              onPress={() => setPropertyType('residential')}
              className={`flex-1 py-2 rounded-md ${
                propertyType === 'residential' ? 'bg-primary' : ''
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  propertyType === 'residential' ? 'text-white' : 'text-gray-500'
                }`}
              >
                Residential
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPropertyType('commercial')}
              className={`flex-1 py-2 rounded-md ${
                propertyType === 'commercial' ? 'bg-primary' : ''
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  propertyType === 'commercial' ? 'text-white' : 'text-gray-500'
                }`}
              >
                Commercial
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View className="flex-row flex-wrap">
            <View className="w-1/2 p-2">
              <View className="bg-teal-50 rounded-xl p-3">
                <Text className="text-primary text-lg font-bold">₹{avgPrices.apartment}L</Text>
                <Text className="text-gray-600 text-sm">Avg. Apartment Price</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="trending-up" size={14} color="#22C55E" />
                  <Text className="text-green-600 text-xs ml-1">+8.2%</Text>
                </View>
              </View>
            </View>
            <View className="w-1/2 p-2">
              <View className="bg-purple-50 rounded-xl p-3">
                <Text className="text-purple-600 text-lg font-bold">₹{avgPrices.villa}L</Text>
                <Text className="text-gray-600 text-sm">Avg. Villa Price</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="trending-up" size={14} color="#22C55E" />
                  <Text className="text-green-600 text-xs ml-1">+12.5%</Text>
                </View>
              </View>
            </View>
            <View className="w-1/2 p-2">
              <View className="bg-green-50 rounded-xl p-3">
                <Text className="text-green-600 text-lg font-bold">2,450</Text>
                <Text className="text-gray-600 text-sm">New Listings (This Month)</Text>
              </View>
            </View>
            <View className="w-1/2 p-2">
              <View className="bg-teal-50 rounded-xl p-3">
                <Text className="text-teal-700 text-lg font-bold">18 Days</Text>
                <Text className="text-gray-600 text-sm">Avg. Time to Sell</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Top Localities */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">Top Performing Localities</Text>

        <View className="bg-white rounded-2xl p-4 shadow-sm">
          {topLocalities.slice(0, 5).map((locality, index) => (
            <View
              key={locality.name}
              className={`flex-row items-center justify-between py-3 ${
                index < topLocalities.slice(0, 5).length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-teal-100 rounded-full items-center justify-center">
                  <Text className="text-primary font-bold">{index + 1}</Text>
                </View>
                <View className="ml-3">
                  <Text className="font-medium text-gray-900">{locality.name}</Text>
                  <Text className="text-gray-500 text-sm">₹{locality.price}/sqft</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Ionicons
                  name={locality.trend === 'up' ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={locality.trend === 'up' ? '#22C55E' : '#EF4444'}
                />
                <Text
                  className={`ml-1 font-medium ${
                    locality.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {locality.change}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Live ₹/sqft by locality — computed from current listings in the selected city */}
      {localityPsf.length > 0 && (
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            Live prices in {selectedCity}
          </Text>
          <Text className="text-gray-500 text-sm mb-4">Average ₹/sqft from active listings</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {localityPsf.slice(0, 8).map((row, index, arr) => (
              <View
                key={row.locality}
                className={`flex-row items-center justify-between py-3 ${
                  index < arr.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-1 pr-3">
                  <Text className="font-medium text-gray-900">{row.locality}</Text>
                  <Text className="text-gray-500 text-xs">{row.listings} listings</Text>
                </View>
                <Text className="text-primary font-bold">
                  ₹{Number(row.avgPsf || 0).toLocaleString('en-IN')}/sqft
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Market Comparison */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">City Comparison</Text>

        <View className="bg-white rounded-2xl p-4 shadow-sm">
          {marketTrends.slice(0, 5).map((trend, index) => (
            <View
              key={trend.city}
              className={`py-3 ${index < 4 ? 'border-b border-gray-100' : ''}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-medium text-gray-900">{trend.city}</Text>
                <Text className="text-gray-600">₹{trend.avgPrice}/sqft</Text>
              </View>
              <View className="flex-row items-center">
                <View className="flex-1 bg-gray-100 rounded-full h-2 mr-3">
                  <LinearGradient
                    colors={trend.trend === 'up' ? ['#22C55E', '#86EFAC'] : ['#EF4444', '#FCA5A5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-2 rounded-full"
                    style={{ width: `${Math.min(parseInt(trend.change), 100)}%` }}
                  />
                </View>
                <View className="flex-row items-center w-16">
                  <Ionicons
                    name={trend.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={trend.trend === 'up' ? '#22C55E' : '#EF4444'}
                  />
                  <Text
                    className={`text-sm font-medium ml-1 ${
                      trend.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trend.change}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Investment Tips */}
      <View className="px-4 mt-6 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-4">Investment Tips</Text>

        <View className="bg-gradient-to-br from-primary to-teal-700 rounded-2xl p-5">
          <View className="flex-row items-start mb-4">
            <View className="bg-white/20 rounded-full p-2">
              <Ionicons name="bulb" size={24} color="white" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold text-lg mb-1">Pro Tip</Text>
              <Text className="text-white/90">
                Suburban areas of {selectedCity} are showing strong growth potential with
                infrastructure developments planned for the next 2 years.
              </Text>
            </View>
          </View>

          <View className="bg-white/10 rounded-xl p-4">
            <Text className="text-white/80 text-sm mb-3">Key Investment Zones</Text>
            <View className="flex-row flex-wrap">
              {['Peripheral Areas', 'Metro Corridors', 'IT Hubs', 'Upcoming SEZs'].map((zone) => (
                <View key={zone} className="bg-white/20 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-white text-sm">{zone}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
