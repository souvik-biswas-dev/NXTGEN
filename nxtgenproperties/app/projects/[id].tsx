import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

function formatPrice(price: number): string {
  if (price >= 1_00_00_000) return `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
  if (price >= 1_00_000) return `₹${(price / 1_00_000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await api.get<Project>(`/catalog/projects/${id}`, undefined, false);
        setProject(data ?? null);
      } catch {
        setProject(null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: theme.colors.outline }}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ position: 'relative' }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {(project.gallery?.length ? project.gallery : [project.cover_image]).map((uri, i) =>
              uri ? (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{
                    width,
                    height: 280,
                    backgroundColor: theme.colors.surfaceVariant,
                  }}
                  resizeMode="cover"
                />
              ) : null
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 40,
              left: 16,
              backgroundColor: 'rgba(255,255,255,0.95)',
              padding: 10,
              borderRadius: theme.roundness.full,
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: -24,
            marginHorizontal: 16,
            backgroundColor: theme.colors.secondary,
            padding: 16,
            borderRadius: theme.roundness.lg,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{project.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
            by {project.developer}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text
              style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginLeft: 4 }}
              numberOfLines={1}
            >
              {project.location}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {project.launch_date && (
              <Badge icon="rocket-outline" label={`Launch ${project.launch_date}`} />
            )}
            {project.possession_date && (
              <Badge icon="calendar-outline" label={`Possession ${project.possession_date}`} />
            )}
            {project.verified && project.rera_id && (
              <Badge icon="shield-checkmark" label={project.rera_id} color={theme.colors.success} />
            )}
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: theme.colors.primary,
            }}
          >
            {project.price_min && project.price_max
              ? `${formatPrice(project.price_min)} – ${formatPrice(project.price_max)}`
              : 'Contact for price'}
          </Text>
        </View>

        {project.description && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={sectionTitle}>About this project</Text>
            <Text
              style={{ color: theme.colors.outline, fontSize: 14, lineHeight: 22, marginTop: 6 }}
            >
              {project.description}
            </Text>
          </View>
        )}

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
          {project.total_units !== undefined && (
            <StatCard label="Total units" value={String(project.total_units)} />
          )}
          {project.available_units !== undefined && (
            <StatCard label="Available" value={String(project.available_units)} />
          )}
          {project.tower_count !== undefined && (
            <StatCard label="Towers" value={String(project.tower_count)} />
          )}
        </View>

        {/* Floor Plans */}
        {project.floor_plans?.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={sectionTitle}>Floor plans & pricing</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {project.floor_plans.map((fp, i) => (
                <View
                  key={i}
                  style={{
                    width: 220,
                    marginRight: 12,
                    backgroundColor: '#fff',
                    borderRadius: theme.roundness.lg,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: theme.colors.outlineVariant,
                  }}
                >
                  {fp.image && (
                    <Image
                      source={{ uri: fp.image }}
                      style={{
                        width: '100%',
                        height: 140,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  <View style={{ padding: 12 }}>
                    <Text
                      style={{ fontWeight: '800', color: theme.colors.secondary, fontSize: 15 }}
                    >
                      {fp.name}
                    </Text>
                    <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}>
                      {fp.area} sqft
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.primary,
                        fontSize: 16,
                        fontWeight: '800',
                        marginTop: 6,
                      }}
                    >
                      {formatPrice(fp.price)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amenities */}
        {project.amenities?.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={sectionTitle}>Project amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {project.amenities.map((a) => (
                <View
                  key={a}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.surfaceVariant,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: theme.roundness.full,
                    gap: 4,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                  <Text style={{ color: theme.colors.secondary, fontSize: 12, fontWeight: '600' }}>
                    {a}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          onPress={() => router.push('/tools/home-loan' as never)}
          activeOpacity={0.85}
          style={{ marginHorizontal: 16, marginBottom: 20 }}
        >
          <LinearGradient
            colors={[theme.colors.primary, '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: theme.roundness.lg,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="wallet" size={22} color="#fff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Need a home loan?</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Get best rates from partner banks
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({
  icon,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.roundness.sm,
        backgroundColor: (color ?? theme.colors.primary) + '33',
      }}
    >
      <Ionicons name={icon} size={12} color={color ?? theme.colors.primary} />
      <Text style={{ color: color ?? theme.colors.primary, fontSize: 11, fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: theme.roundness.md,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <Text style={{ color: theme.colors.outline, fontSize: 11 }}>{label}</Text>
      <Text
        style={{ color: theme.colors.secondary, fontWeight: '800', fontSize: 18, marginTop: 2 }}
      >
        {value}
      </Text>
    </View>
  );
}

const sectionTitle = {
  fontSize: 16,
  fontWeight: '700' as const,
  color: theme.colors.secondary,
};
