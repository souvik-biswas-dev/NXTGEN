import React, { useState, useRef, useMemo } from 'react';
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
import { MotiView } from 'moti';
import { PropertyCard } from '@/components/PropertyCard';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { AuroraBackground } from '@/components/AuroraBackground';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { useSearchStore } from '@/stores/searchStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useCountUp } from '@/hooks/useCountUp';
import { Property, PropertyType } from '@/types';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const SEG_BTN_W = 56; // width of one Buy/Rent segment button (drives the sliding pill)

type Colors = ReturnType<typeof useTheme>['colors'];

// --- Skeleton Placeholder Components ---
const SkeletonBlock = ({
  w,
  h,
  rounded = 8,
  color,
  style,
}: {
  w: number | `${number}%`;
  h: number;
  rounded?: number;
  color: string;
  style?: object;
}) => (
  <View
    style={[
      { width: w, height: h, borderRadius: rounded, backgroundColor: color, opacity: 0.5 },
      style,
    ]}
  />
);

const SkeletonPropertyCard = ({ colors }: { colors: Colors }) => (
  <View
    style={{
      width: '48%',
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 16,
    }}
  >
    <SkeletonBlock w="100%" h={120} rounded={0} color={colors.outlineVariant} />
    <View style={{ padding: 10 }}>
      <SkeletonBlock w="80%" h={14} color={colors.outlineVariant} style={{ marginBottom: 8 }} />
      <SkeletonBlock w="60%" h={12} color={colors.outlineVariant} />
    </View>
  </View>
);

const SkeletonFeaturedCard = ({ colors }: { colors: Colors }) => (
  <View
    style={{
      width: width * 0.72,
      marginRight: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      overflow: 'hidden',
    }}
  >
    <SkeletonBlock w="100%" h={150} rounded={0} color={colors.outlineVariant} />
    <View style={{ padding: 12 }}>
      <SkeletonBlock w="85%" h={14} color={colors.outlineVariant} style={{ marginBottom: 8 }} />
      <SkeletonBlock w="55%" h={12} color={colors.outlineVariant} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonBlock w={40} h={12} color={colors.outlineVariant} />
        <SkeletonBlock w={40} h={12} color={colors.outlineVariant} />
        <SkeletonBlock w={40} h={12} color={colors.outlineVariant} />
      </View>
    </View>
  </View>
);

export default function HomeScreen() {
  // Subscribe to the theme store so this screen re-renders (and rebuilds its
  // styles) the moment the user flips the theme in Settings.
  const { colors, dark, tabBarHeight, roundness } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const { unreadCount, fetch: fetchNotifications } = useNotificationsStore();

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
            promises.push(fetchNotifications());
          }
          await Promise.all(promises);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { icon: 'person-outline' as const, label: 'My Profile', route: '/(tabs)/profile' },
    { icon: 'heart-outline' as const, label: 'Shortlisted', route: '/(tabs)/favorite' },
    { icon: 'home-outline' as const, label: 'My Listings', route: '/my-listings' },
    { icon: 'git-compare-outline' as const, label: 'Compare Properties', route: '/compare' },
    { icon: 'bookmark-outline' as const, label: 'Saved Searches', route: '/saved-searches' },
    { icon: 'calendar-outline' as const, label: 'Site Visits', route: '/site-visits' },
    { icon: 'notifications-outline' as const, label: 'Notifications', route: '/notifications' },
    {
      icon: 'calculator-outline' as const,
      label: 'EMI Calculator',
      route: '/tools/emi-calculator',
    },
    {
      icon: 'wallet-outline' as const,
      label: 'Budget Calculator',
      route: '/tools/budget-calculator',
    },
    { icon: 'resize-outline' as const, label: 'Area Converter', route: '/tools/area-converter' },
    { icon: 'cash-outline' as const, label: 'Home Loan Offers', route: '/tools/home-loan' },
    { icon: 'pricetag-outline' as const, label: 'Property Valuation', route: '/tools/valuation' },
    { icon: 'trending-up-outline' as const, label: 'Market Insights', route: '/insights' },
    { icon: 'settings-outline' as const, label: 'Settings', route: '/settings' },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', route: '/help' },
    { icon: 'information-circle-outline' as const, label: 'About', route: '/about' },
  ];

  const goTo = (route: string) => {
    setMenuVisible(false);
    router.push(route as any);
  };

  // Subtle parallax: the hero gently scales/translates as you pull/scroll.
  const heroTranslate = scrollY.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [-30, 0, 30],
    extrapolateRight: 'clamp',
  });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      {/* ========== Full-Screen Side Drawer ========== */}
      <Modal
        visible={menuVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.drawerHeader}
            >
              <View style={styles.drawerAvatar}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={{ width: 56, height: 56 }} />
                ) : (
                  <Ionicons name="person" size={28} color="#fff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                  {user?.name || 'Guest User'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                  {user?.email || 'Login to access all features'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={styles.drawerClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {drawerMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => goTo(item.route)}
                  style={styles.drawerItem}
                  activeOpacity={0.6}
                >
                  <View style={styles.drawerIcon}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.drawerLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
                </TouchableOpacity>
              ))}

              {user?.role === 'admin' && (
                <TouchableOpacity
                  onPress={() => goTo('/admin')}
                  style={[styles.drawerItem, { marginTop: 8 }]}
                >
                  <View style={[styles.drawerIcon, { backgroundColor: colors.error + '22' }]}>
                    <Ionicons name="shield-outline" size={20} color={colors.error} />
                  </View>
                  <Text style={[styles.drawerLabel, { color: colors.error, fontWeight: '700' }]}>
                    Admin Dashboard
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.outlineVariant} />
                </TouchableOpacity>
              )}

              {user && (
                <TouchableOpacity
                  onPress={async () => {
                    setMenuVisible(false);
                    await signOut();
                    router.replace('/(auth)');
                  }}
                  style={[styles.drawerItem, { marginTop: 12, marginBottom: 24 }]}
                >
                  <View style={[styles.drawerIcon, { backgroundColor: colors.error + '22' }]}>
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  </View>
                  <Text style={[styles.drawerLabel, { color: colors.error }]}>Logout</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 40 }} />
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
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ========== Gradient Hero ========== */}
        <Animated.View style={{ transform: [{ translateY: heroTranslate }] }}>
          <LinearGradient
            colors={dark ? ['#0B3B36', '#0B1220'] : [colors.secondary, '#0F3B45']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* clipped aurora layer (search bar overflows the hero, so we clip
                only this layer rather than the whole hero) */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
              ]}
              pointerEvents="none"
            >
              <AuroraBackground
                opacity={dark ? 0.32 : 0.42}
                blobs={[
                  {
                    color: '#2DD4BF',
                    size: 210,
                    from: { top: -50, left: -40 },
                    to: { top: 20, left: 50 },
                    duration: 5200,
                  },
                  {
                    color: colors.gold,
                    size: 180,
                    from: { top: 50, left: width - 150 },
                    to: { top: -30, left: width - 230 },
                    duration: 6200,
                  },
                  {
                    color: '#0EA5A0',
                    size: 150,
                    from: { top: 95, left: width * 0.42 },
                    to: { top: 25, left: width * 0.56 },
                    duration: 4800,
                  },
                ]}
              />
            </View>

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
                  {user?.name ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Welcome 👋'}
                </Text>
                <Text style={styles.heroTagline}>Find a home that fits your life</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/notifications' as any)}
                style={[styles.heroIconBtn, { marginRight: 8 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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

            {/* search bar — floats on the hero/content boundary */}
            <View style={styles.heroSearchWrap}>
              <View style={styles.heroSearchBar}>
                <Ionicons name="search" size={20} color={colors.primary} />
                <TextInput
                  placeholder="Search by city, locality, project…"
                  placeholderTextColor={colors.outline}
                  style={styles.heroSearchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.outline} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => router.push('/map' as any)} hitSlop={8}>
                    <Ionicons name="map-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ========== 2×3 Action Tile Grid (staggered) ========== */}
        <View style={styles.tileGrid}>
          {(
            [
              {
                key: 'buy',
                label: 'Buy',
                sub: 'Ready-to-move',
                icon: 'home',
                color: colors.primary,
                action: () => {
                  setActiveType('buy');
                  navigateToSearch(undefined, 'buy');
                },
              },
              {
                key: 'rent',
                label: 'Rent',
                sub: 'Flexible stay',
                icon: 'key',
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
                icon: 'storefront',
                color: '#8B5CF6',
                action: () => navigateToSearch(undefined, undefined, 'commercial'),
              },
              {
                key: 'projects',
                label: 'Projects',
                sub: 'New launches',
                icon: 'business',
                color: colors.gold,
                action: () => router.push('/projects' as any),
              },
              {
                key: 'emi',
                label: 'EMI',
                sub: 'Loan calculator',
                icon: 'wallet',
                color: '#EC4899',
                action: () => navigateToCalculator('emi'),
              },
              {
                key: 'insights',
                label: 'Insights',
                sub: 'Market trends',
                icon: 'trending-up',
                color: '#0EA5E9',
                action: () => router.push('/insights' as any),
              },
            ] as {
              key: string;
              label: string;
              sub: string;
              icon: keyof typeof Ionicons.glyphMap;
              color: string;
              action: () => void;
            }[]
          ).map((tile, i) => (
            <MotiView
              key={tile.key}
              from={{ opacity: 0, translateY: 18, scale: 0.96 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 180, delay: 120 + i * 65 }}
              style={styles.tileWrap}
            >
              <TouchableOpacity onPress={tile.action} activeOpacity={0.85} style={styles.tile}>
                <View
                  style={[
                    styles.tileIconWrap,
                    { backgroundColor: tile.color + (dark ? '2A' : '18') },
                  ]}
                >
                  <Ionicons name={tile.icon} size={20} color={tile.color} />
                </View>
                <Text style={styles.tileLabel}>{tile.label}</Text>
                <Text style={styles.tileSub} numberOfLines={1}>
                  {tile.sub}
                </Text>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {/* ========== Trust strip (animated counters) ========== */}
        <TrustStrip colors={colors} />

        {/* ========== Buying a Home (with Buy/Rent toggle) ========== */}
        <View style={styles.section}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                {activeType === 'buy' ? 'Buying a home' : 'Renting a home'}
              </Text>
              <Text style={styles.sectionSubtitle}>Apartments, villas, builder floors & more</Text>
            </View>
            <View style={styles.segment}>
              {/* sliding pill indicator */}
              <MotiView
                animate={{ translateX: activeType === 'buy' ? 0 : SEG_BTN_W }}
                transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                style={[styles.segmentPill, { backgroundColor: colors.primary }]}
              />
              {(['buy', 'rent'] as const).map((t) => {
                const on = activeType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setActiveType(t)}
                    activeOpacity={0.85}
                    style={styles.segmentBtn}
                  >
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: '800',
                        textTransform: 'capitalize',
                        color: on ? '#fff' : colors.outline,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {loading ? (
            <View className="flex-row flex-wrap justify-between mt-3">
              <SkeletonPropertyCard colors={colors} />
              <SkeletonPropertyCard colors={colors} />
              <SkeletonPropertyCard colors={colors} />
              <SkeletonPropertyCard colors={colors} />
            </View>
          ) : nearbyProperties.length > 0 ? (
            <View className="flex-row flex-wrap justify-between mt-3">
              {nearbyProperties.slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </View>
          ) : (
            <EmptyHint colors={colors} text={`No ${activeType} listings yet — check back soon.`} />
          )}

          <TouchableOpacity
            onPress={() => navigateToSearch()}
            style={styles.seeAllBtn}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 15 }}>
              See all {activeType === 'buy' ? 'Buy' : 'Rent'} properties
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* ========== Popular Cities ========== */}
        {popularCities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Cities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
              {popularCities.slice(0, 8).map((city) => (
                <TouchableOpacity
                  key={city.id}
                  onPress={() => navigateToSearch(city.name)}
                  style={styles.cityChip}
                  activeOpacity={0.7}
                >
                  <View style={styles.cityIcon}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={{
                      color: colors.onSurface,
                      fontSize: 13,
                      fontWeight: '700',
                      marginTop: 6,
                    }}
                  >
                    {city.name}
                  </Text>
                  <Text style={{ color: colors.outline, fontSize: 11, marginTop: 2 }}>
                    {city.properties}+ homes
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========== Featured / Preferred Properties — 3D coverflow ========== */}
        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <View
            className="flex-row justify-between items-center mb-1"
            style={{ paddingHorizontal: 20 }}
          >
            <View>
              <Text style={styles.sectionTitle}>
                {preferredCities.length > 0 ? `In ${preferredCities.join(', ')}` : 'Featured'}
              </Text>
              <Text style={styles.sectionSubtitle}>Swipe to explore hand-picked homes</Text>
            </View>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12, paddingLeft: 20 }}
            >
              <SkeletonFeaturedCard colors={colors} />
              <SkeletonFeaturedCard colors={colors} />
            </ScrollView>
          ) : propertiesForFeed.length > 0 ? (
            <FeaturedCarousel data={propertiesForFeed} />
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <EmptyHint colors={colors} text="No featured homes yet — check back soon." />
            </View>
          )}
        </View>

        {/* ========== New Launches ========== */}
        {newLaunches.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.primaryContainer + (dark ? '20' : '40') },
            ]}
          >
            <View className="flex-row items-center mb-1">
              <View style={styles.newPill}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>NEW</Text>
              </View>
              <Text style={styles.sectionTitle}>Project Launches</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
              {newLaunches.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.launchCard}
                  onPress={() => router.push(`/projects/${project.id}` as never)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: project.image }}
                    className="w-full h-32"
                    style={{
                      borderTopLeftRadius: roundness.lg,
                      borderTopRightRadius: roundness.lg,
                      backgroundColor: colors.surfaceVariant,
                    }}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                  <View style={{ padding: 12 }}>
                    <Text
                      style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}
                      numberOfLines={1}
                    >
                      {project.name}
                    </Text>
                    <Text style={{ color: colors.outline, fontSize: 12, marginTop: 3 }}>
                      by {project.developer}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="location-outline" size={12} color={colors.outline} />
                      <Text
                        style={{ color: colors.outline, fontSize: 12, marginLeft: 3 }}
                        numberOfLines={1}
                      >
                        {project.location}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mt-2">
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>
                        {project.priceRange}
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.success + '22',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: roundness.sm,
                        }}
                      >
                        <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>
                          {project.launchDate}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========== Market Trends ========== */}
        {marketTrends.length > 0 && (
          <View style={styles.section}>
            <View className="flex-row justify-between items-center mb-1">
              <Text style={styles.sectionTitle}>Market Trends</Text>
              <TouchableOpacity onPress={() => router.push('/insights' as any)}>
                <Text style={styles.viewAll}>View Details</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
              {marketTrends.map((trend, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.trendCard}
                  onPress={() => navigateToSearch(trend.city)}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: colors.outline, fontSize: 13, fontWeight: '600' }}>
                    {trend.city}
                  </Text>
                  <Text
                    style={{ color: colors.success, fontSize: 24, fontWeight: '800', marginTop: 4 }}
                  >
                    {trend.trend}
                  </Text>
                  <Text style={{ color: colors.outline, fontSize: 11, marginTop: 4 }}>
                    {trend.period}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                      Explore
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={11}
                      color={colors.primary}
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========== Recently Viewed ========== */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View className="flex-row justify-between items-center mb-1">
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <TouchableOpacity onPress={() => navigateToSearch()}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {recentItems.slice(0, 10).map((property) => (
                <View key={property.id} style={{ width: width * 0.72, marginRight: 16 }}>
                  <FeaturedPropertyCard property={property} colors={colors} roundness={roundness} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========== Post Property Banner ========== */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/post')}
          activeOpacity={0.9}
          style={{ paddingHorizontal: 20, marginBottom: 24, marginTop: 4 }}
        >
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: roundness.xl, padding: 20, overflow: 'hidden' }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View style={styles.freeChip}>
                  <Ionicons name="sparkles" size={12} color={colors.secondary} />
                  <Text
                    style={{
                      color: colors.secondary,
                      fontWeight: '800',
                      fontSize: 11,
                      marginLeft: 4,
                    }}
                  >
                    100% FREE
                  </Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginBottom: 4 }}>
                  Post Your Property
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 14 }}>
                  Reach 10 Lakh+ verified buyers
                </Text>
                <View style={styles.postNowBtn}>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>
                    Post Now
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>
              <View style={styles.bannerBubble}>
                <Ionicons name="home" size={36} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: tabBarHeight + 16 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function EmptyHint({ colors, text }: { colors: Colors; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
      <Ionicons name="home-outline" size={30} color={colors.outlineVariant} />
      <Text style={{ color: colors.outline, fontSize: 13, marginTop: 8 }}>{text}</Text>
    </View>
  );
}

// Animated trust counters that tick up on first paint.
function TrustStrip({ colors }: { colors: Colors }) {
  const buyers = useCountUp(1000000);
  const listings = useCountUp(52000);
  const cities = useCountUp(120);
  const fmt = (n: number) =>
    n >= 100000 ? `${(n / 100000).toFixed(0)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
  const items = [
    { icon: 'people' as const, value: `${fmt(buyers)}+`, label: 'Buyers' },
    { icon: 'home' as const, value: `${fmt(listings)}+`, label: 'Listings' },
    { icon: 'business' as const, value: `${cities}+`, label: 'Cities' },
    { icon: 'shield-checkmark' as const, value: '100%', label: 'Verified' },
  ];
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: 360 }}
      style={{
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 2,
        marginBottom: 4,
        backgroundColor: colors.cardBackground,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        paddingVertical: 14,
      }}
    >
      {items.map((it, i) => (
        <View
          key={it.label}
          style={{
            flex: 1,
            alignItems: 'center',
            borderLeftWidth: i === 0 ? 0 : 1,
            borderLeftColor: colors.outlineVariant,
          }}
        >
          <Ionicons name={it.icon} size={16} color={colors.primary} />
          <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: '900', marginTop: 4 }}>
            {it.value}
          </Text>
          <Text style={{ color: colors.outline, fontSize: 10.5, fontWeight: '600', marginTop: 1 }}>
            {it.label}
          </Text>
        </View>
      ))}
    </MotiView>
  );
}

// ========== Featured Property Card (inline) ==========
const FeaturedPropertyCard: React.FC<{
  property: Property;
  colors: Colors;
  roundness: ReturnType<typeof useTheme>['roundness'];
}> = ({ property, colors, roundness }) => {
  const router = useRouter();

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/search/${property.id}`)}
      style={{
        backgroundColor: colors.cardBackground,
        borderRadius: roundness.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}
      activeOpacity={0.85}
    >
      <View
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderTopLeftRadius: roundness.lg,
          borderTopRightRadius: roundness.lg,
        }}
      >
        <Image
          source={{ uri: property.photos[0] }}
          className="w-full h-44"
          resizeMode="cover"
          fadeDuration={0}
          style={{ backgroundColor: colors.surfaceVariant }}
        />
        {property.featured && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: colors.gold,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="star" size={10} color="#1B2838" />
            <Text style={{ color: '#1B2838', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>
              FEATURED
            </Text>
          </View>
        )}
        {property.broker?.verified_broker && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: colors.success,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="shield-checkmark" size={11} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 3 }}>
              Verified
            </Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
            justifyContent: 'flex-end',
            paddingHorizontal: 12,
            paddingBottom: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>
            {formatPrice(property.price)}
          </Text>
        </LinearGradient>
      </View>

      <View style={{ padding: 12 }}>
        <Text
          style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}
          numberOfLines={1}
        >
          {property.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={13} color={colors.outline} />
          <Text style={{ color: colors.outline, fontSize: 12, marginLeft: 3 }} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>
        <View
          className="flex-row items-center mt-2 pt-2"
          style={{ borderTopWidth: 1, borderTopColor: colors.outlineVariant }}
        >
          {[
            { icon: 'bed-outline' as const, val: `${property.bedrooms} BHK` },
            { icon: 'water-outline' as const, val: `${property.bathrooms}` },
            { icon: 'resize-outline' as const, val: `${property.area_sqft} sqft` },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center mr-4">
              <View style={{ backgroundColor: colors.surfaceVariant, borderRadius: 6, padding: 3 }}>
                <Ionicons name={item.icon} size={13} color={colors.primary} />
              </View>
              <Text
                style={{ color: colors.onSurface, fontSize: 11, fontWeight: '600', marginLeft: 4 }}
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
const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: {
      paddingTop: 16,
      paddingBottom: 72,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      marginBottom: 28,
    },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    heroIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroGreeting: { color: '#fff', fontSize: 19, fontWeight: '800' },
    heroTagline: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },
    bellBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      borderRadius: 8,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    heroSearchWrap: { position: 'absolute', left: 20, right: 20, bottom: -24 },
    heroSearchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    heroSearchInput: { flex: 1, marginHorizontal: 10, fontSize: 14, color: colors.onSurface },
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 4,
      justifyContent: 'space-between',
    },
    tileWrap: { width: '32%', marginBottom: 10 },
    tile: {
      width: '100%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    tileIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    tileLabel: { color: colors.onSurface, fontSize: 13, fontWeight: '800' },
    tileSub: { color: colors.outline, fontSize: 10, marginTop: 1 },
    section: { paddingHorizontal: 20, paddingVertical: 18, backgroundColor: colors.background },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface },
    sectionSubtitle: { fontSize: 13, color: colors.outline, marginTop: 3 },
    viewAll: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 3,
      position: 'relative',
    },
    segmentPill: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: SEG_BTN_W,
      bottom: 3,
      borderRadius: 9,
    },
    segmentBtn: {
      width: SEG_BTN_W,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seeAllBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 15,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cityChip: { alignItems: 'center', marginRight: 18, width: 84 },
    cityIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newPill: {
      backgroundColor: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginRight: 8,
    },
    launchCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      overflow: 'hidden',
      marginRight: 16,
      width: width * 0.66,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    trendCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 18,
      padding: 16,
      marginRight: 12,
      minWidth: 120,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    freeChip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.gold,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginBottom: 8,
    },
    postNowBtn: {
      backgroundColor: '#fff',
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 18,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
    },
    bannerBubble: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 22,
    },
    drawerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      overflow: 'hidden',
    },
    drawerClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderRadius: 16,
    },
    drawerIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerLabel: {
      color: colors.onSurface,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 16,
      flex: 1,
    },
  });
