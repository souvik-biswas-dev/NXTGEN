import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Property } from '@/types';
import { theme } from '@/constants/theme';

type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'withdrawn';

interface OfferRow {
  id: string;
  amount: number;
  message: string | null;
  status: OfferStatus;
  counter_amount?: number | null;
  counterAmount?: number | null;
  created_at: string;
  direction: 'sent' | 'received';
  counterpartyName: string | null;
  property: Property | null;
}

const STATUS_COLOR: Record<OfferStatus, string> = {
  pending: theme.colors.gold,
  accepted: theme.colors.success,
  rejected: theme.colors.error,
  countered: theme.colors.primary,
  withdrawn: theme.colors.outline,
};

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function OffersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { items } = await api.get<{ items: OfferRow[] }>('/offers');
      setOffers(items ?? []);
    } catch {
      setOffers([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const respond = async (
    id: string,
    status: 'accepted' | 'rejected' | 'countered' | 'withdrawn',
    counterAmount?: number
  ) => {
    try {
      await api.patch(`/offers/${id}`, { status, counterAmount });
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not update offer');
    }
  };

  const promptCounter = (id: string) => {
    // Simple counter: reuse Alert.prompt on iOS; fall back to reject on others.
    if (Alert.prompt) {
      Alert.prompt('Counter offer', 'Enter your counter amount (₹)', (text) => {
        const amt = Number((text || '').replace(/[^0-9]/g, ''));
        if (amt > 0) respond(id, 'countered', amt);
      });
    } else {
      Alert.alert('Counter offer', 'Counter-offers can be sent from a device that supports text prompts.');
    }
  };

  const renderItem = ({ item }: { item: OfferRow }) => {
    const counter = item.counter_amount ?? item.counterAmount ?? null;
    const isReceived = item.direction === 'received';
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => item.property && router.push(`/(tabs)/search/${item.property.id}` as never)}
        style={{
          backgroundColor: theme.colors.cardBackground,
          borderRadius: theme.roundness.lg,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: theme.colors.secondary, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
              {item.property?.title ?? 'Property'}
            </Text>
            <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}>
              {isReceived ? 'From' : 'To'} {item.counterpartyName ?? 'user'} ·{' '}
              {format(new Date(item.created_at), 'd MMM, h:mm a')}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: STATUS_COLOR[item.status] + '22',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: STATUS_COLOR[item.status], fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, gap: 8 }}>
          <Text style={{ color: theme.colors.gold, fontWeight: '800', fontSize: 20 }}>
            {formatINR(item.amount)}
          </Text>
          {item.property && (
            <Text style={{ color: theme.colors.outline, fontSize: 12 }}>
              listed {formatINR(item.property.price)}
            </Text>
          )}
        </View>
        {counter ? (
          <Text style={{ color: theme.colors.primary, fontSize: 13, marginTop: 4 }}>
            Counter: {formatINR(counter)}
          </Text>
        ) : null}
        {item.message ? (
          <Text style={{ color: theme.colors.secondary, fontSize: 13, marginTop: 6 }}>{item.message}</Text>
        ) : null}

        {/* Actions */}
        {item.status === 'pending' && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {isReceived ? (
              <>
                <ActionBtn label="Accept" color={theme.colors.success} onPress={() => respond(item.id, 'accepted')} />
                <ActionBtn label="Counter" color={theme.colors.primary} onPress={() => promptCounter(item.id)} />
                <ActionBtn label="Reject" color={theme.colors.error} onPress={() => respond(item.id, 'rejected')} />
              </>
            ) : (
              <ActionBtn label="Withdraw" color={theme.colors.outline} onPress={() => respond(item.id, 'withdrawn')} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '800', color: theme.colors.secondary }}>
          My Offers
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Ionicons name="pricetag-outline" size={48} color={theme.colors.outlineVariant} />
              <Text style={{ color: theme.colors.outline, marginTop: 12 }}>No offers yet</Text>
              <Text style={{ color: theme.colors.outlineVariant, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 }}>
                Make an offer from any property page to negotiate the price.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ActionBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: color + '1A',
        borderRadius: 999,
        paddingVertical: 9,
        alignItems: 'center',
      }}
      activeOpacity={0.8}
    >
      <Text style={{ color, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}
