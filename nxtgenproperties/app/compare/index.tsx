import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCompareStore } from '@/stores/compareStore';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { Property } from '@/types';
import { theme } from '@/constants/theme';

function formatPrice(price: number): string {
  if (price >= 1_00_00_000) return `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
  if (price >= 1_00_000) return `₹${(price / 1_00_000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function CompareScreen() {
  const router = useRouter();
  const { propertyIds, remove, clear } = useCompareStore();
  const { getPropertyById } = usePropertiesStore();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const results: Property[] = [];
    for (const id of propertyIds) {
      const p = await getPropertyById(id);
      if (p) results.push(p);
    }
    setItems(results);
    setLoading(false);
  }, [propertyIds, getPropertyById]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: theme.roundness.full,
              backgroundColor: theme.colors.primaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="git-compare-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: theme.colors.secondary,
              marginBottom: 8,
            }}
          >
            Nothing to compare
          </Text>
          <Text
            style={{
              color: theme.colors.outline,
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 20,
            }}
          >
            Add up to 4 properties to compare them side-by-side. Look for the compare icon on any
            listing.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: theme.roundness.xl,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Browse properties</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rows: { label: string; getVal: (p: Property) => string | number }[] = [
    { label: 'Price', getVal: (p) => `${formatPrice(p.price)}${p.type === 'rent' ? '/mo' : ''}` },
    { label: '₹/sqft', getVal: (p) => `₹${Math.round(p.price / p.area_sqft)}` },
    { label: 'Area', getVal: (p) => `${p.area_sqft} sqft` },
    { label: 'BHK', getVal: (p) => p.bhk },
    { label: 'Furnishing', getVal: (p) => p.furnishing.replace('-', ' ') },
    { label: 'Bedrooms', getVal: (p) => p.bedrooms },
    { label: 'Bathrooms', getVal: (p) => p.bathrooms },
    { label: 'Parking', getVal: (p) => p.parkings },
    { label: 'Floor', getVal: (p) => `${p.floor ?? '-'} / ${p.total_floors ?? '-'}` },
    { label: 'Facing', getVal: (p) => p.facing ?? '-' },
    { label: 'Possession', getVal: (p) => p.possession.replace('-', ' ') },
    { label: 'Age', getVal: (p) => (p.age_years ? `${p.age_years} yr` : 'New') },
    { label: 'Locality', getVal: (p) => `${p.locality}, ${p.city}` },
    { label: 'Amenities', getVal: (p) => `${p.amenities.length}` },
  ];

  const COL_W = 180;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Header
        count={items.length}
        onClear={() =>
          Alert.alert('Clear compare list?', undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: () => clear() },
          ])
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* header row with property cards */}
          <View style={{ flexDirection: 'row', padding: 12 }}>
            <View style={{ width: 110 }} />
            {items.map((p) => (
              <View
                key={p.id}
                style={{
                  width: COL_W,
                  marginRight: 10,
                  backgroundColor: '#fff',
                  borderRadius: theme.roundness.lg,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                }}
              >
                <Image
                  source={{ uri: p.photos[0] || 'https://via.placeholder.com/200x140' }}
                  style={{
                    width: '100%',
                    height: 110,
                    backgroundColor: theme.colors.surfaceVariant,
                  }}
                />
                <TouchableOpacity
                  onPress={() => remove(p.id)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: theme.roundness.full,
                    padding: 4,
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
                <View style={{ padding: 10 }}>
                  <Text
                    style={{ fontWeight: '700', color: theme.colors.secondary, fontSize: 13 }}
                    numberOfLines={2}
                  >
                    {p.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/(tabs)/search/${p.id}`)}
                    style={{
                      marginTop: 8,
                      backgroundColor: theme.colors.primary,
                      paddingVertical: 6,
                      borderRadius: theme.roundness.full,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                      View details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* data rows */}
          <View style={{ paddingHorizontal: 12 }}>
            {rows.map((row, idx) => (
              <View
                key={row.label}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 12,
                  backgroundColor: idx % 2 === 0 ? theme.colors.surfaceVariant + '40' : '#fff',
                  borderRadius: theme.roundness.md,
                  marginBottom: 2,
                }}
              >
                <View style={{ width: 110, paddingLeft: 10, justifyContent: 'center' }}>
                  <Text style={{ color: theme.colors.outline, fontSize: 12, fontWeight: '600' }}>
                    {row.label}
                  </Text>
                </View>
                {items.map((p) => (
                  <View
                    key={p.id}
                    style={{ width: COL_W, marginRight: 10, justifyContent: 'center' }}
                  >
                    <Text
                      style={{
                        color: theme.colors.secondary,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                      numberOfLines={2}
                    >
                      {String(row.getVal(p))}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ count, onClear }: { count?: number; onClear?: () => void }) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      }}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.secondary,
          flex: 1,
          marginLeft: 10,
        }}
      >
        Compare {count ? `(${count})` : ''}
      </Text>
      {onClear && count ? (
        <TouchableOpacity onPress={onClear}>
          <Text style={{ color: theme.colors.error, fontWeight: '700' }}>Clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
