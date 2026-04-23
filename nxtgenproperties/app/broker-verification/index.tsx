import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { theme } from '@/constants/theme';
import { uploadBrokerDocument } from '@/lib/uploads';
import { brokerVerificationSchema, firstError } from '@/lib/validation';

type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

type ExistingRequest = {
  id: string;
  status: VerificationStatus;
  reviewer_notes: string | null;
  submitted_at: string;
};

type UploadedDoc = { path: string; signedUrl: string } | null;

export default function BrokerVerificationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [existing, setExisting] = useState<ExistingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.name ?? '',
    rera_id: '',
    agency_name: '',
    years_experience: '',
  });
  const [idDoc, setIdDoc] = useState<UploadedDoc>(null);
  const [reraDoc, setReraDoc] = useState<UploadedDoc>(null);
  const [agencyDoc, setAgencyDoc] = useState<UploadedDoc>(null);
  const [uploading, setUploading] = useState<null | 'id' | 'rera' | 'agency'>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.user_id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('broker_verifications')
        .select('id, status, reviewer_notes, submitted_at')
        .eq('user_id', user.user_id)
        .maybeSingle();
      if (cancelled) return;
      setExisting((data as ExistingRequest) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const pickDocument = async (slot: 'id' | 'rera' | 'agency') => {
    if (!user?.user_id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(slot);
    try {
      const uploaded = await uploadBrokerDocument({
        localUri: result.assets[0].uri,
        userId: user.user_id,
        prefix: `broker-verification/${slot}`,
      });
      if (slot === 'id') setIdDoc(uploaded);
      else if (slot === 'rera') setReraDoc(uploaded);
      else setAgencyDoc(uploaded);
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!user?.user_id) {
      Alert.alert('Sign in required', 'Please sign in first.');
      return;
    }

    const candidate = {
      full_name: form.full_name,
      rera_id: form.rera_id,
      agency_name: form.agency_name,
      years_experience: form.years_experience ? Number(form.years_experience) : undefined,
      id_document_url: idDoc?.signedUrl ?? '',
      rera_document_url: reraDoc?.signedUrl ?? '',
      agency_document_url: agencyDoc?.signedUrl,
    };
    const parsed = brokerVerificationSchema.safeParse(candidate);
    if (!parsed.success) {
      Alert.alert('Check your details', firstError(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      // Store the storage PATHs, not the signed URLs (URLs expire).
      const row = {
        user_id: user.user_id,
        full_name: parsed.data.full_name,
        rera_id: parsed.data.rera_id,
        agency_name: parsed.data.agency_name || null,
        years_experience: parsed.data.years_experience ?? null,
        id_document_url: idDoc!.path,
        rera_document_url: reraDoc!.path,
        agency_document_url: agencyDoc?.path ?? null,
        status: 'pending' as const,
      };

      const { error } = await supabase
        .from('broker_verifications')
        .upsert(row, { onConflict: 'user_id' });
      if (error) throw error;

      Alert.alert(
        'Submitted',
        'Your verification request has been received. Our team will review your documents within 48 hours.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert('Submit Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const alreadyApproved = existing?.status === 'approved';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }} edges={['top']}>
      <Header onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <StatusBanner existing={existing} />

          {alreadyApproved ? (
            <View
              style={{
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: theme.roundness.lg,
                padding: 20,
                marginTop: 16,
              }}
            >
              <Ionicons name="shield-checkmark" size={36} color={theme.colors.primary} />
              <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 12, color: theme.colors.secondary }}>
                You are a verified broker
              </Text>
              <Text style={{ marginTop: 6, color: theme.colors.outline }}>
                Your profile shows the verified badge and ranks higher in search.
              </Text>
            </View>
          ) : (
            <>
              <SectionTitle>Identity</SectionTitle>
              <LabeledInput
                label="Full name (as on government ID)"
                value={form.full_name}
                onChangeText={(v) => setForm({ ...form, full_name: v })}
                autoCapitalize="words"
              />

              <SectionTitle>RERA details</SectionTitle>
              <LabeledInput
                label="RERA registration number"
                value={form.rera_id}
                onChangeText={(v) => setForm({ ...form, rera_id: v.toUpperCase() })}
                autoCapitalize="characters"
                placeholder="e.g. UPRERAAGT10001"
              />
              <LabeledInput
                label="Agency name (optional)"
                value={form.agency_name}
                onChangeText={(v) => setForm({ ...form, agency_name: v })}
              />
              <LabeledInput
                label="Years of experience (optional)"
                value={form.years_experience}
                onChangeText={(v) => setForm({ ...form, years_experience: v.replace(/\D/g, '') })}
                keyboardType="number-pad"
              />

              <SectionTitle>Documents</SectionTitle>
              <DocumentSlot
                label="Government ID (Aadhaar / PAN / Passport)"
                hint="Required"
                status={idDoc ? 'uploaded' : 'empty'}
                busy={uploading === 'id'}
                onPress={() => pickDocument('id')}
              />
              <DocumentSlot
                label="RERA certificate"
                hint="Required"
                status={reraDoc ? 'uploaded' : 'empty'}
                busy={uploading === 'rera'}
                onPress={() => pickDocument('rera')}
              />
              <DocumentSlot
                label="Agency letter"
                hint="Optional — speeds up review"
                status={agencyDoc ? 'uploaded' : 'empty'}
                busy={uploading === 'agency'}
                onPress={() => pickDocument('agency')}
              />

              <View
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.roundness.md,
                  padding: 14,
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                }}
              >
                <Ionicons name="lock-closed" size={16} color={theme.colors.outline} />
                <Text style={{ marginLeft: 8, flex: 1, color: theme.colors.outline, fontSize: 12 }}>
                  Documents are stored in a private bucket. Only you and the NxtGen verification team can access them.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {!alreadyApproved && (
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.surface,
            }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              style={{
                backgroundColor: theme.colors.primary,
                paddingVertical: 16,
                borderRadius: theme.roundness.lg,
                alignItems: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {existing ? 'Resubmit for review' : 'Submit for review'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---- small presentational helpers ----

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <TouchableOpacity onPress={onBack} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
      </TouchableOpacity>
      <Text style={{ fontSize: 18, fontWeight: '700', marginLeft: 8, color: theme.colors.secondary }}>
        Broker verification
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.outline,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function LabeledInput(
  props: React.ComponentProps<typeof TextInput> & { label: string },
) {
  const { label, ...rest } = props;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: theme.colors.outline, marginBottom: 6 }}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.outline}
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: theme.roundness.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: theme.colors.secondary,
        }}
        {...rest}
      />
    </View>
  );
}

function DocumentSlot({
  label,
  hint,
  status,
  busy,
  onPress,
}: {
  label: string;
  hint: string;
  status: 'empty' | 'uploaded';
  busy: boolean;
  onPress: () => void;
}) {
  const uploaded = status === 'uploaded';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={busy}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 10,
        borderRadius: theme.roundness.md,
        backgroundColor: uploaded ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
        borderWidth: 1,
        borderColor: uploaded ? theme.colors.primary : theme.colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: uploaded ? theme.colors.primary : '#fff',
        }}
      >
        {busy ? (
          <ActivityIndicator color={uploaded ? '#fff' : theme.colors.primary} />
        ) : (
          <Ionicons
            name={uploaded ? 'checkmark' : 'cloud-upload-outline'}
            size={22}
            color={uploaded ? '#fff' : theme.colors.primary}
          />
        )}
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: theme.colors.secondary, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}>
          {uploaded ? 'Uploaded — tap to replace' : hint}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.outline} />
    </TouchableOpacity>
  );
}

function StatusBanner({ existing }: { existing: ExistingRequest | null }) {
  if (!existing) return null;
  const map = {
    pending: { bg: '#FEF3C7', fg: '#92400E', icon: 'time-outline', msg: 'Your request is under review. We usually respond in 24–48 hours.' },
    approved: { bg: '#D1FAE5', fg: '#065F46', icon: 'shield-checkmark', msg: 'Your broker profile is verified.' },
    rejected: { bg: '#FEE2E2', fg: '#991B1B', icon: 'close-circle-outline', msg: existing.reviewer_notes ?? 'The team could not verify your documents. Please review and resubmit.' },
    none: null,
  } as const;
  const state = map[existing.status];
  if (!state) return null;
  return (
    <View
      style={{
        backgroundColor: state.bg,
        borderRadius: theme.roundness.md,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <Ionicons name={state.icon as any} size={20} color={state.fg} />
      <Text style={{ marginLeft: 10, color: state.fg, flex: 1, fontSize: 13 }}>{state.msg}</Text>
    </View>
  );
}
