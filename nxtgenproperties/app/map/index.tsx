import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import { theme } from '@/constants/theme';

type Centroid = { city: string; latitude: number; longitude: number };

// India-centric default if we have nothing to show.
const DEFAULT_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 18,
  longitudeDelta: 18,
};

function formatPrice(price: number): string {
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(1)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(1)} L`;
  if (price >= 1_000) return `₹${(price / 1_000).toFixed(0)}K`;
  return `₹${price}`;
}

export default function MapViewScreen() {
  const router = useRouter();
  const { properties, loading } = usePropertiesStore();
  const [centroids, setCentroids] = useState<Record<string, Centroid>>({});
  const [selected, setSelected] = useState<Property | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('city_centroids').select('city, latitude, longitude');
      if (cancelled || !data) return;
      const map: Record<string, Centroid> = {};
      data.forEach((c: Centroid) => {
        map[c.city.toLowerCase()] = c;
      });
      setCentroids(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // For each property: prefer its own lat/lng, fall back to the city's centroid.
  // Jitter the fallback so multiple pins in the same city aren't stacked exactly.
  const pins = useMemo(() => {
    const out: Array<{ property: Property; lat: number; lng: number; isCentroid: boolean }> = [];
    properties.forEach((p, idx) => {
      if (typeof (p as any).latitude === 'number' && typeof (p as any).longitude === 'number') {
        out.push({
          property: p,
          lat: (p as any).latitude,
          lng: (p as any).longitude,
          isCentroid: false,
        });
        return;
      }
      const c = centroids[p.city.toLowerCase()];
      if (!c) return;
      const jitter = 0.01; // ~1 km
      const angle = idx * 137.5 * (Math.PI / 180); // golden-angle spiral
      out.push({
        property: p,
        lat: c.latitude + Math.sin(angle) * jitter,
        lng: c.longitude + Math.cos(angle) * jitter,
        isCentroid: true,
      });
    });
    return out;
  }, [properties, centroids]);

  // Fit the camera to the pins once we have both map and pins.
  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;
    const lats = pins.map((p) => p.lat);
    const lngs = pins.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const region: Region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.2, (maxLat - minLat) * 1.6),
      longitudeDelta: Math.max(0.2, (maxLng - minLng) * 1.6),
    };
    mapRef.current.animateToRegion(region, 600);
  }, [pins.length > 0]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)');
          }}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 18, fontWeight: '700', marginLeft: 6, color: theme.colors.secondary }}
        >
          Map
        </Text>
        <View
          style={{
            marginLeft: 'auto',
            backgroundColor: theme.colors.primaryContainer,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.roundness.full,
          }}
        >
          <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>
            {pins.length} pins
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={DEFAULT_REGION}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          onPress={() => setSelected(null)}
        >
          {pins.map(({ property, lat, lng }) => (
            <Marker
              key={property.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={(e) => {
                // `onPress` on a Marker bubbles up to `onPress` on MapView with
                // action="marker-press". Stop it so the map's clear doesn't fire.
                e.stopPropagation?.();
                setSelected(property);
              }}
              tracksViewChanges={false}
            >
              <PricePill price={property.price} selected={selected?.id === property.id} />
            </Marker>
          ))}
        </MapView>

        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 16,
              alignSelf: 'center',
              backgroundColor: theme.colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: theme.roundness.full,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
            }}
          >
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={{ marginLeft: 8, color: theme.colors.secondary, fontSize: 13 }}>
              Loading properties…
            </Text>
          </View>
        )}

        {selected && (
          <SelectedCard
            property={selected}
            onOpen={() => router.push(`/(tabs)/search/${selected.id}`)}
          />
        )}
      </View>

      {Platform.OS === 'android' && (
        <Text
          style={{
            position: 'absolute',
            bottom: 10,
            right: 12,
            fontSize: 10,
            color: theme.colors.outline,
            backgroundColor: 'rgba(255,255,255,0.85)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
          }}
        >
          Configure Google Maps API key in app.json for full tiles
        </Text>
      )}
    </SafeAreaView>
  );
}

function PricePill({ price, selected }: { price: number; selected: boolean }) {
  return (
    <View
      style={{
        backgroundColor: selected ? theme.colors.secondary : theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.roundness.full,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{formatPrice(price)}</Text>
    </View>
  );
}

function SelectedCard({ property, onOpen }: { property: Property; onOpen: () => void }) {
  const width = Dimensions.get('window').width - 32;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        width,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.lg,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Text style={{ fontWeight: '700', color: theme.colors.secondary }} numberOfLines={1}>
        {property.title}
      </Text>
      <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
        {property.locality}, {property.city}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 15 }}>
          {formatPrice(property.price)}
          {property.type === 'rent' ? '/mo' : ''}
        </Text>
        <TouchableOpacity
          onPress={onOpen}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: theme.roundness.full,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>View details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
