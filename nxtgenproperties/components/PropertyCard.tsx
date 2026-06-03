import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { Property } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useCompareStore } from '@/stores/compareStore';
import { useTheme } from '@/hooks/useTheme';
import { MotiView } from 'moti';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured';
}

// Clean, image-forward card: photo with a gradient foot that carries the price
// chip, a verified/featured badge rail on top, then a tight info block. Reads
// well in both light and dark themes (all colors come from the active palette).

const PropertyCardInner: React.FC<PropertyCardProps> = ({ property, variant = 'default' }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { has: hasCompare, toggle: toggleCompare } = useCompareStore();
  const isLiked = isFavorite(property.id);
  const inCompare = hasCompare(property.id);

  const handleFavorite = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(property.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCompare = (e: GestureResponderEvent) => {
    e.stopPropagation();
    toggleCompare(property.id);
  };

  const formatPrice = (price: number) => {
    if (price >= 1_00_00_000) return `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
    if (price >= 1_00_000) return `₹${(price / 1_00_000).toFixed(1)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const isFeatured = variant === 'featured';
  const isRent = property.type === 'rent';
  const area = property.area_sqft ? `${property.area_sqft}` : '—';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      style={isFeatured ? styles.wrapFeatured : styles.wrapDefault}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/search/${property.id}`)}
        activeOpacity={0.88}
        style={styles.card}
      >
        {/* Image */}
        <View style={[styles.imageWrap, { height: isFeatured ? 190 : 150 }]}>
          <Image
            source={{ uri: property.photos?.[0] || 'https://via.placeholder.com/400x300' }}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={0}
          />

          {/* badge rail */}
          <View style={styles.badgeRail}>
            {property.featured && (
              <View style={[styles.badge, { backgroundColor: colors.gold }]}>
                <Ionicons name="star" size={9} color="#1B2838" />
                <Text style={styles.badgeTextDark} numberOfLines={1}>
                  FEATURED
                </Text>
              </View>
            )}
            {property.broker?.verified_broker && (
              <View style={[styles.badge, { backgroundColor: colors.success }]}>
                <Ionicons name="shield-checkmark" size={9} color="#fff" />
                <Text style={styles.badgeText} numberOfLines={1}>
                  VERIFIED
                </Text>
              </View>
            )}
          </View>

          {/* favorite + compare */}
          <View style={styles.actionRail}>
            <Pressable onPress={handleFavorite} style={styles.roundBtn} hitSlop={8}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={17}
                color={isLiked ? colors.primary : '#1B2838'}
              />
            </Pressable>
            <Pressable
              onPress={handleCompare}
              style={[styles.roundBtn, inCompare && { backgroundColor: colors.primary }]}
              hitSlop={8}
            >
              <Ionicons name="git-compare" size={14} color={inCompare ? '#fff' : '#1B2838'} />
            </Pressable>
          </View>

          {/* price foot */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.priceFoot}>
            <Text style={styles.priceText}>{formatPrice(property.price)}</Text>
            {isRent && <Text style={styles.priceUnit}>/mo</Text>}
          </LinearGradient>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>

          <View style={styles.localityRow}>
            <Ionicons name="location" size={11} color={colors.primary} />
            <Text style={styles.localityText} numberOfLines={1}>
              {property.locality}, {property.city}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <InfoPill
              icon="bed-outline"
              label={`${property.bedrooms}`}
              suffix="BHK"
              styles={styles}
              color={colors.primary}
            />
            <View style={styles.dot} />
            <InfoPill
              icon="resize-outline"
              label={area}
              suffix="sqft"
              styles={styles}
              color={colors.primary}
            />
            {isFeatured && (
              <>
                <View style={styles.dot} />
                <InfoPill
                  icon="water-outline"
                  label={`${property.bathrooms}`}
                  suffix="Bath"
                  styles={styles}
                  color={colors.primary}
                />
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

export const PropertyCard = React.memo(PropertyCardInner);

function InfoPill({
  icon,
  label,
  suffix,
  styles,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  suffix: string;
  styles: ReturnType<typeof makeStyles>;
  color: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={styles.pillValue}>{label}</Text>
      <Text style={styles.pillSuffix}>{suffix}</Text>
    </View>
  );
}

type PaletteColors = ReturnType<typeof useTheme>['colors'];

const makeStyles = (colors: PaletteColors) =>
  StyleSheet.create({
    wrapDefault: { width: '48%' },
    wrapFeatured: { width: '100%' },
    card: {
      borderRadius: 18,
      backgroundColor: colors.cardBackground,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    imageWrap: {
      backgroundColor: colors.surfaceVariant,
      position: 'relative',
    },
    image: { width: '100%', height: '100%' },
    badgeRail: {
      position: 'absolute',
      top: 10,
      left: 10,
      flexDirection: 'row',
      gap: 6,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 7,
    },
    badgeText: {
      color: '#fff',
      fontSize: 8.5,
      fontWeight: '800',
      marginLeft: 3,
      letterSpacing: 0.4,
    },
    badgeTextDark: {
      color: '#1B2838',
      fontSize: 8.5,
      fontWeight: '800',
      marginLeft: 3,
      letterSpacing: 0.4,
    },
    actionRail: {
      position: 'absolute',
      top: 10,
      right: 10,
      gap: 8,
    },
    roundBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.95)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    priceFoot: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 56,
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    priceText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
    priceUnit: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600', marginLeft: 3 },
    body: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
    title: { fontSize: 14, fontWeight: '800', color: colors.onSurface, marginBottom: 5 },
    localityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
    localityText: {
      color: colors.outline,
      fontSize: 11.5,
      fontWeight: '600',
      marginLeft: 3,
      flex: 1,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.outlineVariant,
      marginHorizontal: 8,
    },
    pill: { flexDirection: 'row', alignItems: 'center' },
    pillValue: { color: colors.onSurface, fontSize: 12, fontWeight: '800', marginLeft: 3 },
    pillSuffix: { color: colors.outline, fontSize: 10, fontWeight: '600', marginLeft: 2 },
  });
