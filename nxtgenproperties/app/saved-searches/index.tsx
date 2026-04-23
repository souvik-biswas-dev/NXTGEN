import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAlertsStore } from '@/stores/alertsStore';
import { useSearchStore } from '@/stores/searchStore';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useAuthStore } from '@/stores/authStore';
import { PropertyAlert, SearchFilters } from '@/types';
import { theme } from '@/constants/theme';

function summarise(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.type) parts.push(filters.type === 'buy' ? 'Buy' : 'Rent');
  if (filters.category) parts.push(filters.category);
  if (filters.city) parts.push(filters.city);
  if (filters.bhk?.length) parts.push(filters.bhk.join(', '));
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const fmt = (n?: number) => (n === undefined ? 'Any' : `₹${(n / 100000).toFixed(0)}L`);
    parts.push(`${fmt(filters.minPrice)}–${fmt(filters.maxPrice)}`);
  }
  if (filters.furnishing?.length) parts.push(filters.furnishing.join(', '));
  return parts.length > 0 ? parts.join(' • ') : 'All properties';
}

export default function SavedSearchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { alerts, loading, fetchAlerts, deleteAlert, toggleAlert, createAlert } = useAlertsStore();
  const searchStore = useSearchStore();
  const [showCreate, setShowCreate] = useState(false);
  const [alertName, setAlertName] = useState('');

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user, fetchAlerts]);

  const onRunSearch = useCallback(
    (alert: PropertyAlert) => {
      searchStore.resetFilters();
      searchStore.setFilters(alert.filters);
      usePropertiesStore.getState().filterProperties(alert.filters);
      router.push('/(tabs)/search');
    },
    [router, searchStore]
  );

  const onDelete = (id: string) => {
    Alert.alert('Delete saved search?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAlert(id) },
    ]);
  };

  const onCreate = async () => {
    if (!alertName.trim()) {
      Alert.alert('Name required', 'Give this search a name you will recognise.');
      return;
    }
    const currentFilters: SearchFilters = {
      city: searchStore.city,
      locality: searchStore.locality,
      minPrice: searchStore.minPrice,
      maxPrice: searchStore.maxPrice,
      type: searchStore.type,
      category: searchStore.category,
      bhk: searchStore.bhk,
      furnishing: searchStore.furnishing,
      minArea: searchStore.minArea,
      maxArea: searchStore.maxArea,
      possession: searchStore.possession,
      ownerOnly: searchStore.ownerOnly,
      facing: searchStore.facing,
      amenities: searchStore.amenities,
    };
    await createAlert(currentFilters, alertName.trim());
    setAlertName('');
    setShowCreate(false);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Header title="Saved Searches" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="bookmark-outline" size={48} color={theme.colors.outlineVariant} />
          <Text style={{ color: theme.colors.outline, marginTop: 12 }}>
            Sign in to save searches and get alerts
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Header title="Saved Searches" onAdd={() => setShowCreate(true)} />

      {loading && alerts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : alerts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="bookmark-outline" size={48} color={theme.colors.outlineVariant} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors.secondary,
              marginTop: 12,
            }}
          >
            No saved searches yet
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
            Save your search filters and we'll notify you when matching properties are listed.
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{
              marginTop: 20,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: theme.roundness.xl,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Save current search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: theme.roundness.lg,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.roundness.full,
                    backgroundColor: theme.colors.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="bookmark" size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={{ fontWeight: '700', color: theme.colors.secondary, fontSize: 15 }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {summarise(item.filters)}
                  </Text>
                </View>
                <Switch value={item.active} onValueChange={() => toggleAlert(item.id)} />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                <TouchableOpacity
                  onPress={() => onRunSearch(item)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.secondary,
                    paddingVertical: 8,
                    borderRadius: theme.roundness.md,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="search" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Run search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: theme.roundness.md,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.error,
                    flexDirection: 'row',
                    gap: 6,
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={theme.colors.error} />
                  <Text style={{ color: theme.colors.error, fontWeight: '700', fontSize: 12 }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showCreate} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: theme.roundness.lg, padding: 20 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: theme.colors.secondary,
                marginBottom: 4,
              }}
            >
              Save search
            </Text>
            <Text style={{ color: theme.colors.outline, fontSize: 13, marginBottom: 14 }}>
              We will alert you when new properties match your current filters.
            </Text>
            <ScrollView style={{ maxHeight: 100 }}>
              <View
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  padding: 10,
                  borderRadius: theme.roundness.md,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: theme.colors.outline, fontSize: 11, marginBottom: 4 }}>
                  Current filters
                </Text>
                <Text style={{ color: theme.colors.secondary, fontSize: 13 }}>
                  {summarise({
                    city: searchStore.city,
                    type: searchStore.type,
                    category: searchStore.category,
                    minPrice: searchStore.minPrice,
                    maxPrice: searchStore.maxPrice,
                    bhk: searchStore.bhk,
                    furnishing: searchStore.furnishing,
                  })}
                </Text>
              </View>
            </ScrollView>
            <TextInput
              value={alertName}
              onChangeText={setAlertName}
              placeholder="e.g. 3BHK in Whitefield"
              placeholderTextColor={theme.colors.outline}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                borderRadius: theme.roundness.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: theme.colors.secondary,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setShowCreate(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: theme.roundness.md,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCreate}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: theme.roundness.md,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ title, onAdd }: { title: string; onAdd?: () => void }) {
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
        {title}
      </Text>
      {onAdd && (
        <TouchableOpacity
          onPress={onAdd}
          style={{
            backgroundColor: theme.colors.primary,
            width: 36,
            height: 36,
            borderRadius: theme.roundness.full,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
