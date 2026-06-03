import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { ReportReason, ReportReasonItem } from '@/types';
import { theme } from '@/constants/theme';

const FALLBACK_REASONS: ReportReasonItem[] = [
  { id: 'spam', label: 'Spam / Fake Listing' },
  { id: 'duplicate', label: 'Duplicate Listing' },
  { id: 'misleading', label: 'Misleading Information' },
  { id: 'sold_or_rented', label: 'Already Sold / Rented' },
  { id: 'inappropriate', label: 'Inappropriate Content' },
  { id: 'fraud', label: 'Suspected Fraud' },
  { id: 'other', label: 'Other' },
];

export default function ReportListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [reasons, setReasons] = useState<ReportReasonItem[]>(FALLBACK_REASONS);
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<ReportReasonItem[]>(
          '/platform-data/report_reasons',
          undefined,
          false
        );
        if (Array.isArray(data)) setReasons(data);
      } catch {
        /* keep fallback */
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to report this listing.');
      return;
    }
    if (!selected) {
      Alert.alert('Pick a reason', 'Select the reason for reporting this listing.');
      return;
    }
    if (!id) return;

    setSubmitting(true);
    try {
      await api.post('/catalog/reports', {
        propertyId: id,
        reason: selected,
        details: details.trim() || undefined,
      });
      Alert.alert('Thanks for reporting', 'Our team will review this listing within 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
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
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.secondary,
            flex: 1,
            marginLeft: 10,
          }}
        >
          Report Listing
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: '#FEF3C7',
            borderRadius: theme.roundness.md,
            padding: 12,
            marginBottom: 20,
            flexDirection: 'row',
          }}
        >
          <Ionicons name="warning" size={20} color="#B45309" />
          <Text style={{ color: '#78350F', fontSize: 13, marginLeft: 8, flex: 1 }}>
            Help us keep NxtGen safe. Your report is confidential and will be reviewed within 24
            hours.
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.secondary,
            marginBottom: 10,
          }}
        >
          What's the problem?
        </Text>

        {reasons.map((r) => {
          const active = selected === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelected(r.id)}
              style={{
                padding: 14,
                borderRadius: theme.roundness.md,
                backgroundColor: '#fff',
                borderWidth: 1.5,
                borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {active && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.colors.primary,
                    }}
                  />
                )}
              </View>
              <Text
                style={{
                  color: theme.colors.secondary,
                  fontSize: 14,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.secondary,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Extra details (optional)
        </Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          multiline
          placeholder="Tell us more about what's wrong…"
          placeholderTextColor={theme.colors.outline}
          style={{
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: theme.roundness.md,
            padding: 12,
            minHeight: 110,
            textAlignVertical: 'top',
            color: theme.colors.secondary,
          }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 20,
            backgroundColor: theme.colors.error,
            paddingVertical: 14,
            borderRadius: theme.roundness.xl,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
