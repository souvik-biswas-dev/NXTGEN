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
  Pressable,
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
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { PropertyType } from '@/types';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

// --- Skeleton Placeholder Components ---
const SkeletonBlock = ({ w, h, rounded = 8, style }: { w: number | string; h: number; rounded?: number; style?: any }) => (
  <View
    style={[
      {
        width: w as any,
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
  <View style={[styles.skeletonCard, { width: '48%' as any }]}>
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
          // Get preferred cities within the callback to avoid dependency issues
          const cities = getPreferredCities();
          promises.push(fetchProperties(cities));
          if (user?.id) {
            promises.push(fetchFavorites());
            promises.push(fetchRecentlyViewed());
          }
          await Promise.all(promises);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }, [user?.id, platformDataLoaded])
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
        fetchProperties(cities),
        fetchPlatformData(),
        user?.id ? fetchFavorites() : Promise.resolve(),
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

  // --- Quick-action chip data ---
  const quickActions = [
    { key: 'buy', icon: 'home' as const, label: 'Buy', type: 'buy' as PropertyType },
    { key: 'rent', icon: 'key' as const, label: 'Rent', type: 'rent' as PropertyType },
    { key: 'projects', icon: 'business' as const, label: 'Projects' },
    { key: 'insights', icon: 'bulb' as const, label: 'Insights' },
    { key: 'commercial', icon: 'storefront' as const, label: 'Commercial' },
  ];

  const drawerMenuItems = [
    { icon: 'person-outline' as const, label: 'My Profile', onPress: () => { setMenuVisible(false); router.push('/(tabs)/profile'); } },
    { icon: 'heart-outline' as const, label: 'Shortlisted', onPress: () => { setMenuVisible(false); router.push('/(tabs)/favorite'); } },
    { icon: 'home-outline' as const, label: 'My Listings', onPress: () => { setMenuVisible(false); router.push('/(tabs)/post'); } },
    { icon: 'calculator-outline' as const, label: 'EMI Calculator', onPress: () => { setMenuVisible(false); router.push('/tools/emi-calculator' as any); } },
    { icon: 'wallet-outline' as const, label: 'Budget Calculator', onPress: () => { setMenuVisible(false); router.push('/tools/budget-calculator' as any); } },
    { icon: 'trending-up-outline' as const, label: 'Market Insights', onPress: () => { setMenuVisible(false); router.push('/insights' as any); } },
    { icon: 'settings-outline' as const, label: 'Settings', onPress: () => { setMenuVisible(false); } },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => { setMenuVisible(false); } },
    { icon: 'information-circle-outline' as const, label: 'About', onPress: () => { setMenuVisible(false); } },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }} edges={['top']}>
      {/* ========== MD3 Side Drawer ========== */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable className="flex-1 flex-row" onPress={() => setMenuVisible(false)}>
          <Pressable
            className="w-4/5 h-full"
            style={{ backgroundColor: theme.colors.surface }}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView className="flex-1">
              {/* Drawer Header */}
              <View style={styles.drawerHeader}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: theme.roundness.full,
                    backgroundColor: theme.colors.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="person" size={26} color={theme.colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: theme.colors.secondary, fontSize: 17, fontWeight: '700' }}>
                    {user?.name || 'Guest User'}
                  </Text>
                  <Text style={{ color: theme.colors.outline, fontSize: 13, marginTop: 2 }}>
                    {user?.email || 'Login to access all features'}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginHorizontal: 16 }} />

              {/* Drawer Items */}
              <ScrollView className="flex-1 px-3 pt-2">
                {drawerMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={item.onPress}
                    style={styles.drawerItem}
                    activeOpacity={0.6}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: theme.roundness.full,
                        backgroundColor: theme.colors.surfaceVariant,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={item.icon} size={20} color={theme.colors.secondary} />
                    </View>
                    <Text style={{ color: theme.colors.secondary, fontSize: 15, fontWeight: '500', marginLeft: 14 }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {user && (
                  <TouchableOpacity
                    onPress={async () => {
                      setMenuVisible(false);
                      await signOut();
                      router.replace('/(auth)');
                    }}
                    style={[styles.drawerItem, { marginTop: 12 }]}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: theme.roundness.full,
                        backgroundColor: '#FEE2E2',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                    </View>
                    <Text style={{ color: theme.colors.error, fontSize: 15, fontWeight: '500', marginLeft: 14 }}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </SafeAreaView>
          </Pressable>
          <View className="flex-1 bg-black/40" />
        </Pressable>
      </Modal>

      {/* ========== Main Scroll ========== */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
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
        {/* ========== MD3 Top App Bar ========== */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.iconBtn}
          >
            <Ionicons name="menu" size={24} color={theme.colors.secondary} />
          </TouchableOpacity>

          <Text style={styles.appTitle}>NxtGen Properties</Text>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/post')}
            style={styles.postBtn}
          >
            <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: '700' }}>Post FREE</Text>
          </TouchableOpacity>
        </View>

        {/* ========== MD3 Search Bar ========== */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.outline} />
            <TextInput
              placeholder='Search "Sector 150"'
              placeholderTextColor={theme.colors.outline}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========== Get Started - MD3 Filter Chips ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get started with</Text>
          <Text style={styles.sectionSubtitle}>Explore real estate options in top cities</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {quickActions.map((action) => {
              const isActive = action.type && activeType === action.type;
              return (
                <TouchableOpacity
                  key={action.key}
                  onPress={() => {
                    if (action.type) {
                      setActiveType(action.type);
                      navigateToSearch();
                    } else if (action.key === 'projects') {
                      router.push('/projects' as any);
                    } else if (action.key === 'insights') {
                      router.push('/insights' as any);
                    } else {
                      router.push('/(tabs)/search');
                    }
                  }}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={action.icon}
                    size={18}
                    color={isActive ? theme.colors.primary : theme.colors.outline}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ========== Popular Tools - MD3 Cards ========== */}
        <View style={[styles.section, { backgroundColor: theme.colors.primaryContainer + '30' }]}>
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View style={styles.sectionIconBadge}>
                <Ionicons name="bulb" size={18} color={theme.colors.onPrimary} />
              </View>
              <View>
                <Text style={{ color: theme.colors.secondary, fontSize: 16, fontWeight: '700' }}>Popular tools</Text>
                <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 1 }}>Go from browsing to buying</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>View All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row">
            {/* Budget Calculator Card */}
            <TouchableOpacity
              onPress={() => navigateToCalculator('budget')}
              style={[styles.toolCard, { marginRight: 12 }]}
              activeOpacity={0.7}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="calculator" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.toolTitle}>Budget Calculator</Text>
              <Text style={styles.toolDesc}>Check your affordability range for buying home</Text>
              <View className="flex-row items-center mt-2">
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Explore</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>

            {/* EMI Calculator Card */}
            <TouchableOpacity
              onPress={() => navigateToCalculator('emi')}
              style={styles.toolCard}
              activeOpacity={0.7}
            >
              <View style={styles.toolIcon}>
                <Ionicons name="wallet" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.toolTitle}>EMI Calculator</Text>
              <Text style={styles.toolDesc}>Calculate your home loan EMI</Text>
              <View className="flex-row items-center mt-2">
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>Explore</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========== Buying a Home ========== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buying a home</Text>
          <Text style={styles.sectionSubtitle}>Apartments, land, builder floors, villas and more</Text>

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
            <Text style={{ color: theme.colors.onPrimary, textAlign: 'center', fontWeight: '600', fontSize: 15 }}>
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
                <Text style={{ color: theme.colors.secondary, fontSize: 13, fontWeight: '600', marginTop: 6 }}>
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
              {preferredCities.length > 0 ? `Properties in ${preferredCities.join(', ')}` : 'Featured Properties'}
            </Text>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>View All</Text>
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
            <View style={{ backgroundColor: theme.colors.error, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.roundness.sm, marginRight: 8 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>NEW</Text>
            </View>
            <Text style={styles.sectionTitle}>Project Launches</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {newLaunches.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.launchCard}
              >
                <Image
                  source={{ uri: project.image }}
                  className="w-full h-32"
                  style={{ borderTopLeftRadius: theme.roundness.lg, borderTopRightRadius: theme.roundness.lg, backgroundColor: theme.colors.surfaceVariant }}
                  resizeMode="cover"
                  fadeDuration={0}
                />
                <View style={{ padding: 12 }}>
                  <Text style={{ color: theme.colors.secondary, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 3 }}>
                    by {project.developer}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="location-outline" size={12} color={theme.colors.outline} />
                    <Text style={{ color: theme.colors.outline, fontSize: 12, marginLeft: 3 }} numberOfLines={1}>
                      {project.location}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>
                      {project.priceRange}
                    </Text>
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.roundness.sm }}>
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
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>View Details</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {marketTrends.map((trend, index) => (
              <View key={index} style={styles.trendCard}>
                <Text style={{ color: theme.colors.outline, fontSize: 13 }}>{trend.city}</Text>
                <Text style={{ color: theme.colors.success, fontSize: 22, fontWeight: '700', marginTop: 4 }}>
                  {trend.trend}
                </Text>
                <Text style={{ color: theme.colors.outlineVariant, fontSize: 11, marginTop: 4 }}>{trend.period}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ========== Recently Viewed ========== */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View className="flex-row justify-between items-center mb-3">
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <TouchableOpacity onPress={() => navigateToSearch()}>
                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>View All</Text>
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
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
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
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/post')}
                  style={styles.postNowBtn}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 14 }}>Post Now</Text>
                  <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
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
        </View>

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ========== Featured Property Card (inline) ==========
interface FeaturedPropertyCardProps {
  property: any;
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
      <View style={{ position: 'relative', overflow: 'hidden', borderTopLeftRadius: theme.roundness.lg, borderTopRightRadius: theme.roundness.lg }}>
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
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>FEATURED</Text>
          </View>
        )}
        {property.broker?.verified_broker && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginLeft: 3 }}>Verified</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{formatPrice(property.price)}</Text>
        </LinearGradient>
      </View>

      <View style={{ padding: 12 }}>
        <Text style={{ color: theme.colors.secondary, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
          {property.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={13} color={theme.colors.outline} />
          <Text style={{ color: theme.colors.outline, fontSize: 12, marginLeft: 3 }} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>
        <View className="flex-row items-center mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
          {[
            { icon: 'bed-outline' as const, val: property.bedrooms },
            { icon: 'water-outline' as const, val: property.bathrooms },
            { icon: 'resize-outline' as const, val: `${property.area_sqft} sqft` },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center mr-4">
              <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 6, padding: 3 }}>
                <Ionicons name={item.icon} size={13} color={theme.colors.primary} />
              </View>
              <Text style={{ color: theme.colors.secondary, fontSize: 11, fontWeight: '500', marginLeft: 4 }}>
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
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  appTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.roundness.full,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: theme.colors.secondary,
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
  sectionIconBadge: {
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: theme.roundness.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.outline,
  },
  filterChipTextActive: {
    color: theme.colors.primary,
  },
  toolCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  toolDesc: {
    color: theme.colors.outline,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    marginRight: 16,
    width: width * 0.65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
