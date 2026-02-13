import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PropertyCard } from '@/components/PropertyCard';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useSearchStore } from '@/stores/searchStore';
import { popularCities, popularLocalities, priceRanges, allAmenities } from '@/data/dummyProperties';
import { BHKType, FurnishingType, PropertyType, PropertyCategory } from '@/types';

const { height } = Dimensions.get('window');

export default function SearchScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    filteredProperties, 
    recentSearches,
    setSearchQuery: updateSearch,
    addRecentSearch,
  } = usePropertiesStore();
  
  const searchStore = useSearchStore();
  
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateSearch(query);
    if (query.trim()) {
      addRecentSearch(query);
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    updateSearch(query);
  };

  const applyFilters = () => {
    searchStore.setFilters(localFilters);
    usePropertiesStore.getState().filterProperties(localFilters);
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Search Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              placeholder="Search by city, locality or project"
              placeholderTextColor="#999"
              className="flex-1 ml-3 text-gray-800 text-base"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowFilters(true)}
            className="ml-3 bg-orange-50 p-3 rounded-xl relative"
          >
            <Ionicons name="options" size={22} color="#FF6B35" />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
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
            className={`px-4 py-2 rounded-full mr-2 ${localFilters.type === 'buy' ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${localFilters.type === 'buy' ? 'text-white' : 'text-gray-700'}`}>Buy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              const newType = localFilters.type === 'rent' ? undefined : 'rent' as PropertyType | undefined;
              const newFilters = { ...localFilters, type: newType };
              setLocalFilters(newFilters);
              searchStore.setFilters(newFilters);
              usePropertiesStore.getState().filterProperties(newFilters);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${localFilters.type === 'rent' ? 'bg-primary' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${localFilters.type === 'rent' ? 'text-white' : 'text-gray-700'}`}>Rent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="px-4 py-2 rounded-full mr-2 bg-gray-100 flex-row items-center"
          >
            <Text className="text-gray-700 text-sm font-medium">BHK</Text>
            <Ionicons name="chevron-down" size={16} color="#666" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="px-4 py-2 rounded-full mr-2 bg-gray-100 flex-row items-center"
          >
            <Text className="text-gray-700 text-sm font-medium">Budget</Text>
            <Ionicons name="chevron-down" size={16} color="#666" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newOwnerOnly = !localFilters.ownerOnly;
              const newFilters = { ...localFilters, ownerOnly: newOwnerOnly };
              setLocalFilters(newFilters);
              searchStore.setFilters(newFilters);
              usePropertiesStore.getState().filterProperties(newFilters);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${localFilters.ownerOnly ? 'bg-green-600' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${localFilters.ownerOnly ? 'text-white' : 'text-gray-700'}`}>Owner Only</Text>
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
                <TouchableOpacity>
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
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 mr-2 mb-2"
                >
                  <Text className="text-gray-700">{city.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Featured Properties */}
          <View className="mt-6 mb-6">
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
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyCard property={item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No properties found</Text>
              <Text className="text-gray-400 text-sm mt-1">Try adjusting your filters</Text>
            </View>
          }
          ListHeaderComponent={
            <View className="px-5 mb-4">
              <Text className="text-gray-600">
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
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text className="text-gray-900 text-lg font-bold">Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text className="text-primary font-medium">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Property Type */}
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold mb-3">Property For</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, type: 'buy' }))}
                  className={`flex-1 py-3 rounded-l-xl border ${localFilters.type === 'buy' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-center font-medium ${localFilters.type === 'buy' ? 'text-white' : 'text-gray-700'}`}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, type: 'rent' }))}
                  className={`flex-1 py-3 rounded-r-xl border-t border-b border-r ${localFilters.type === 'rent' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-center font-medium ${localFilters.type === 'rent' ? 'text-white' : 'text-gray-700'}`}>Rent</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category */}
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold mb-3">Property Category</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, category: 'residential' }))}
                  className={`flex-1 py-3 rounded-l-xl border ${localFilters.category === 'residential' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-center font-medium ${localFilters.category === 'residential' ? 'text-white' : 'text-gray-700'}`}>Residential</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, category: 'commercial' }))}
                  className={`flex-1 py-3 rounded-r-xl border-t border-b border-r ${localFilters.category === 'commercial' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-center font-medium ${localFilters.category === 'commercial' ? 'text-white' : 'text-gray-700'}`}>Commercial</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BHK */}
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold mb-3">BHK Type</Text>
              <View className="flex-row flex-wrap">
                {(['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'] as BHKType[]).map((bhk) => (
                  <TouchableOpacity
                    key={bhk}
                    onPress={() => toggleBHK(bhk)}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${localFilters.bhk.includes(bhk) ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-medium ${localFilters.bhk.includes(bhk) ? 'text-white' : 'text-gray-700'}`}>{bhk}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Budget */}
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold mb-3">Budget</Text>
              <View className="flex-row flex-wrap">
                {priceRanges[localFilters.type || 'buy'].map((range, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setLocalFilters(prev => ({ ...prev, minPrice: range.min, maxPrice: range.max }))}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${localFilters.minPrice === range.min ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-medium ${localFilters.minPrice === range.min ? 'text-white' : 'text-gray-700'}`}>{range.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Furnishing */}
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold mb-3">Furnishing</Text>
              <View className="flex-row flex-wrap">
                {(['furnished', 'semi-furnished', 'unfurnished'] as FurnishingType[]).map((furnishing) => (
                  <TouchableOpacity
                    key={furnishing}
                    onPress={() => toggleFurnishing(furnishing)}
                    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${localFilters.furnishing.includes(furnishing) ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-medium capitalize ${localFilters.furnishing.includes(furnishing) ? 'text-white' : 'text-gray-700'}`}>{furnishing}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Possession */}
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold mb-3">Possession Status</Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, possession: 'ready' }))}
                  className={`flex-1 py-3 rounded-l-xl border ${localFilters.possession === 'ready' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-center font-medium ${localFilters.possession === 'ready' ? 'text-white' : 'text-gray-700'}`}>Ready to Move</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLocalFilters(prev => ({ ...prev, possession: 'under-construction' }))}
                  className={`flex-1 py-3 rounded-r-xl border-t border-b border-r ${localFilters.possession === 'under-construction' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`text-center font-medium ${localFilters.possession === 'under-construction' ? 'text-white' : 'text-gray-700'}`}>Under Construction</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Owner Only */}
            <View className="px-5 py-4 border-b border-gray-100">
              <TouchableOpacity
                onPress={() => setLocalFilters(prev => ({ ...prev, ownerOnly: !prev.ownerOnly }))}
                className="flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-gray-900 font-semibold">Owner Properties Only</Text>
                  <Text className="text-gray-500 text-sm mt-1">Hide broker listings</Text>
                </View>
                <View className={`w-12 h-7 rounded-full p-1 ${localFilters.ownerOnly ? 'bg-primary' : 'bg-gray-200'}`}>
                  <View className={`w-5 h-5 rounded-full bg-white shadow ${localFilters.ownerOnly ? 'ml-auto' : ''}`} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="px-5 py-4 border-t border-gray-100">
            <TouchableOpacity
              onPress={applyFilters}
              className="bg-primary rounded-xl py-4"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
