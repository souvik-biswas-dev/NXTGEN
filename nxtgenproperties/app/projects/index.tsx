import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

interface Project {
  id: string;
  name: string;
  developer: string;
  location: string;
  priceRange: string;
  image: string;
  launchDate: string;
}

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_data')
        .select('data')
        .eq('key', 'new_launches')
        .single();

      if (error) throw error;
      setProjects(data?.data || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.secondary, flex: 1 }}>New Projects</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : projects.length === 0 ? (
        /* ── Coming Soon ── */
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 88, height: 88, borderRadius: theme.roundness.full, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="business-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.secondary, marginBottom: 10 }}>
            Projects Coming Soon
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.outline, textAlign: 'center', lineHeight: 22 }}>
            We're onboarding top developers. New project launches will appear here soon. Stay tuned!
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/search')}
            style={{ marginTop: 28, backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: theme.roundness.xl }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Browse All Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />
          }
        >
          {projects.map((project) => (
            <View
              key={project.id}
              style={{ backgroundColor: '#FFFFFF', borderRadius: theme.roundness.lg, overflow: 'hidden', marginBottom: 16 }}
            >
              <Image
                source={{ uri: project.image }}
                style={{ width: '100%', height: 180, backgroundColor: theme.colors.surfaceVariant }}
                resizeMode="cover"
              />
              <View style={{ padding: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.secondary }} numberOfLines={1}>
                  {project.name}
                </Text>
                <Text style={{ fontSize: 13, color: theme.colors.outline, marginTop: 3 }}>
                  by {project.developer}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="location-outline" size={14} color={theme.colors.outline} />
                  <Text style={{ fontSize: 13, color: theme.colors.outline, marginLeft: 4 }} numberOfLines={1}>
                    {project.location}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.primary }}>
                    {project.priceRange}
                  </Text>
                  <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.roundness.sm }}>
                    <Text style={{ fontSize: 12, color: '#047857', fontWeight: '600' }}>{project.launchDate}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
