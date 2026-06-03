import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { LocalityReviewDetailed, User } from '@/types';
import { theme } from '@/constants/theme';

type ReviewRow = LocalityReviewDetailed & { reviewer?: User };

function Stars({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          disabled={!onChange}
          onPress={() => onChange?.(n)}
          activeOpacity={onChange ? 0.6 : 1}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? theme.colors.gold : theme.colors.outlineVariant}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function LocalityReviewsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ locality?: string; city?: string }>();
  const locality = params.locality || '';
  const city = params.city || '';

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [rating, setRating] = useState(0);
  const [safety, setSafety] = useState(0);
  const [connectivity, setConnectivity] = useState(0);
  const [amenitiesRating, setAmenitiesRating] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!locality || !city) {
      setLoading(false);
      return;
    }
    try {
      const { items } = await api.get<{ items: ReviewRow[] }>(
        '/reviews/locality',
        { locality, city },
        false
      );
      setReviews(items ?? []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, [locality, city]);

  useEffect(() => {
    load();
  }, [load]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return { overall: 0, safety: 0, connectivity: 0, amenities: 0 };
    const sum = reviews.reduce(
      (acc, r) => ({
        overall: acc.overall + r.rating,
        safety: acc.safety + (r.safety ?? 0),
        connectivity: acc.connectivity + (r.connectivity ?? 0),
        amenities: acc.amenities + (r.amenities_rating ?? 0),
      }),
      { overall: 0, safety: 0, connectivity: 0, amenities: 0 }
    );
    return {
      overall: sum.overall / reviews.length,
      safety: sum.safety / reviews.length,
      connectivity: sum.connectivity / reviews.length,
      amenities: sum.amenities / reviews.length,
    };
  }, [reviews]);

  const submit = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to leave a review.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Rating required', 'Please give an overall rating.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews/locality', {
        locality,
        city,
        rating,
        safety: safety || undefined,
        connectivity: connectivity || undefined,
        amenities_rating: amenitiesRating || undefined,
        cleanliness: cleanliness || undefined,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      setShowForm(false);
      setRating(0);
      setSafety(0);
      setConnectivity(0);
      setAmenitiesRating(0);
      setCleanliness(0);
      setTitle('');
      setComment('');
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit');
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
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.secondary }}>
            {locality}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.outline }}>{city}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: theme.roundness.full,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Review</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Overall summary */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: theme.roundness.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginRight: 18 }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: theme.colors.primary }}>
                  {avg.overall.toFixed(1)}
                </Text>
                <Stars value={Math.round(avg.overall)} size={14} />
                <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 4 }}>
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <MiniMetric label="Safety" value={avg.safety} />
                <MiniMetric label="Connectivity" value={avg.connectivity} />
                <MiniMetric label="Amenities" value={avg.amenities} />
              </View>
            </View>
          </View>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.outlineVariant} />
              <Text style={{ color: theme.colors.outline, marginTop: 10, fontSize: 13 }}>
                Be the first to review {locality}
              </Text>
            </View>
          ) : (
            reviews.map((r) => (
              <View
                key={r.id}
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
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: theme.colors.primaryContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 14 }}>
                      {(r.reviewer?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontWeight: '700', color: theme.colors.secondary }}>
                      {r.reviewer?.name || 'Anonymous'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.colors.outline }}>
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </Text>
                  </View>
                  <Stars value={r.rating} size={14} />
                </View>
                {r.title && (
                  <Text
                    style={{
                      fontWeight: '700',
                      color: theme.colors.secondary,
                      marginTop: 10,
                    }}
                  >
                    {r.title}
                  </Text>
                )}
                {r.comment && (
                  <Text
                    style={{
                      color: theme.colors.outline,
                      fontSize: 13,
                      marginTop: 4,
                      lineHeight: 20,
                    }}
                  >
                    {r.comment}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
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
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                fontWeight: '700',
                fontSize: 18,
                color: theme.colors.secondary,
                marginLeft: 10,
              }}
            >
              Review {locality}
            </Text>
            <TouchableOpacity onPress={submit} disabled={submitting}>
              <Text
                style={{
                  color: submitting ? theme.colors.outlineVariant : theme.colors.primary,
                  fontWeight: '700',
                }}
              >
                {submitting ? 'Posting…' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <FormRow label="Overall">
              <Stars value={rating} onChange={setRating} size={24} />
            </FormRow>
            <FormRow label="Safety">
              <Stars value={safety} onChange={setSafety} />
            </FormRow>
            <FormRow label="Connectivity">
              <Stars value={connectivity} onChange={setConnectivity} />
            </FormRow>
            <FormRow label="Amenities">
              <Stars value={amenitiesRating} onChange={setAmenitiesRating} />
            </FormRow>
            <FormRow label="Cleanliness">
              <Stars value={cleanliness} onChange={setCleanliness} />
            </FormRow>
            <Text style={{ marginTop: 8, fontWeight: '700', color: theme.colors.secondary }}>
              Title (optional)
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Great for families"
              placeholderTextColor={theme.colors.outline}
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: theme.roundness.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginTop: 8,
                color: theme.colors.secondary,
              }}
            />
            <Text style={{ marginTop: 14, fontWeight: '700', color: theme.colors.secondary }}>
              Your experience
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="What did you like / dislike?"
              placeholderTextColor={theme.colors.outline}
              multiline
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: theme.roundness.md,
                padding: 12,
                minHeight: 120,
                textAlignVertical: 'top',
                marginTop: 8,
                color: theme.colors.secondary,
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      }}
    >
      <Text style={{ color: theme.colors.secondary, fontWeight: '600' }}>{label}</Text>
      {children}
    </View>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: theme.colors.outline }}>{label}</Text>
        <Text style={{ fontSize: 12, color: theme.colors.secondary, fontWeight: '700' }}>
          {value.toFixed(1)}
        </Text>
      </View>
      <View
        style={{
          marginTop: 4,
          height: 4,
          backgroundColor: theme.colors.outlineVariant,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${(value / 5) * 100}%`,
            height: '100%',
            backgroundColor: theme.colors.primary,
          }}
        />
      </View>
    </View>
  );
}
