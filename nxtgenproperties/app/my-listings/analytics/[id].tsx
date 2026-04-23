import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

interface DailyView {
  date: string;
  count: number;
}

interface AnalyticsData {
  totalViews: number;
  last7Days: number;
  last30Days: number;
  inquiries: number;
  siteVisits: number;
  dailyViews: DailyView[];
  propertyTitle: string;
}

export default function PropertyAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    if (!id) return;
    try {
      const [propertyRes, viewsRes, inquiriesRes, visitsRes] = await Promise.all([
        supabase.from('properties').select('title').eq('id', id).single(),
        supabase
          .from('property_views')
          .select('viewed_at')
          .eq('property_id', id)
          .order('viewed_at', { ascending: false }),
        supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', id),
        supabase
          .from('site_visit_requests')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', id),
      ]);

      const views = viewsRes.data ?? [];
      const now = Date.now();
      const day7 = now - 7 * 86400000;
      const day30 = now - 30 * 86400000;

      // Group daily views for the last 30 days
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = 0;
      }
      views.forEach((v) => {
        const key = v.viewed_at.slice(0, 10);
        if (key in dailyMap) dailyMap[key]++;
      });

      setData({
        totalViews: views.length,
        last7Days: views.filter((v) => new Date(v.viewed_at).getTime() > day7).length,
        last30Days: views.filter((v) => new Date(v.viewed_at).getTime() > day30).length,
        inquiries: inquiriesRes.count ?? 0,
        siteVisits: visitsRes.count ?? 0,
        dailyViews: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
        propertyTitle: propertyRes.data?.title ?? 'Property',
      });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const maxBarValue = data ? Math.max(...data.dailyViews.map((d) => d.count), 1) : 1;

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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: theme.colors.secondary, flex: 1 }}
          numberOfLines={1}
        >
          Analytics
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : !data ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="bar-chart-outline" size={48} color={theme.colors.outlineVariant} />
          <Text style={{ color: theme.colors.outline, marginTop: 12 }}>
            Could not load analytics
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAnalytics();
              }}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: theme.colors.secondary,
              marginBottom: 16,
            }}
            numberOfLines={2}
          >
            {data.propertyTitle}
          </Text>

          {/* KPI cards */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <KPICard
              icon="eye-outline"
              label="Total Views"
              value={data.totalViews}
              color="#3B82F6"
            />
            <KPICard
              icon="time-outline"
              label="Last 7 Days"
              value={data.last7Days}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <KPICard
              icon="chatbubble-outline"
              label="Inquiries"
              value={data.inquiries}
              color="#8B5CF6"
            />
            <KPICard
              icon="calendar-outline"
              label="Site Visits"
              value={data.siteVisits}
              color="#10B981"
            />
          </View>

          {/* Daily views bar chart (last 14 days) */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: theme.roundness.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color: theme.colors.secondary,
                marginBottom: 14,
                fontSize: 14,
              }}
            >
              Views — Last 30 Days
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 3,
                height: 100,
              }}
            >
              {data.dailyViews.slice(-30).map((day) => {
                const barHeight = maxBarValue > 0 ? (day.count / maxBarValue) * 90 : 2;
                const isToday = day.date === new Date().toISOString().slice(0, 10);
                return (
                  <View
                    key={day.date}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
                  >
                    <View
                      style={{
                        width: '100%',
                        height: Math.max(barHeight, 2),
                        borderRadius: 3,
                        backgroundColor: isToday ? theme.colors.primary : theme.colors.primaryContainer,
                      }}
                    />
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 10, color: theme.colors.outline }}>
                {data.dailyViews[0]?.date.slice(5)}
              </Text>
              <Text style={{ fontSize: 10, color: theme.colors.outline }}>Today</Text>
            </View>
          </View>

          {/* Conversion funnel */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: theme.roundness.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
              marginTop: 14,
            }}
          >
            <Text
              style={{
                fontWeight: '700',
                color: theme.colors.secondary,
                marginBottom: 14,
                fontSize: 14,
              }}
            >
              Conversion Funnel
            </Text>
            {[
              { label: 'Views (30d)', value: data.last30Days, color: '#3B82F6' },
              { label: 'Inquiries', value: data.inquiries, color: '#8B5CF6' },
              { label: 'Site Visit Requests', value: data.siteVisits, color: '#10B981' },
            ].map((row, i, arr) => {
              const pct =
                i === 0 || arr[i - 1].value === 0
                  ? 100
                  : Math.round((row.value / arr[i - 1].value) * 100);
              return (
                <View key={row.label} style={{ marginBottom: 12 }}>
                  <View
                    style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <Text style={{ color: theme.colors.secondary, fontSize: 13 }}>{row.label}</Text>
                    <Text style={{ color: row.color, fontWeight: '700', fontSize: 13 }}>
                      {row.value}
                      {i > 0 && (
                        <Text style={{ color: theme.colors.outline, fontWeight: '400' }}>
                          {' '}({pct}%)
                        </Text>
                      )}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: row.color,
                        width: `${Math.min(pct, 100)}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Tips */}
          <View
            style={{
              backgroundColor: theme.colors.primaryContainer + '50',
              borderRadius: theme.roundness.lg,
              padding: 14,
              marginTop: 14,
            }}
          >
            <Text
              style={{ fontWeight: '700', color: theme.colors.secondary, marginBottom: 8, fontSize: 13 }}
            >
              Tips to get more leads
            </Text>
            {[
              'Add high-quality photos — listings with 5+ photos get 3× more views',
              'Keep your price competitive for the locality',
              'Respond to inquiries within 2 hours to improve conversions',
              'Mark as Featured to appear at the top of search results',
            ].map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
                <Ionicons
                  name="bulb-outline"
                  size={14}
                  color={theme.colors.primary}
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={{ color: theme.colors.outline, fontSize: 12, flex: 1, lineHeight: 18 }}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: theme.roundness.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: color + '18',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: theme.colors.secondary }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: theme.colors.outline, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
