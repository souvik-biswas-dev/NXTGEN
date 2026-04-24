import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { AppDialog } from '@/components/AppDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, addDays } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types';
import { theme } from '@/constants/theme';

const SLOTS = ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'];

export default function SiteVisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getPropertyById } = usePropertiesStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [dateIdx, setDateIdx] = useState(0);
  const [slot, setSlot] = useState<string>(SLOTS[1]);

  const [dialog, setDialog] = useState<{
    variant: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message?: string;
    onClose?: () => void;
  } | null>(null);

  // Next 7 dates, starting tomorrow.
  const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i + 1));

  useEffect(() => {
    (async () => {
      if (!id) return;
      const p = await getPropertyById(id);
      setProperty(p ?? null);
      setLoading(false);
    })();
  }, [id, getPropertyById]);

  const handleSubmit = async () => {
    if (!user) {
      setDialog({
        variant: 'warning',
        title: 'Sign in required',
        message: 'Please sign in to request a site visit.',
      });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setDialog({
        variant: 'warning',
        title: 'Missing info',
        message: 'Name and phone are required.',
      });
      return;
    }
    if (!property) return;

    setSubmitting(true);
    try {
      const preferredDate = dates[dateIdx];
      const contactId = property.broker_id || property.owner_id || null;
      const { error } = await supabase.from('site_visit_requests').insert({
        property_id: property.id,
        user_id: user.user_id,
        contact_user_id: contactId,
        preferred_date: preferredDate.toISOString(),
        slot,
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim() || null,
        status: 'pending',
      });
      if (error) throw error;

      // Fire-and-forget in-app notification for the owner/broker.
      if (contactId) {
        await supabase.from('in_app_notifications').insert({
          user_id: contactId,
          type: 'site_visit',
          title: 'Site visit requested',
          body: `${name.trim()} wants to visit ${property.title} on ${format(
            preferredDate,
            'EEE, d MMM'
          )} at ${slot}.`,
          data: { property_id: property.id },
        });
      }

      setDialog({
        variant: 'success',
        title: 'Request sent',
        message: 'We have notified the owner. You will receive a confirmation shortly.',
        onClose: () => router.back(),
      });
    } catch (err) {
      setDialog({
        variant: 'error',
        title: 'Could not send request',
        message: err instanceof Error ? err.message : 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={Platform.OS === 'ios' ? ['top'] : ['top', 'bottom']}
    >
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {property && (
          <View
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              padding: 12,
              borderRadius: theme.roundness.lg,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: theme.colors.outline, fontSize: 11 }}>Visiting</Text>
            <Text
              style={{ color: theme.colors.secondary, fontWeight: '700', fontSize: 15 }}
              numberOfLines={1}
            >
              {property.title}
            </Text>
            <Text style={{ color: theme.colors.outline, fontSize: 12 }}>
              {property.locality}, {property.city}
            </Text>
          </View>
        )}

        <Text style={label}>Choose a date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {dates.map((d, i) => {
            const active = dateIdx === i;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setDateIdx(i)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  marginRight: 8,
                  borderRadius: theme.roundness.md,
                  backgroundColor: active ? theme.colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  alignItems: 'center',
                  minWidth: 66,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.outline,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {format(d, 'EEE')}
                </Text>
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.secondary,
                    fontWeight: '800',
                    fontSize: 18,
                    marginTop: 2,
                  }}
                >
                  {format(d, 'd')}
                </Text>
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.outline,
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  {format(d, 'MMM')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={label}>Pick a time slot</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {SLOTS.map((s) => {
            const active = s === slot;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSlot(s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: theme.roundness.full,
                  backgroundColor: active ? theme.colors.primary : '#fff',
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.secondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={label}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={theme.colors.outline}
          style={input}
        />

        <Text style={label}>Phone number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.outline}
          style={input}
        />

        <Text style={label}>Anything for the owner?</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          multiline
          placeholderTextColor={theme.colors.outline}
          style={[input, { minHeight: 80, textAlignVertical: 'top' }]}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: 20,
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            borderRadius: theme.roundness.xl,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              Request site visit
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <AppDialog
        visible={!!dialog}
        variant={dialog?.variant ?? 'info'}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        onDismiss={() => {
          const onClose = dialog?.onClose;
          setDialog(null);
          onClose?.();
        }}
      />
    </SafeAreaView>
  );
}

function Header() {
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
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.secondary,
          flex: 1,
          marginLeft: 10,
        }}
      >
        Request Site Visit
      </Text>
    </View>
  );
}

const label = {
  color: theme.colors.secondary,
  fontWeight: '700' as const,
  marginBottom: 8,
  marginTop: 4,
  fontSize: 14,
};

const input = {
  backgroundColor: theme.colors.surfaceVariant,
  borderRadius: theme.roundness.md,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: theme.colors.secondary,
  fontSize: 14,
  marginBottom: 14,
};
