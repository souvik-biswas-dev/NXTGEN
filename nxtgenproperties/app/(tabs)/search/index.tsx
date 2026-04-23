import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { PropertyCard } from '@/components/PropertyCard';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useSearchStore } from '@/stores/searchStore';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { BHKType, FurnishingType, PropertyType, PropertyCategory } from '@/types';
import { theme } from '@/constants/theme';

const TAB_BOTTOM = theme.tabBarHeight + 16;

const { height } = Dimensions.get('window');

export default function SearchScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    filteredProperties,
    recentSearches,
    loadingMore,
    hasMore,
    setSearchQuery: updateSearch,
    addRecentSearch,
    clearRecentSearches,
    popularCities,
    priceRanges,
    loadMoreFiltered,
  } = usePropertiesStore();
  
  const searchStore = useSearchStore();
  const { addToSearchHistory } = useUserPreferences();
  
  const [localFilters, setLocalFilters] = useState({
    type: searchStore.type as PropertyType | undefined,
    category: searchStore.category as PropertyCategory | undefined,
    city: searchStore.city,
    minPrice: searchStore.minPrice,
    maxPrice: searchStore.maxPrice,
    bhk: searchStore.bhk || [] as BHKType[],
    furnishing: searchStore.furnishing || [] as FurnishingType[],
    possession: searchStore.possession,
    ownerOnly: searchStore.ownerOnly || false,
  });

  // Sync localFilters from store on every focus (e.g. when navigating from home with pre-set filters)
  useFocusEffect(
    React.useCallback(() => {
      const s = useSearchStore.getState();
      const synced = {
        type: s.type as PropertyType | undefined,
        category: s.category as PropertyCategory | undefined,
        city: s.city,
        minPrice: s.minPrice,
        maxPrice: s.maxPrice,
        bhk: s.bhk || [] as BHKType[],
        furnishing: s.furnishing || [] as FurnishingType[],
        possession: s.possession,
        ownerOnly: s.ownerOnly || false,
      };
      setLocalFilters(synced);
      // Apply filters immediately so the results list updates
      usePropertiesStore.getState().filterProperties(synced);
    }, [])
  );

  // Debounce the text input so every keystroke doesn't hit the server.
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    updateSearch(debouncedQuery);
    // Only query the server if either a text query or an active filter is set;
    // otherwise the empty-state screen is shown.
    const hasText = debouncedQuery.trim().length > 0;
    const hasFilter = Object.values(localFilters).some(
      (v) => v !== undefined && v !== false && !(Array.isArray(v) && v.length === 0),
    );
    if (!hasText && !hasFilter) return;
    usePropertiesStore.getState().filterProperties(localFilters, { query: debouncedQuery });
  }, [debouncedQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addRecentSearch(query);
      // Track search in user preferences
      addToSearchHistory(query, undefined, undefined);
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    updateSearch(query);
  };

  const applyFilters = async () => {
    searchStore.setFilters(localFilters);
    await usePropertiesStore.getState().filterProperties(localFilters);

    // Track filter-based search in user preferences
    if (localFilters.city) {
      await addToSearchHistory(
        `Properties in ${localFilters.city}`,
        localFilters,
        localFilters.city
      );
    }

    setShowFilters(false);
  };

  const resetFilters = () => {
    setLocalFilters({
      type: undefined,
      category: undefined,
      city: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      bhk: [],
      furnishing: [],
      possession: undefined,
      ownerOnly: false,
    });
    searchStore.resetFilters();
    usePropertiesStore.getState().filterProperties({});
  };

  const toggleBHK = (bhk: BHKType) => {
    setLocalFilters(prev => ({
      ...prev,
      bhk: prev.bhk.includes(bhk)
        ? prev.bhk.filter(b => b !== bhk)
        : [...prev.bhk, bhk]
    }));
  };

  const toggleFurnishing = (furnishing: FurnishingType) => {
    setLocalFilters(prev => ({
      ...prev,
      furnishing: prev.furnishing.includes(furnishing)
        ? prev.furnishing.filter(f => f !== furnishing)
        : [...prev.furnishing, furnishing]
    }));
  };

  const activeFilterCount = searchStore.getActiveFilterCount();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }} edges={['top']}>
      {/* Search Header */}
      <View className="px-5 py-4" style={{ backgroundColor: theme.colors.surface }}>
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center px-4 py-3" style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.xl }}>
            <Ionicons name="search" size={20} color={theme.colors.outline} />
            <TextInput
              placeholder="Search by city, locality or project"
              placeholderTextColor={theme.colors.outline}
              className="flex-1 ml-3 text-gray-800 text-base"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.outline} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="ml-3 p-3 relative"
            style={{ backgroundColor: theme.colors.primaryContainer, borderRadius: theme.roundness.lg }}
          >
            <Ionicons name="options" size={22} color={theme.colors.primary} />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 items-center justify-center" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.roundness.full }}>
                <Text className="text-white text-xs font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <TouchableOpacity
            onPress={() => {
              const newType = localFilters.type === 'buy' ? undefined : 'buy' as PropertyType | undefined;
              const newFilters = { ...localFilters, type: newType };
              setLocalFilters(newFilters);
              searchStore.setFilters(newFilters);
              usePropertiesStore.getState().filterProperties(newFilters);
            }}
            className="px-4 py-2 mr-2"
            style={{ backgroundColor: localFilters.type === 'buy' ? theme.colors.primary : theme.colors.surfaceVariant, borderRadius: theme.roundness.full }}
          >
            <Text className="text-sm font-medium" style={{ color: localFilters.type === 'buy' ? theme.colors.onPrimary : theme.colors.secondary }}>Buy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              const newType = localFilters.type === 'rent' ? undefined : 'rent' as PropertyType | undefined;
              const newFilters = { ...localFilters, type: newType };
              setLocalFilters(newFilters);
              searchStore.setFilters(newFilters);
              usePropertiesStore.getState().filterProperties(newFilters);
            }}
            className="px-4 py-2 mr-2"
            style={{ backgroundColor: localFilters.type === 'rent' ? theme.colors.primary : theme.colors.surfaceVariant, borderRadius: theme.roundness.full }}
          >
            <Text className="text-sm font-medium" style={{ color: localFilters.type === 'rent' ? theme.colors.onPrimary : theme.colors.secondary }}>Rent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="px-4 py-2 mr-2 flex-row items-center"
            style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.full }}
          >
            <Text className="text-sm font-medium" style={{ color: theme.colors.secondary }}>BHK</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.outline} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="px-4 py-2 mr-2 flex-row items-center"
            style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.full }}
          >
            <Text className="text-sm font-medium" style={{ color: theme.colors.secondary }}>Budget</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.outline} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newOwnerOnly = !localFilters.ownerOnly;
              const newFilters = { ...localFilters, ownerOnly: newOwnerOnly };
              setLocalFilters(newFilters);
              searchStore.setFilters(newFilters);
              usePropertiesStore.getState().filterProperties(newFilters);
            }}
            className="px-4 py-2 mr-2"
            style={{ backgroundColor: localFilters.ownerOnly ? theme.colors.success : theme.colors.surfaceVariant, borderRadius: theme.roundness.full }}
          >
            <Text className="text-sm font-medium" style={{ color: localFilters.ownerOnly ? '#FFFFFF' : theme.colors.secondary }}>Owner Only</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results or Recent Searches */}
      {searchQuery.length === 0 && activeFilterCount === 0 ? (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-900 text-lg font-bold">Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text className="text-primary text-sm">Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleRecentSearch(search)}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  <Ionicons name="time-outline" size={20} color="#999" />
                  <Text className="text-gray-700 ml-3 flex-1">{search}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Cities */}
          <View className="mt-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">Popular Cities</Text>
            <View className="flex-row flex-wrap">
              {popularCities.slice(0, 8).map((city) => (
                <TouchableOpacity
                  key={city.id}
                  onPress={() => handleSearch(city.name)}
                  className="px-4 py-2 mr-2 mb-2"
                  style={{ borderRadius: theme.roundness.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }}
                >
                  <Text style={{ color: theme.colors.secondary }}>{city.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Featured Properties */}
          <View className="mt-6" style={{ marginBottom: TAB_BOTTOM }}>
            <Text className="text-gray-900 text-lg font-bold mb-4">Recommended for you</Text>
            <View className="flex-row flex-wrap justify-between">
              {filteredProperties.slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: TAB_BOTTOM }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyCard property={item} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadMoreFiltered();
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No properties found</Text>
              <Text className="text-gray-400 text-sm mt-1">Try adjusting your filters</Text>
            </View>
          }
          ListHeaderComponent={
            <View className="px-5 mb-4">
              <Text style={{ color: theme.colors.outline }}>
                {filteredProperties.length} properties found
              </Text>
            </View>
          }
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: theme.colors.secondary }}>Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text className="font-medium" style={{ color: theme.colors.primary }}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Property Type */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <Text className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>Property For</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, type: 'buy' }))}
                  className="flex-1 py-3" style={{ borderTopLeftRadius: theme.roundness.lg, borderBottomLeftRadius: theme.roundness.lg, borderWidth: 1, backgroundColor: localFilters.type === 'buy' ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.type === 'buy' ? theme.colors.primary : theme.colors.outlineVariant }}
                >
                  <Text className="text-center font-medium" style={{ color: localFilters.type === 'buy' ? theme.colors.onPrimary : theme.colors.secondary }}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, type: 'rent' }))}
                  className="flex-1 py-3" style={{ borderTopRightRadius: theme.roundness.lg, borderBottomRightRadius: theme.roundness.lg, borderWidth: 1, borderLeftWidth: 0, backgroundColor: localFilters.type === 'rent' ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.type === 'rent' ? theme.colors.primary : theme.colors.outlineVariant }}
                >
                  <Text className="text-center font-medium" style={{ color: localFilters.type === 'rent' ? theme.colors.onPrimary : theme.colors.secondary }}>Rent</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <Text className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>Property Category</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, category: 'residential' }))}
                  className="flex-1 py-3" style={{ borderTopLeftRadius: theme.roundness.lg, borderBottomLeftRadius: theme.roundness.lg, borderWidth: 1, backgroundColor: localFilters.category === 'residential' ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.category === 'residential' ? theme.colors.primary : theme.colors.outlineVariant }}
                >
                  <Text className="text-center font-medium" style={{ color: localFilters.category === 'residential' ? theme.colors.onPrimary : theme.colors.secondary }}>Residential</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, category: 'commercial' }))}
                  className="flex-1 py-3" style={{ borderTopRightRadius: theme.roundness.lg, borderBottomRightRadius: theme.roundness.lg, borderWidth: 1, borderLeftWidth: 0, backgroundColor: localFilters.category === 'commercial' ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.category === 'commercial' ? theme.colors.primary : theme.colors.outlineVariant }}
                >
                  <Text className="text-center font-medium" style={{ color: localFilters.category === 'commercial' ? theme.colors.onPrimary : theme.colors.secondary }}>Commercial</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BHK */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <Text className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>BHK Type</Text>
              <View className="flex-row flex-wrap">
                {(['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'] as BHKType[]).map((bhk) => (
                  <TouchableOpacity
                    key={bhk}
                    onPress={() => toggleBHK(bhk)}
                    className="px-4 py-2 mr-2 mb-2" style={{ borderRadius: theme.roundness.full, borderWidth: 1, backgroundColor: localFilters.bhk.includes(bhk) ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.bhk.includes(bhk) ? theme.colors.primary : theme.colors.outlineVariant }}
                  >
                    <Text className="font-medium" style={{ color: localFilters.bhk.includes(bhk) ? theme.colors.onPrimary : theme.colors.secondary }}>{bhk}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Budget */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <Text className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>Budget</Text>
              <View className="flex-row flex-wrap">
                {priceRanges[localFilters.type || 'buy'].map((range, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setLocalFilters(prev => ({ ...prev, minPrice: range.min, maxPrice: range.max ?? undefined }))}
                    className="px-4 py-2 mr-2 mb-2" style={{ borderRadius: theme.roundness.full, borderWidth: 1, backgroundColor: localFilters.minPrice === range.min ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.minPrice === range.min ? theme.colors.primary : theme.colors.outlineVariant }}
                  >
                    <Text className="font-medium" style={{ color: localFilters.minPrice === range.min ? theme.colors.onPrimary : theme.colors.secondary }}>{range.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Furnishing */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <Text className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>Furnishing</Text>
              <View className="flex-row flex-wrap">
                {(['furnished', 'semi-furnished', 'unfurnished'] as FurnishingType[]).map((furnishing) => (
                  <TouchableOpacity
                    key={furnishing}
                    onPress={() => toggleFurnishing(furnishing)}
                    className="px-4 py-2 mr-2 mb-2" style={{ borderRadius: theme.roundness.full, borderWidth: 1, backgroundColor: localFilters.furnishing.includes(furnishing) ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.furnishing.includes(furnishing) ? theme.colors.primary : theme.colors.outlineVariant }}
                  >
                    <Text className="font-medium capitalize" style={{ color: localFilters.furnishing.includes(furnishing) ? theme.colors.onPrimary : theme.colors.secondary }}>{furnishing}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Possession */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <Text className="font-semibold mb-3" style={{ color: theme.colors.secondary }}>Possession Status</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, possession: 'ready' }))}
                  className="flex-1 py-3" style={{ borderTopLeftRadius: theme.roundness.lg, borderBottomLeftRadius: theme.roundness.lg, borderWidth: 1, backgroundColor: localFilters.possession === 'ready' ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.possession === 'ready' ? theme.colors.primary : theme.colors.outlineVariant }}
                >
                  <Text className="text-center font-medium" style={{ color: localFilters.possession === 'ready' ? theme.colors.onPrimary : theme.colors.secondary }}>Ready to Move</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, possession: 'under-construction' }))}
                  className="flex-1 py-3" style={{ borderTopRightRadius: theme.roundness.lg, borderBottomRightRadius: theme.roundness.lg, borderWidth: 1, borderLeftWidth: 0, backgroundColor: localFilters.possession === 'under-construction' ? theme.colors.primary : theme.colors.surface, borderColor: localFilters.possession === 'under-construction' ? theme.colors.primary : theme.colors.outlineVariant }}
                >
                  <Text className="text-center font-medium" style={{ color: localFilters.possession === 'under-construction' ? theme.colors.onPrimary : theme.colors.secondary }}>Under Construction</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Owner Only */}
            <View className="px-5 py-5" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <TouchableOpacity
                onPress={() => setLocalFilters(prev => ({ ...prev, ownerOnly: !prev.ownerOnly }))}
                className="flex-row items-center justify-between"
              >
                <View>
                  <Text className="font-semibold" style={{ color: theme.colors.secondary }}>Owner Properties Only</Text>
                  <Text className="text-sm mt-1" style={{ color: theme.colors.outline }}>Hide broker listings</Text>
                </View>
                <View className="w-12 h-7 p-1" style={{ borderRadius: theme.roundness.full, backgroundColor: localFilters.ownerOnly ? theme.colors.primary : theme.colors.outlineVariant }}>
                  <View className={`w-5 h-5 bg-white shadow ${localFilters.ownerOnly ? 'ml-auto' : ''}`} style={{ borderRadius: theme.roundness.full }} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
            <TouchableOpacity
              onPress={applyFilters}
              className="py-4"
              style={{ backgroundColor: theme.colors.primary, borderRadius: theme.roundness.xl }}
            >
              <Text className="text-center font-semibold text-lg" style={{ color: theme.colors.onPrimary }}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
