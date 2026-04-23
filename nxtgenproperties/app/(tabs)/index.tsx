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
  Modal,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PropertyCard } from '@/components/PropertyCard';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { useSearchStore } from '@/stores/searchStore';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Property, PropertyType } from '@/types';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

// --- Skeleton Placeholder Components ---
const SkeletonBlock = ({
  w,
  h,
  rounded = 8,
  style,
}: {
  w: number | `${number}%`;
  h: number;
  rounded?: number;
  style?: object;
}) => (
  <View
    style={[
      {
        width: w,
        height: h,
        borderRadius: rounded,
        backgroundColor: theme.colors.outlineVariant,
        opacity: 0.45,
      },
      style,
    ]}
  />
);

const SkeletonPropertyCard = () => (
  <View style={[styles.skeletonCard, { width: '48%' }]}>
    <SkeletonBlock w="100%" h={120} rounded={theme.roundness.lg} />
    <View style={{ padding: 10 }}>
      <SkeletonBlock w="80%" h={14} style={{ marginBottom: 8 }} />
      <SkeletonBlock w="60%" h={12} />
    </View>
  </View>
);

const SkeletonFeaturedCard = () => (
  <View style={[styles.skeletonCard, { width: width * 0.7, marginRight: 16 }]}>
    <SkeletonBlock w="100%" h={140} rounded={theme.roundness.lg} />
    <View style={{ padding: 12 }}>
      <SkeletonBlock w="85%" h={14} style={{ marginBottom: 8 }} />
      <SkeletonBlock w="55%" h={12} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonBlock w={40} h={12} />
        <SkeletonBlock w={40} h={12} />
        <SkeletonBlock w={40} h={12} />
      </View>
    </View>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<PropertyType>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { user, signOut } = useAuthStore();
  const { getPreferredCities } = useUserPreferences();
  const { fetchFavorites } = useFavoritesStore();
  const { recentItems, fetchRecentlyViewed } = useRecentlyViewedStore();
  const searchStore = useSearchStore();

  const {
    getFeaturedProperties,
    getNearbyProperties,
    filterByPreferredCities,
    fetchProperties,
    fetchPlatformData,
    popularCities,
    newLaunches,
    marketTrends,
    platformDataLoaded,
    propertiesLoaded,
    loading,
    setSearchQuery: updateStoreSearch,
    addRecentSearch,
  } = usePropertiesStore();

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        try {
          const promises: Promise<void>[] = [];
          if (!platformDataLoaded) {
            promises.push(fetchPlatformData());
          }
          const cities = getPreferredCities();
          // Only fetch properties if not already loaded (avoids reload on tab switch)
          promises.push(fetchProperties(cities));
          if (user?.id && !propertiesLoaded) {
            promises.push(fetchFavorites());
            promises.push(fetchRecentlyViewed());
          }
          await Promise.all(promises);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }, [user?.id, platformDataLoaded, propertiesLoaded])
  );

  // Get preferred cities after preferences have been loaded via the hook
  const preferredCities = getPreferredCities();
  const propertiesForFeed =
    preferredCities.length > 0
      ? filterByPreferredCities(preferredCities).slice(0, 10)
      : getFeaturedProperties();
  const nearbyProperties = getNearbyProperties(activeType);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const cities = getPreferredCities();
      await Promise.all([
        fetchProperties(cities, true),
        fetchPlatformData(),
        user?.id ? fetchFavorites() : Promise.resolve(),
        user?.id ? fetchRecentlyViewed() : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
      updateStoreSearch(searchQuery);
      router.push('/(tabs)/search');
    }
  };

  const navigateToSearch = (
    query?: string,
    type?: PropertyType,
    category?: 'residential' | 'commercial'
  ) => {
    if (query) {
      updateStoreSearch(query);
      addRecentSearch(query);
    }
    if (type || category) {
      searchStore.setFilters({ type, category });
      usePropertiesStore.getState().filterProperties({ type, category });
    }
    router.push('/(tabs)/search');
  };

  const navigateToCalculator = (type: 'emi' | 'budget') => {
    router.push(`/tools/${type}-calculator` as any);
  };

  const drawerMenuItems = [
    {
      icon: 'person-outline' as const,
      label: 'My Profile',
      onPress: () => {
        setMenuVisible(false);
        router.push('/(tabs)/profile');
      },
    },
    {
      icon: 'heart-outline' as const,
      label: 'Shortlisted',
      onPress: () => {
        setMenuVisible(false);
        router.push('/(tabs)/favorite');
      },
    },
    {
      icon: 'home-outline' as const,
      label: 'My Listings',
      onPress: () => {
        setMenuVisible(false);
        router.push('/(tabs)/post');
      },
    },
    {
      icon: 'calculator-outline' as const,
      label: 'EMI Calculator',
      onPress: () => {
        setMenuVisible(false);
        router.push('/tools/emi-calculator' as any);
      },
    },
    {
      icon: 'wallet-outline' as const,
      label: 'Budget Calculator',
      onPress: () => {
        setMenuVisible(false);
        router.push('/tools/budget-calculator' as any);
      },
    },
    {
      icon: 'trending-up-outline' as const,
      label: 'Market Insights',
      onPress: () => {
        setMenuVisible(false);
        router.push('/insights' as any);
      },
    },
    {
      icon: 'settings-outline' as const,
      label: 'Settings',
      onPress: () => {
        setMenuVisible(false);
        router.push('/settings' as any);
      },
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Help & Support',
      onPress: () => {
        setMenuVisible(false);
        router.push('/help' as any);
      },
    },
    {
      icon: 'information-circle-outline' as const,
      label: 'About',
      onPress: () => {
        setMenuVisible(false);
        router.push('/about' as any);
      },
    },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.colors.surface }}
      edges={['top']}
    >
      {/* ========== Full-Screen Side Drawer ========== */}
      <Modal
        visible={menuVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: theme.roundness.full,
                  backgroundColor: theme.colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                  overflow: 'hidden',
                }}
              >
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={{ width: 56, height: 56 }} />
                ) : (
                  <Ionicons name="person" size={28} color={theme.colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.secondary, fontSize: 18, fontWeight: '700' }}>
                  {user?.name || 'Guest User'}
                </Text>
                <Text style={{ color: theme.colors.outline, fontSize: 13, marginTop: 2 }}>
                  {user?.email || 'Login to access all features'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.roundness.full,
                  backgroundColor: theme.colors.surfaceVariant,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.outlineVariant,
                marginHorizontal: 16,
              }}
            />

            {/* Drawer Items */}
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {drawerMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  style={styles.drawerItem}
                  activeOpacity={0.6}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.roundness.full,
                      backgroundColor: theme.colors.surfaceVariant,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={item.icon} size={22} color={theme.colors.secondary} />
                  </View>
                  <Text
                    style={{
                      color: theme.colors.secondary,
                      fontSize: 16,
                      fontWeight: '500',
                      marginLeft: 16,
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.outlineVariant} />
                </TouchableOpacity>
              ))}

              {user && (
                <TouchableOpacity
                  onPress={async () => {
                    setMenuVisible(false);
                    await signOut();
                    router.replace('/(auth)');
                  }}
                  style={[styles.drawerItem, { marginTop: 16 }]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.roundness.full,
                      backgroundColor: '#FEE2E2',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                  </View>
                  <Text
                    style={{
                      color: theme.colors.error,
                      fontSize: 16,
                      fontWeight: '500',
                      marginLeft: 16,
                      flex: 1,
                    }}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ========== Main Scroll ========== */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ========== Navy Layered Hero ========== */}
        <View style={styles.hero}>
          {/* top row: menu + greeting + avatar */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.heroIconBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.heroGreeting}>
                {user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome'}
              </Text>
              <Text style={styles.heroTagline}>Find a home that fits your life</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.heroAvatar}
              activeOpacity={0.7}
            >
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={{ width: 40, height: 40 }} />
              ) : (
                <Ionicons name="person" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* search bar — floats on the navy/cream boundary */}
          <View style={styles.heroSearchWrap}>
            <View style={styles.heroSearchBar}>
              <Ionicons name="search" size={20} color={theme.colors.primary} />
              <TextInput
                placeholder="Sector 150, Whitefield, DLF Phase 2…"
                placeholderTextColor={theme.colors.outline}
                style={styles.heroSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.outline} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ========== 2×3 Action Tile Grid ========== */}
        <View style={styles.tileGrid}>
          {[
            {
              key: 'buy',
              label: 'Buy',
              sub: 'Ready-to-move homes',
              icon: 'home' as const,
              color: theme.colors.primary,
              action: () => {
                setActiveType('buy');
                navigateToSearch(undefined, 'buy');
              },
            },
            {
              key: 'rent',
              label: 'Rent',
              sub: 'Flexible stay',
              icon: 'key' as const,
              color: '#10B981',
              action: () => {
                setActiveType('rent');
                navigateToSearch(undefined, 'rent');
              },
            },
            {
              key: 'commercial',
              label: 'Commercial',
              sub: 'Offices & shops',
              icon: 'storefront' as const,
              color: '#8B5CF6',
              action: () => navigateToSearch(undefined, undefined, 'commercial'),
            },
            {
              key: 'projects',
              label: 'Projects',
              sub: 'New launches',
              icon: 'business' as const,
              color: theme.colors.gold,
              action: () => router.push('/projects' as any),
            },
            {
              key: 'emi',
              label: 'EMI',
              sub: 'Loan calculator',
              icon: 'wallet' as const,
              color: '#EC4899',
              action: () => navigateToCalculator('emi'),
            },
            {
              key: 'insights',
              label: 'Insights',
              sub: 'Market trends',
              icon: 'trending-up' as const,
              color: theme.colors.secondary,
              action: () => router.push('/insights' as any),
            },
          ].map((tile) => (
            <TouchableOpacity
              key={tile.key}
              onPress={tile.action}
              activeOpacity={0.85}
              style={styles.tile}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: tile.color + '18' }]}>
                <Ionicons name={tile.icon} size={20} color={tile.color} />
              </View>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileSub} numberOfLines={1}>
                {tile.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ========== Buying a Home ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buying a home</Text>
          <Text style={styles.sectionSubtitle}>
            Apartments, land, builder floors, villas and more
          </Text>

          {loading ? (
            <View className="flex-row flex-wrap justify-between mt-3">
              <SkeletonPropertyCard />
              <SkeletonPropertyCard />
              <SkeletonPropertyCard />
              <SkeletonPropertyCard />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between mt-3">
              {nearbyProperties.slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigateToSearch()}
            style={styles.seeAllBtn}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: theme.colors.onPrimary,
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 15,
              }}
            >
              See all {activeType === 'buy' ? 'Buy' : 'Rent'} properties
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========== Popular Cities - MD3 Chips ========== */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {popularCities.slice(0, 6).map((city) => (
              <TouchableOpacity
                key={city.id}
                onPress={() => navigateToSearch(city.name)}
                style={styles.cityChip}
                activeOpacity={0.7}
              >
                <View style={styles.cityIcon}>
                  <Ionicons name="location" size={20} color={theme.colors.primary} />
                </View>
                <Text
                  style={{
                    color: theme.colors.secondary,
                    fontSize: 13,
                    fontWeight: '600',
                    marginTop: 6,
                  }}
                >
                  {city.name}
                </Text>
                <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 2 }}>
                  {city.properties}+ properties
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ========== Featured / Preferred Properties ========== */}
        <View style={styles.section}>
          <View className="flex-row justify-between items-center mb-3">
            <Text style={styles.sectionTitle}>
              {preferredCities.length > 0
                ? `Properties in ${preferredCities.join(', ')}`
                : 'Featured Properties'}
            </Text>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SkeletonFeaturedCard />
              <SkeletonFeaturedCard />
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {propertiesForFeed.map((property) => (
                <View key={property.id} className="mr-4" style={{ width: width * 0.7 }}>
                  <FeaturedPropertyCard property={property} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ========== New Launches ========== */}
        <View style={[styles.section, { backgroundColor: theme.colors.primaryContainer + '30' }]}>
          <View className="flex-row items-center mb-4">
            <View
              style={{
                backgroundColor: theme.colors.error,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: theme.roundness.sm,
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>NEW</Text>
            </View>
            <Text style={styles.sectionTitle}>Project Launches</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {newLaunches.map((project) => (
              <TouchableOpacity key={project.id} style={styles.launchCard}>
                <Image
                  source={{ uri: project.image }}
                  className="w-full h-32"
                  style={{
                    borderTopLeftRadius: theme.roundness.lg,
                    borderTopRightRadius: theme.roundness.lg,
                    backgroundColor: theme.colors.surfaceVariant,
                  }}
                  resizeMode="cover"
                  fadeDuration={0}
                />
                <View style={{ padding: 12 }}>
                  <Text
                    style={{ color: theme.colors.secondary, fontWeight: '600', fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {project.name}
                  </Text>
                  <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 3 }}>
                    by {project.developer}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="location-outline" size={12} color={theme.colors.outline} />
                    <Text
                      style={{ color: theme.colors.outline, fontSize: 12, marginLeft: 3 }}
                      numberOfLines={1}
                    >
                      {project.location}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>
                      {project.priceRange}
                    </Text>
                    <View
                      style={{
                        backgroundColor: '#D1FAE5',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: theme.roundness.sm,
                      }}
                    >
                      <Text style={{ color: '#047857', fontSize: 11 }}>{project.launchDate}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ========== Market Trends ========== */}
        <View style={styles.section}>
          <View className="flex-row justify-between items-center mb-4">
            <Text style={styles.sectionTitle}>Market Trends</Text>
            <TouchableOpacity onPress={() => router.push('/insights' as any)}>
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                View Details
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {marketTrends.map((trend, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendCard}
                onPress={() => navigateToSearch(trend.city)}
                activeOpacity={0.7}
              >
                <Text style={{ color: theme.colors.outline, fontSize: 13 }}>{trend.city}</Text>
                <Text
                  style={{
                    color: theme.colors.success,
                    fontSize: 22,
                    fontWeight: '700',
                    marginTop: 4,
                  }}
                >
                  {trend.trend}
                </Text>
                <Text style={{ color: theme.colors.outlineVariant, fontSize: 11, marginTop: 4 }}>
                  {trend.period}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '600' }}>
                    Explore
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={11}
                    color={theme.colors.primary}
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ========== Recently Viewed ========== */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View className="flex-row justify-between items-center mb-3">
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <TouchableOpacity onPress={() => navigateToSearch()}>
                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentItems.slice(0, 10).map((property) => (
                <View key={property.id} className="mr-4" style={{ width: width * 0.7 }}>
                  <FeaturedPropertyCard property={property} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========== Post Property Banner ========== */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/post')}
          activeOpacity={0.85}
          style={{ paddingHorizontal: 20, marginBottom: 24 }}
        >
          <LinearGradient
            colors={[theme.colors.primary, '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: theme.roundness.lg, padding: 20 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                  Post Your Property FREE
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 12 }}>
                  Reach out to 10 Lakh+ buyers
                </Text>
                <View style={styles.postNowBtn}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>
                    Post Now
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: theme.roundness.full,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="home" size={36} color="white" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: theme.tabBarHeight + 16 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ========== Featured Property Card (inline) ==========
interface FeaturedPropertyCardProps {
  property: Property;
}

const FeaturedPropertyCard: React.FC<FeaturedPropertyCardProps> = ({ property }) => {
  const router = useRouter();

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `\u20B9${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `\u20B9${(price / 100000).toFixed(2)} L`;
    return `\u20B9${price.toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/search/${property.id}`)}
      style={styles.featuredCard}
      activeOpacity={0.8}
    >
      <View
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderTopLeftRadius: theme.roundness.lg,
          borderTopRightRadius: theme.roundness.lg,
        }}
      >
        <Image
          source={{ uri: property.photos[0] }}
          className="w-full h-40"
          resizeMode="cover"
          fadeDuration={0}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        />
        {property.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>
              FEATURED
            </Text>
          </View>
        )}
        {property.broker?.verified_broker && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginLeft: 3 }}>
              Verified
            </Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            justifyContent: 'flex-end',
            paddingHorizontal: 12,
            paddingBottom: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
            {formatPrice(property.price)}
          </Text>
        </LinearGradient>
      </View>

      <View style={{ padding: 12 }}>
        <Text
          style={{ color: theme.colors.secondary, fontWeight: '600', fontSize: 14 }}
          numberOfLines={1}
        >
          {property.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={13} color={theme.colors.outline} />
          <Text
            style={{ color: theme.colors.outline, fontSize: 12, marginLeft: 3 }}
            numberOfLines={1}
          >
            {property.locality}, {property.city}
          </Text>
        </View>
        <View
          className="flex-row items-center mt-2 pt-2"
          style={{ borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}
        >
          {[
            { icon: 'bed-outline' as const, val: property.bedrooms },
            { icon: 'water-outline' as const, val: property.bathrooms },
            { icon: 'resize-outline' as const, val: `${property.area_sqft} sqft` },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center mr-4">
              <View
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 6,
                  padding: 3,
                }}
              >
                <Ionicons name={item.icon} size={13} color={theme.colors.primary} />
              </View>
              <Text
                style={{
                  color: theme.colors.secondary,
                  fontSize: 11,
                  fontWeight: '500',
                  marginLeft: 4,
                }}
              >
                {item.val}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ========== Styles ==========
const styles = StyleSheet.create({
  // --- navy hero with search on the boundary ---
  hero: {
    backgroundColor: theme.colors.secondary,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    // Only the bottom-right corner is rounded — deliberately asymmetric.
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 40,
    marginBottom: 28, // leaves room for the overlapping search bar
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGreeting: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  heroAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroSearchWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: -24,
  },
  heroSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#1B2838',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  heroSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  // --- 2×3 action tile grid ---
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  tile: {
    width: '32%',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileLabel: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tileSub: {
    color: theme.colors.outline,
    fontSize: 10,
    marginTop: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.outline,
    marginTop: 3,
  },
  seeAllBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.lg,
    paddingVertical: 14,
    marginTop: 12,
  },
  cityChip: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  cityIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: theme.colors.gold,
    borderRadius: theme.roundness.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.roundness.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  launchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    marginRight: 16,
    width: width * 0.65,
  },
  trendCard: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness.lg,
    padding: 16,
    marginRight: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  postNowBtn: {
    backgroundColor: '#fff',
    borderRadius: theme.roundness.lg,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: theme.roundness.xl,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
});
