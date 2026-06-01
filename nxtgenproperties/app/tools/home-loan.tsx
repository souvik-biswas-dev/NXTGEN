import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { HomeLoanPartner } from '@/types';
import { theme } from '@/constants/theme';

export default function HomeLoanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [partners, setPartners] = useState<HomeLoanPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HomeLoanPartner | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [income, setIncome] = useState('');
  const [employmentType, setEmploymentType] = useState<
    'salaried' | 'self-employed' | 'business' | 'other'
  >('salaried');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<HomeLoanPartner[]>(
          '/platform-data/home_loan_partners',
          undefined,
          false
        );
        if (Array.isArray(data)) setPartners(data);
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, []);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Please enter your name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const toInt = (s: string) => {
        const n = Number(s.replace(/,/g, ''));
        return Number.isFinite(n) ? Math.trunc(n) : null;
      };
      await api.post('/catalog/home-loan-leads', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        loanAmount: loanAmount ? toInt(loanAmount) ?? undefined : undefined,
        employmentType,
        monthlyIncome: income ? toInt(income) ?? undefined : undefined,
        partner: selected?.name || undefined,
      });
      Alert.alert('Request sent', 'A loan advisor will call you within 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not submit request');
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
          Home Loan
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 14, color: theme.colors.outline, marginBottom: 14 }}>
          Get the best home loan offers from our partner banks. Our advisors will call you to
          compare rates.
        </Text>

        <Text
          style={{
            fontWeight: '700',
            color: theme.colors.secondary,
            marginBottom: 10,
            fontSize: 14,
          }}
        >
          Partner Banks
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {partners.map((p) => {
              const active = selected?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelected(p)}
                  style={{
                    width: 180,
                    marginRight: 10,
                    padding: 14,
                    borderRadius: theme.roundness.lg,
                    borderWidth: 2,
                    borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                    backgroundColor: '#fff',
                  }}
                >
                  {p.logo ? (
                    <Image
                      source={{ uri: p.logo }}
                      style={{ width: 60, height: 32, marginBottom: 8 }}
                      resizeMode="contain"
                    />
                  ) : null}
                  <Text style={{ fontWeight: '700', color: theme.colors.secondary, fontSize: 14 }}>
                    {p.name}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
                    <View
                      style={{
                        backgroundColor: theme.colors.primaryContainer,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: theme.roundness.sm,
                      }}
                    >
                      <Text
                        style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '700' }}
                      >
                        {p.interest}
                      </Text>
                    </View>
                    <Text style={{ color: theme.colors.outline, fontSize: 11 }}>
                      {p.maxTenure}Y
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.outline, fontSize: 11, marginTop: 4 }}>
                    Fee: {p.processingFee}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text
          style={{
            fontWeight: '700',
            color: theme.colors.secondary,
            marginTop: 20,
            marginBottom: 10,
            fontSize: 14,
          }}
        >
          Your details
        </Text>

        <Row>
          <Field label="Full Name" flex={1}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={inputStyle}
              placeholderTextColor={theme.colors.outline}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Phone" flex={1}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={inputStyle}
            />
          </Field>
        </Row>
        <Row>
          <Field label="Email" flex={1}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle}
            />
          </Field>
        </Row>
        <Row>
          <Field label="City" flex={1}>
            <TextInput value={city} onChangeText={setCity} style={inputStyle} />
          </Field>
        </Row>
        <Row gap>
          <Field label="Loan amount (₹)" flex={1}>
            <TextInput
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
              style={inputStyle}
            />
          </Field>
          <Field label="Monthly income (₹)" flex={1}>
            <TextInput
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              style={inputStyle}
            />
          </Field>
        </Row>

        <Text
          style={{
            color: theme.colors.outline,
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 8,
          }}
        >
          Employment type
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(['salaried', 'self-employed', 'business', 'other'] as const).map((t) => {
            const active = employmentType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setEmploymentType(t)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: theme.roundness.full,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : theme.colors.secondary,
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'capitalize',
                  }}
                >
                  {t.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={submit}
          disabled={submitting}
          style={{
            marginTop: 10,
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
              Get best loan offers
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/tools/emi-calculator' as never)}
          style={{
            marginTop: 12,
            backgroundColor: theme.colors.surfaceVariant,
            paddingVertical: 12,
            borderRadius: theme.roundness.xl,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.colors.secondary, fontWeight: '700', fontSize: 14 }}>
            Calculate EMI first
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ children, gap }: { children: React.ReactNode; gap?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: gap ? 10 : 0,
        marginBottom: 0,
      }}
    >
      {children}
    </View>
  );
}

function Field({
  label,
  children,
  flex,
}: {
  label: string;
  children: React.ReactNode;
  flex?: number;
}) {
  return (
    <View style={{ flex, marginBottom: 12 }}>
      <Text
        style={{
          color: theme.colors.outline,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: theme.colors.surfaceVariant,
  borderRadius: theme.roundness.md,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: theme.colors.secondary,
  fontSize: 14,
} as const;
