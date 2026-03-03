import React from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, StyleSheet, GestureResponderEvent } from 'react-native';
import { Property } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface PropertyCardProps {
  property: Property;
  variant?: 'default' | 'featured';
}

export const PropertyCard: React.FC<PropertyCardProps> = React.memo(({ property, variant = 'default' }) => {
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
    if (price >= 10000000) {
      return `\u20B9${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `\u20B9${(price / 100000).toFixed(2)} L`;
    }
    return `\u20B9${price.toLocaleString()}`;
  };

  const isFeatured = variant === 'featured';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/search/${property.id}`)}
      activeOpacity={0.8}
      style={[styles.card, isFeatured ? styles.cardFeatured : styles.cardDefault]}
    >
      {/* Image Section */}
      <View className="relative overflow-hidden" style={{ borderTopLeftRadius: theme.roundness.lg, borderTopRightRadius: theme.roundness.lg }}>
        <Image
          source={{ uri: property.photos[0] || 'https://via.placeholder.com/400x300' }}
          className={`w-full ${isFeatured ? 'h-56' : 'h-40'}`}
          resizeMode="cover"
          fadeDuration={0}
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        />

        {/* Frosted price overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.priceGradient}
        >
          <View className="flex-row items-end justify-between px-3 pb-3">
            <Text className="text-white text-xl font-bold" style={styles.priceText}>
              {formatPrice(property.price)}
            </Text>
            {property.type && (
              <View
                style={{
                  backgroundColor: theme.colors.primaryContainer,
                  borderRadius: theme.roundness.sm,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: theme.colors.onPrimaryContainer, fontSize: 11, fontWeight: '600' }}>
                  {property.type === 'buy' ? 'Sale' : 'Rent'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Favorite Button - MD3 Icon Button */}
        <Pressable
          onPress={handleFavorite}
          style={styles.favoriteBtn}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? theme.colors.primary : theme.colors.outline}
          />
        </Pressable>

        {/* Featured badge */}
        {property.featured && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: theme.colors.gold,
              borderRadius: theme.roundness.sm,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="star" size={10} color="#fff" />
            <Text className="text-white text-xs font-bold ml-1">FEATURED</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="p-3">
        <Text
          className="text-base font-semibold mb-1"
          style={{ color: theme.colors.secondary }}
          numberOfLines={isFeatured ? 2 : 1}
        >
          {property.title}
        </Text>
        <View className="flex-row items-center mb-1">
          <Ionicons name="location-outline" size={14} color={theme.colors.outline} />
          <Text className="text-sm ml-1" style={{ color: theme.colors.outline }} numberOfLines={1}>
            {property.locality}, {property.city}
          </Text>
        </View>

        {isFeatured && (
          <View className="flex-row items-center mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
            {[
              { icon: 'bed-outline' as const, value: property.bedrooms },
              { icon: 'water-outline' as const, value: property.bathrooms },
              { icon: 'restaurant-outline' as const, value: property.kitchens },
              { icon: 'car-outline' as const, value: property.parkings },
            ].map((item, index) => (
              <View key={index} className="flex-row items-center mr-4">
                <View
                  style={{
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: theme.roundness.sm,
                    padding: 4,
                  }}
                >
                  <Ionicons name={item.icon} size={14} color={theme.colors.primary} />
                </View>
                <Text className="text-xs ml-1.5 font-medium" style={{ color: theme.colors.secondary }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDefault: {
    width: '48%' as any,
  },
  cardFeatured: {
    width: '100%',
  },
  priceGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
  },
  priceText: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});
