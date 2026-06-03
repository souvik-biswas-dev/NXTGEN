import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/constants/theme';

type Tab = 'overview' | 'listings' | 'reports' | 'users';

interface Stats {
  totalProperties: number;
  pendingProperties: number;
  totalUsers: number;
  openReports: number;
  totalProjects: number;
}

interface PropertyRow {
  id: string;
  title: string;
  city: string;
  price: number;
  verified: boolean;
  featured: boolean;
  created_at: string;
}

interface ReportRow {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  property_id: string;
}

interface UserRow {
  id: string;
  name: string;
  role: string;
  verified_broker: boolean;
  created_at: string;
}

function formatPrice(p: number) {
  if (p >= 1_00_00_000) return `₹${(p / 1_00_00_000).toFixed(1)}Cr`;
  if (p >= 1_00_000) return `₹${(p / 1_00_000).toFixed(1)}L`;
  return `₹${p.toLocaleString('en-IN')}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = user?.role === 'admin';

  const fetchAll = useCallback(async () => {
    try {
      const [propRes, userRes, reportRes, statRes] = await Promise.all([
        api.get<{ items: PropertyRow[] }>('/admin/listings'),
        api.get<{ items: UserRow[] }>('/admin/users'),
        api.get<{ items: ReportRow[] }>('/admin/reports'),
        api.get<{ properties: number; users: number; reports: number }>('/admin/stats'),
      ]);

      const props = propRes.items ?? [];
      const usrs = userRes.items ?? [];
      const reps = reportRes.items ?? [];

      setProperties(props);
      setUsers(usrs);
      setReports(reps);
      setStats({
        totalProperties: statRes.properties,
        pendingProperties: props.filter((p) => !p.verified).length,
        totalUsers: statRes.users,
        openReports: reps.filter((r) => r.status === 'open').length,
        totalProjects: 0,
      });
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Don't hit the admin-only endpoints (they'd 403) unless the user is one.
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      fetchAll();
    }, [isAdmin, fetchAll])
  );

  // Gate: only admins can access this screen
  if (!isAdmin) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.colors.outlineVariant} />
          <Text
            style={{
              color: theme.colors.secondary,
              fontSize: 18,
              fontWeight: '700',
              marginTop: 16,
            }}
          >
            Access Denied
          </Text>
          <Text style={{ color: theme.colors.outline, marginTop: 8, textAlign: 'center' }}>
            This area is restricted to administrators only.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: theme.roundness.xl,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const verifyProperty = async (id: string, verified: boolean) => {
    try {
      await api.patch(`/admin/listings/${id}`, { verified });
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, verified } : p)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
    }
  };

  const featureProperty = async (id: string, featured: boolean) => {
    try {
      await api.patch(`/admin/listings/${id}`, { featured });
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, featured } : p)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
    }
  };

  const resolveReport = async (id: string) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status: 'resolved' });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
    }
  };

  const dismissReport = async (id: string) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status: 'dismissed' });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r)));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
    }
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS: { id: Tab; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
    { id: 'overview', icon: 'grid-outline', label: 'Overview' },
    { id: 'listings', icon: 'home-outline', label: 'Listings' },
    { id: 'reports', icon: 'flag-outline', label: 'Reports' },
    { id: 'users', icon: 'people-outline', label: 'Users' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      {/* Header */}
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
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.secondary, flex: 1 }}>
          Admin Dashboard
        </Text>
        <View
          style={{
            backgroundColor: theme.colors.error + '22',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.roundness.full,
          }}
        >
          <Text style={{ color: theme.colors.error, fontSize: 11, fontWeight: '700' }}>ADMIN</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
          gap: 4,
        }}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: theme.roundness.md,
              backgroundColor: activeTab === t.id ? theme.colors.primary : 'transparent',
            }}
          >
            <Ionicons
              name={t.icon}
              size={18}
              color={activeTab === t.id ? '#fff' : theme.colors.outline}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                marginTop: 2,
                color: activeTab === t.id ? '#fff' : theme.colors.outline,
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAll();
              }}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* ---- OVERVIEW ---- */}
          {activeTab === 'overview' && stats && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <StatCard
                  label="Total Listings"
                  value={stats.totalProperties}
                  icon="home-outline"
                  color="#3B82F6"
                />
                <StatCard
                  label="Pending Review"
                  value={stats.pendingProperties}
                  icon="time-outline"
                  color={theme.colors.gold}
                />
                <StatCard
                  label="Total Users"
                  value={stats.totalUsers}
                  icon="people-outline"
                  color="#8B5CF6"
                />
                <StatCard
                  label="Open Reports"
                  value={stats.openReports}
                  icon="flag-outline"
                  color={theme.colors.error}
                />
                <StatCard
                  label="Projects"
                  value={stats.totalProjects}
                  icon="business-outline"
                  color="#10B981"
                />
              </View>

              {/* Recent pending listings */}
              <Text
                style={{
                  fontWeight: '700',
                  color: theme.colors.secondary,
                  fontSize: 14,
                  marginTop: 20,
                  marginBottom: 10,
                }}
              >
                Pending Listings
              </Text>
              {properties
                .filter((p) => !p.verified)
                .slice(0, 5)
                .map((p) => (
                  <ListingAdminRow
                    key={p.id}
                    property={p}
                    onView={() => router.push(`/(tabs)/search/${p.id}` as never)}
                    onVerify={() => verifyProperty(p.id, true)}
                    onFeature={() => featureProperty(p.id, !p.featured)}
                  />
                ))}
              {properties.filter((p) => !p.verified).length === 0 && (
                <Text style={{ color: theme.colors.outline, fontSize: 13 }}>
                  No pending listings
                </Text>
              )}

              {/* Recent open reports */}
              <Text
                style={{
                  fontWeight: '700',
                  color: theme.colors.secondary,
                  fontSize: 14,
                  marginTop: 20,
                  marginBottom: 10,
                }}
              >
                Open Reports
              </Text>
              {reports
                .filter((r) => r.status === 'open')
                .slice(0, 5)
                .map((r) => (
                  <ReportAdminRow
                    key={r.id}
                    report={r}
                    onResolve={() => resolveReport(r.id)}
                    onDismiss={() => dismissReport(r.id)}
                    onViewProperty={() => router.push(`/(tabs)/search/${r.property_id}` as never)}
                  />
                ))}
              {reports.filter((r) => r.status === 'open').length === 0 && (
                <Text style={{ color: theme.colors.outline, fontSize: 13 }}>No open reports</Text>
              )}
            </>
          )}

          {/* ---- LISTINGS ---- */}
          {activeTab === 'listings' && (
            <>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search listings…"
              />
              {filteredProperties.map((p) => (
                <ListingAdminRow
                  key={p.id}
                  property={p}
                  onView={() => router.push(`/(tabs)/search/${p.id}` as never)}
                  onVerify={() => verifyProperty(p.id, !p.verified)}
                  onFeature={() => featureProperty(p.id, !p.featured)}
                />
              ))}
            </>
          )}

          {/* ---- REPORTS ---- */}
          {activeTab === 'reports' && (
            <>
              {reports.map((r) => (
                <ReportAdminRow
                  key={r.id}
                  report={r}
                  onResolve={() => resolveReport(r.id)}
                  onDismiss={() => dismissReport(r.id)}
                  onViewProperty={() => router.push(`/(tabs)/search/${r.property_id}` as never)}
                />
              ))}
            </>
          )}

          {/* ---- USERS ---- */}
          {activeTab === 'users' && (
            <>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search users…"
              />
              {filteredUsers.map((u) => (
                <UserAdminRow key={u.id} user={u} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View
      style={{
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: theme.roundness.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: color + '18',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: '800', color: theme.colors.secondary }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: theme.colors.outline, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ListingAdminRow({
  property,
  onView,
  onVerify,
  onFeature,
}: {
  property: PropertyRow;
  onView: () => void;
  onVerify: () => void;
  onFeature: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.roundness.md,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <TouchableOpacity onPress={onView}>
        <Text
          style={{ fontWeight: '700', color: theme.colors.secondary, fontSize: 14 }}
          numberOfLines={1}
        >
          {property.title}
        </Text>
        <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}>
          {property.city} · {formatPrice(property.price)}
        </Text>
        <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 1 }}>
          Posted: {new Date(property.created_at).toLocaleDateString('en-IN')}
        </Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <TouchableOpacity
          onPress={onVerify}
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: theme.roundness.md,
            backgroundColor: property.verified ? '#D1FAE5' : theme.colors.primaryContainer,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: property.verified ? '#047857' : theme.colors.primary,
            }}
          >
            {property.verified ? '✓ Verified' : 'Verify'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onFeature}
          style={{
            flex: 1,
            paddingVertical: 7,
            borderRadius: theme.roundness.md,
            backgroundColor: property.featured ? '#FEF3C7' : theme.colors.surfaceVariant,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: property.featured ? '#92400E' : theme.colors.outline,
            }}
          >
            {property.featured ? '★ Featured' : 'Feature'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReportAdminRow({
  report,
  onResolve,
  onDismiss,
  onViewProperty,
}: {
  report: ReportRow;
  onResolve: () => void;
  onDismiss: () => void;
  onViewProperty: () => void;
}) {
  const statusColor: Record<string, string> = {
    open: theme.colors.error,
    reviewing: theme.colors.gold,
    resolved: theme.colors.success,
    dismissed: theme.colors.outline,
  };
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.roundness.md,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontWeight: '700',
            color: theme.colors.secondary,
            fontSize: 13,
            textTransform: 'capitalize',
          }}
        >
          {report.reason.replace(/_/g, ' ')}
        </Text>
        <View
          style={{
            backgroundColor: (statusColor[report.status] ?? theme.colors.outline) + '22',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: theme.roundness.sm,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: statusColor[report.status] ?? theme.colors.outline,
              textTransform: 'capitalize',
            }}
          >
            {report.status}
          </Text>
        </View>
      </View>
      <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 4 }}>
        {new Date(report.created_at).toLocaleDateString('en-IN')}
      </Text>
      {report.status === 'open' && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TouchableOpacity
            onPress={onViewProperty}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.roundness.md,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.secondary }}>
              View Listing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onResolve}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.roundness.md,
              backgroundColor: '#D1FAE5',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#047857' }}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDismiss}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: theme.roundness.md,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.outline }}>
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function UserAdminRow({ user }: { user: UserRow }) {
  const roleColor: Record<string, string> = {
    buyer: '#3B82F6',
    owner: '#10B981',
    broker: '#8B5CF6',
    admin: theme.colors.error,
  };
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: theme.roundness.md,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: (roleColor[user.role] ?? theme.colors.outline) + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons
          name="person-outline"
          size={20}
          color={roleColor[user.role] ?? theme.colors.outline}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: theme.colors.secondary, fontSize: 14 }}>
          {user.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: roleColor[user.role] ?? theme.colors.outline,
              textTransform: 'capitalize',
            }}
          >
            {user.role}
          </Text>
          {user.verified_broker && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Ionicons name="shield-checkmark" size={12} color={theme.colors.success} />
              <Text style={{ fontSize: 10, color: theme.colors.success, fontWeight: '600' }}>
                Verified Broker
              </Text>
            </View>
          )}
        </View>
        <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 1 }}>
          Joined: {new Date(user.created_at).toLocaleDateString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.roundness.lg,
        paddingHorizontal: 12,
        marginBottom: 12,
      }}
    >
      <Ionicons name="search-outline" size={18} color={theme.colors.outline} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.outline}
        style={{
          flex: 1,
          paddingVertical: 10,
          marginLeft: 8,
          color: theme.colors.secondary,
          fontSize: 14,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={18} color={theme.colors.outline} />
        </TouchableOpacity>
      )}
    </View>
  );
}
