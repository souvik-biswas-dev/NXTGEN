import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { SiteVisitRequest, Property, SiteVisitStatus } from '@/types';
import { theme } from '@/constants/theme';

type Row = SiteVisitRequest & { property?: Property };

const STATUS_COLOR: Record<SiteVisitStatus, string> = {
  pending: theme.colors.gold,
  confirmed: theme.colors.success,
  completed: theme.colors.outline,
  cancelled: theme.colors.error,
};

export default function SiteVisitsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [visits, setVisits] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { items } = await api.get<{ items: Row[] }>('/catalog/site-visits');
      setVisits(items ?? []);
    } catch {
      setVisits([]);
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

  const cancel = async (id: string) => {
    await api.patch(`/catalog/site-visits/${id}`, { status: 'cancelled' });
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'cancelled' as SiteVisitStatus } : v))
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
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
          Site Visits
        </Text>
      </View>

      {!user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.outlineVariant} />
          <Text style={{ color: theme.colors.outline, marginTop: 12 }}>
            Sign in to see your visit requests
          </Text>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : visits.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.outlineVariant} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors.secondary,
              marginTop: 12,
            }}
          >
            No site visits yet
          </Text>
          <Text
            style={{
              color: theme.colors.outline,
              textAlign: 'center',
              fontSize: 13,
              marginTop: 8,
              maxWidth: 280,
            }}
          >
            Request a site visit from any property page.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => v.id}
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
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => item.property && router.push(`/(tabs)/search/${item.property.id}`)}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#fff',
                padding: 14,
                borderRadius: theme.roundness.lg,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{ flex: 1, fontWeight: '700', color: theme.colors.secondary }}
                  numberOfLines={1}
                >
                  {item.property?.title || 'Property'}
                </Text>
                <View
                  style={{
                    backgroundColor: STATUS_COLOR[item.status] + '22',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: theme.roundness.sm,
                  }}
                >
                  <Text
                    style={{
                      color: STATUS_COLOR[item.status],
                      fontSize: 10,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 6,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={13} color={theme.colors.outline} />
                  <Text style={{ color: theme.colors.outline, fontSize: 12 }}>
                    {format(new Date(item.preferred_date), 'EEE, d MMM')}
                  </Text>
                </View>
                {item.slot && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={13} color={theme.colors.outline} />
                    <Text style={{ color: theme.colors.outline, fontSize: 12 }}>{item.slot}</Text>
                  </View>
                )}
              </View>
              {item.notes && (
                <Text
                  style={{ color: theme.colors.outline, fontSize: 12, marginTop: 6 }}
                  numberOfLines={2}
                >
                  {item.notes}
                </Text>
              )}
              {item.status === 'pending' && user?.user_id === item.user_id && (
                <TouchableOpacity
                  onPress={() => cancel(item.id)}
                  style={{
                    marginTop: 10,
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: theme.colors.error,
                    borderRadius: theme.roundness.full,
                  }}
                >
                  <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: '700' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
