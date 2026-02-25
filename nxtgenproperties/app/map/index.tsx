import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { Property } from '@/types';

interface LocalityGroup {
  locality: string;
  city: string;
  properties: Property[];
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `${(price / 100000).toFixed(1)} L`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return `${price}`;
}

export default function MapViewScreen() {
  const router = useRouter();
  const { properties, loading } = usePropertiesStore();
  const [expandedLocality, setExpandedLocality] = useState<string | null>(null);

  const localityGroups = useMemo(() => {
    const grouped: Record<string, LocalityGroup> = {};
    properties.forEach((p) => {
      const key = `${p.locality}__${p.city}`;
      if (!grouped[key]) {
        grouped[key] = { locality: p.locality, city: p.city, properties: [] };
      }
      grouped[key].properties.push(p);
    });
    return Object.values(grouped).sort((a, b) =>
      b.properties.length - a.properties.length
    );
  }, [properties]);

  const toggleLocality = (key: string) => {
    setExpandedLocality((prev) => (prev === key ? null : key));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }} 
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Ionicons name="map-outline" size={22} color="#FF6B35" />
        <Text className="text-lg font-bold text-gray-800 ml-2">Map View</Text>
        <View className="ml-auto bg-orange-100 px-2 py-1 rounded-full">
          <Text className="text-xs font-medium" style={{ color: '#FF6B35' }}>
            {properties.length} properties
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text className="text-gray-500 mt-3">Loading properties...</Text>
        </View>
      ) : localityGroups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="location-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-400 mt-3 text-center">
            No properties found. Try adjusting your search filters.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <Text className="text-xs text-gray-400 mb-3">
            Properties grouped by locality (privacy-safe view)
          </Text>

          {localityGroups.map((group) => {
            const key = `${group.locality}__${group.city}`;
            const isExpanded = expandedLocality === key;

            return (
              <View key={key} className="mb-3 rounded-xl border border-gray-200 overflow-hidden">
                {/* Locality Header */}
                <TouchableOpacity
                  onPress={() => toggleLocality(key)}
                  className="flex-row items-center px-4 py-3"
                  style={{ backgroundColor: isExpanded ? '#FFF7ED' : '#FAFAFA' }}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#FF6B35' }}
                  >
                    <Text className="text-white font-bold text-sm">
                      {group.properties.length}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">
                      {group.locality}
                    </Text>
                    <Text className="text-xs text-gray-500">{group.city}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {/* Expanded Property List */}
                {isExpanded && (
                  <View className="border-t border-gray-100">
                    {group.properties.map((property, idx) => (
                      <TouchableOpacity
                        key={property.id}
                        onPress={() => router.push(`/(tabs)/search/${property.id}`)}
                        className={`flex-row items-center px-4 py-3 ${
                          idx < group.properties.length - 1 ? 'border-b border-gray-50' : ''
                        }`}
                        activeOpacity={0.7}
                      >
                        <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center mr-3">
                          <Ionicons name="home-outline" size={16} color="#FF6B35" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                            {property.title}
                          </Text>
                          <View className="flex-row items-center mt-0.5">
                            <Text className="text-xs text-gray-500">{property.bhk}</Text>
                            <Text className="text-xs text-gray-300 mx-1">|</Text>
                            <Text className="text-xs text-gray-500">
                              {property.area_sqft} sq.ft
                            </Text>
                            <Text className="text-xs text-gray-300 mx-1">|</Text>
                            <Text className="text-xs capitalize text-gray-500">
                              {property.type}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm font-bold" style={{ color: '#FF6B35' }}>
                          {property.type === 'rent' ? '' : ''}₹{formatPrice(property.price)}
                          {property.type === 'rent' ? '/mo' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
