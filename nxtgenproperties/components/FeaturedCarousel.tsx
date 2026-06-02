import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Property } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useFavoritesStore } from '@/stores/favoritesStore';

const { width } = Dimensions.get('window');
const CARD_W = Math.round(width * 0.74);
const SPACING = 14;
const SNAP = CARD_W + SPACING;
const SIDE = (width - CARD_W) / 2;

type Colors = ReturnType<typeof useTheme>['colors'];

// A coverflow-style featured carousel: the centered card sits flat and full
// size, while neighbours scale down, drop, fade, and rotate in 3D as you swipe.
// Built on RN's core Animated (native-driver) so it stays buttery without any
// extra native deps.
export function FeaturedCarousel({ data }: { data: Property[] }) {
  const { colors } = useTheme();
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  if (data.length === 0) return null;

  return (
    <View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: SIDE, paddingVertical: 18 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {data.map((property, i) => {
          const inputRange = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.86, 1, 0.86],
            extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [22, 0, 22],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.55, 1, 0.55],
            extrapolate: 'clamp',
          });
          const rotateY = scrollX.interpolate({
            inputRange,
            outputRange: ['14deg', '0deg', '-14deg'],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={property.id}
              style={{
                width: CARD_W,
                marginRight: SPACING,
                opacity,
                transform: [{ perspective: 1000 }, { scale }, { translateY }, { rotateY }],
              }}
            >
              <CoverCard
                property={property}
                colors={colors}
                onPress={() => router.push(`/(tabs)/search/${property.id}`)}
              />
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Animated pagination */}
      {data.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 2,
            gap: 6,
          }}
        >
          {data.map((_, i) => {
            const inputRange = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];
            // scaleX (transform) instead of width so it stays on the native driver.
            const scaleX = scrollX.interpolate({
              inputRange,
              outputRange: [1, 3, 1],
              extrapolate: 'clamp',
            });
            const dotO = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={{
                  width: 7,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                  opacity: dotO,
                  transform: [{ scaleX }],
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

function CoverCard({
  property,
  colors,
  onPress,
}: {
  property: Property;
  colors: Colors;
  onPress: () => void;
}) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const liked = isFavorite(property.id);

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const onHeart = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(property.id);
    } catch {
      /* ignore */
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={{
        borderRadius: 24,
        backgroundColor: colors.cardBackground,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <View style={{ height: 230 }}>
        <Image
          source={{ uri: property.photos[0] || 'https://via.placeholder.com/600x400' }}
          style={{ width: '100%', height: '100%', backgroundColor: colors.surfaceVariant }}
          resizeMode="cover"
          fadeDuration={0}
        />
        <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 }}>
          {property.featured && (
            <View
              style={{
                backgroundColor: colors.gold,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="star" size={10} color="#1B2838" />
              <Text style={{ color: '#1B2838', fontSize: 9.5, fontWeight: '800', marginLeft: 3 }}>
                FEATURED
              </Text>
            </View>
          )}
          {property.verified && (
            <View
              style={{
                backgroundColor: colors.success,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 9.5, fontWeight: '800', marginLeft: 3 }}>
                VERIFIED
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={onHeart}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.95)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={19}
            color={liked ? colors.primary : '#1B2838'}
          />
        </Pressable>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 110,
            justifyContent: 'flex-end',
            padding: 14,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.2 }}>
            {formatPrice(property.price)}
            {property.type === 'rent' && (
              <Text style={{ fontSize: 13, fontWeight: '600' }}>/mo</Text>
            )}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: 14,
              fontWeight: '700',
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {property.title}
          </Text>
        </LinearGradient>
      </View>

      <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="location" size={14} color={colors.primary} />
        <Text
          style={{
            color: colors.outline,
            fontSize: 12.5,
            fontWeight: '600',
            marginLeft: 4,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {property.locality}, {property.city}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Spec colors={colors} icon="bed-outline" text={`${property.bedrooms}`} />
          <Spec colors={colors} icon="water-outline" text={`${property.bathrooms}`} />
          <Spec
            colors={colors}
            icon="resize-outline"
            text={property.area_sqft ? `${property.area_sqft}` : '—'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Spec({
  colors,
  icon,
  text,
}: {
  colors: Colors;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={icon} size={13} color={colors.primary} />
      <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: '700', marginLeft: 3 }}>
        {text}
      </Text>
    </View>
  );
}
