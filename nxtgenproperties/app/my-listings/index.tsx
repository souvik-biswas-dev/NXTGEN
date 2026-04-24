import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useAuthStore } from '@/stores/authStore';
import { Property } from '@/types';
import { theme } from '@/constants/theme';

function formatPrice(price: number): string {
  if (price >= 1_00_00_000) return `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
  if (price >= 1_00_000) return `₹${(price / 1_00_000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getMyListings, deleteProperty } = usePropertiesStore();
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    const data = await getMyListings();
    setListings(data);
    setLoading(false);
    setRefreshing(false);
  }, [user, getMyListings]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onDelete = (property: Property) => {
    Alert.alert('Delete listing?', `Remove "${property.title}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProperty(property.id);
            setListings((prev) => prev.filter((p) => p.id !== property.id));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Header title="My Listings" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="person-outline" size={48} color={theme.colors.outlineVariant} />
          <Text style={{ color: theme.colors.outline, marginTop: 12 }}>
            Sign in to manage your listings
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const active = listings.filter((p) => p.verified);
  const pending = listings.filter((p) => !p.verified);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Header title="My Listings" rightLabel={`${listings.length}`} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : listings.length === 0 ? (
        <EmptyState onPost={() => router.push('/(tabs)/post')} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', marginBottom: 12, gap: 10 }}>
              <StatPill label="Active" value={active.length} color={theme.colors.success} />
              <StatPill label="Pending review" value={pending.length} color={theme.colors.gold} />
            </View>
          }
          renderItem={({ item }) => (
            <ListingRow
              property={item}
              onView={() => router.push(`/(tabs)/search/${item.id}`)}
              onEdit={() => router.push(`/my-listings/edit/${item.id}` as never)}
              onDelete={() => onDelete(item)}
              onAnalytics={() => router.push(`/my-listings/analytics/${item.id}` as never)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Header({ title, rightLabel }: { title: string; rightLabel?: string }) {
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
      <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.secondary, flex: 1 }}>
        {title}
      </Text>
      {rightLabel && (
        <View
          style={{
            backgroundColor: theme.colors.primaryContainer,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.roundness.full,
          }}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>
            {rightLabel}
          </Text>
        </View>
      )}
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color + '18',
        padding: 12,
        borderRadius: theme.roundness.lg,
      }}
    >
      <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ListingRow({
  property,
  onView,
  onEdit,
  onDelete,
  onAnalytics,
}: {
  property: Property;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAnalytics: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.roundness.lg,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <TouchableOpacity onPress={onView} activeOpacity={0.85} style={{ flexDirection: 'row' }}>
        <Image
          source={{
            uri: property.photos[0] || 'https://via.placeholder.com/120x90',
          }}
          style={{
            width: 110,
            height: 110,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        />
        <View style={{ flex: 1, padding: 10 }}>
          <Text
            style={{ fontWeight: '700', color: theme.colors.secondary, fontSize: 14 }}
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <Text
            style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}
            numberOfLines={1}
          >
            {property.locality}, {property.city}
          </Text>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 15,
              fontWeight: '800',
              marginTop: 6,
            }}
          >
            {formatPrice(property.price)}
            {property.type === 'rent' ? '/mo' : ''}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
            <Badge
              label={property.verified ? 'Active' : 'Pending review'}
              color={property.verified ? theme.colors.success : theme.colors.gold}
            />
            {property.featured && <Badge label="Featured" color={theme.colors.primary} />}
          </View>
        </View>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
        }}
      >
        <ActionBtn icon="eye-outline" label="View" onPress={onView} />
        <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant }} />
        <ActionBtn
          icon="bar-chart-outline"
          label="Analytics"
          onPress={onAnalytics}
          color={theme.colors.primary}
        />
        <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant }} />
        <ActionBtn icon="pencil-outline" label="Edit" onPress={onEdit} />
        <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant }} />
        <ActionBtn
          icon="trash-outline"
          label="Delete"
          color={theme.colors.error}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + '22',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: theme.roundness.sm,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={16} color={color ?? theme.colors.secondary} />
      <Text style={{ color: color ?? theme.colors.secondary, fontSize: 13, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyState({ onPost }: { onPost: () => void }) {
  return (
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
        <Ionicons name="home-outline" size={40} color={theme.colors.primary} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: theme.colors.secondary,
          marginBottom: 8,
        }}
      >
        No listings yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.outline,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 20,
        }}
      >
        Post your first property and reach thousands of buyers.
      </Text>
      <TouchableOpacity
        onPress={onPost}
        style={{
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: theme.roundness.xl,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Post a property</Text>
      </TouchableOpacity>
    </View>
  );
}
