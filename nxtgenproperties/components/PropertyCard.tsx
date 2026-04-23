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
import { useFavoritesStore } from '@/stores/favoritesStore';
import { theme } from '@/constants/theme';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured';
}

// Visual identity:
//   • asymmetric radii — large top-left + bottom-right, small top-right + bottom-left
//   • floating price "tag" that breaks the image/body edge
//   • locality rendered as a chip instead of plain text
//   • verified broker shown as a vertical ribbon on the image
// Deliberately different from the flat, symmetric cards on 99acres/Housing.

export const PropertyCard: React.FC<PropertyCardProps> = React.memo(
  ({ property, variant = 'default' }) => {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavoritesStore();
    const isLiked = isFavorite(property.id);

    const handleFavorite = async (e: GestureResponderEvent) => {
      e.stopPropagation();
      try {
        await toggleFavorite(property.id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    };

    const formatPrice = (price: number) => {
      if (price >= 1_00_00_000) return `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
      if (price >= 1_00_000) return `₹${(price / 1_00_000).toFixed(1)} L`;
      return `₹${price.toLocaleString('en-IN')}`;
    };

    const isFeatured = variant === 'featured';
    const isRent = property.type === 'rent';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/search/${property.id}`)}
        activeOpacity={0.85}
        style={[styles.card, isFeatured ? styles.cardFeatured : styles.cardDefault]}
      >
        {/* Image with asymmetric corner */}
        <View style={[styles.imageWrap, isFeatured ? { height: 200 } : { height: 150 }]}>
          <Image
            source={{ uri: property.photos[0] || 'https://via.placeholder.com/400x300' }}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={0}
          />

          {/* Top-left "verified broker" strap */}
          {property.broker?.verified_broker && (
            <View style={styles.verifiedStrap}>
              <Ionicons name="shield-checkmark" size={11} color="#fff" />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          )}

          {/* Top-right favorite button */}
          <Pressable onPress={handleFavorite} style={styles.favoriteBtn} hitSlop={8}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? theme.colors.primary : '#1B2838'}
            />
          </Pressable>

          {/* Featured gold ribbon (corner) */}
          {property.featured && (
            <View style={styles.featuredRibbon}>
              <Ionicons name="star" size={10} color="#1B2838" />
              <Text style={styles.featuredRibbonText}>FEATURED</Text>
            </View>
          )}
        </View>

        {/* Floating price tag — sits over the image/body boundary.
            Using a negative top-margin on the body would clip the tag under
            `overflow: hidden`, so we render it as an absolute overlay with a
            per-variant top offset matched to the image height. */}
        <View
          style={[styles.priceTag, { top: (isFeatured ? 200 : 150) - 18 }]}
          pointerEvents="none"
        >
          <Text style={styles.priceText}>{formatPrice(property.price)}</Text>
          {isRent && <Text style={styles.priceUnit}>/mo</Text>}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={isFeatured ? 2 : 1}>
            {property.title}
          </Text>

          <View style={styles.localityChip}>
            <Ionicons name="location" size={11} color={theme.colors.primary} />
            <Text style={styles.localityText} numberOfLines={1}>
              {property.locality}, {property.city}
            </Text>
          </View>

          {/* Info pills — compact two-column grid on default, row on featured */}
          <View style={[styles.pillsRow, !isFeatured && { flexWrap: 'wrap' }]}>
            <InfoPill icon="bed-outline" label={`${property.bedrooms}`} suffix="BHK" />
            <InfoPill icon="resize-outline" label={`${property.area_sqft}`} suffix="sqft" />
            {isFeatured && (
              <InfoPill icon="water-outline" label={`${property.bathrooms}`} suffix="Bath" />
            )}
            {isFeatured && (
              <InfoPill icon="car-outline" label={`${property.parkings}`} suffix="Park" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

function InfoPill({
  icon,
  label,
  suffix,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  suffix: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={11} color={theme.colors.primary} />
      <Text style={styles.pillValue}>{label}</Text>
      <Text style={styles.pillSuffix}>{suffix}</Text>
    </View>
  );
}

const CORNER_LG = 22;
const CORNER_SM = 6;

const styles = StyleSheet.create({
  card: {
    // Asymmetric radii: signature shape.
    borderTopLeftRadius: CORNER_LG,
    borderTopRightRadius: CORNER_SM,
    borderBottomLeftRadius: CORNER_SM,
    borderBottomRightRadius: CORNER_LG,
    backgroundColor: theme.colors.surface,
    overflow: 'visible',
    marginBottom: 16,
    shadowColor: '#1B2838',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cardDefault: {
    width: '48%' as any,
  },
  cardFeatured: {
    width: '100%',
  },
  imageWrap: {
    borderTopLeftRadius: CORNER_LG,
    borderTopRightRadius: CORNER_SM,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  verifiedStrap: {
    position: 'absolute',
    top: 10,
    left: 0,
    backgroundColor: theme.colors.secondary,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 3,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 251, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  featuredRibbon: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredRibbonText: {
    color: '#1B2838',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 3,
    letterSpacing: 0.6,
  },
  priceTag: {
    position: 'absolute',
    right: 12,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  priceText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  priceUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  localityChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    maxWidth: '100%',
  },
  localityText: {
    color: theme.colors.secondary,
    fontSize: 10.5,
    fontWeight: '600',
    marginLeft: 3,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  pillValue: {
    color: theme.colors.secondary,
    fontSize: 10.5,
    fontWeight: '700',
    marginLeft: 2,
  },
  pillSuffix: {
    color: theme.colors.outline,
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 1,
  },
});
