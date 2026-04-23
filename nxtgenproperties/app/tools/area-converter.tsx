import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';

// All conversions expressed as: 1 <unit> = X square metres.
const TO_SQM: Record<string, number> = {
  sqft: 0.092903,
  sqm: 1,
  sqyd: 0.836127,
  acre: 4046.86,
  hectare: 10000,
  bigha: 2529.29, // UP/Bihar bigha; regional variance noted in UI
  gaj: 0.836127, // same as sqyd
  marla: 25.2929, // Punjab marla
  kanal: 505.857,
  ground: 222.96, // Tamil Nadu ground
  cent: 40.4686,
};

const UNITS: { id: keyof typeof TO_SQM; label: string }[] = [
  { id: 'sqft', label: 'Square Feet' },
  { id: 'sqm', label: 'Square Metres' },
  { id: 'sqyd', label: 'Square Yards' },
  { id: 'acre', label: 'Acre' },
  { id: 'hectare', label: 'Hectare' },
  { id: 'bigha', label: 'Bigha' },
  { id: 'gaj', label: 'Gaj' },
  { id: 'marla', label: 'Marla' },
  { id: 'kanal', label: 'Kanal' },
  { id: 'ground', label: 'Ground' },
  { id: 'cent', label: 'Cent' },
];

export default function AreaConverter() {
  const router = useRouter();
  const [value, setValue] = useState('1000');
  const [fromUnit, setFromUnit] = useState<keyof typeof TO_SQM>('sqft');

  const results = useMemo(() => {
    const n = Number(value.replace(/,/g, ''));
    if (!Number.isFinite(n) || n <= 0) return [];
    const valueInSqm = n * TO_SQM[fromUnit];
    return UNITS.map((u) => ({
      id: u.id,
      label: u.label,
      value: valueInSqm / TO_SQM[u.id],
    }));
  }, [value, fromUnit]);

  const formatVal = (n: number) => {
    if (n >= 1_000_000) return n.toExponential(3);
    if (n >= 100) return n.toFixed(2);
    return n.toFixed(4);
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
          Area Converter
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: theme.colors.outline, fontSize: 13, marginBottom: 14 }}>
          Convert between Indian and international area units used in property listings.
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.secondary,
            borderRadius: theme.roundness.lg,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 6 }}>
            Enter value
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="1000"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{
                flex: 1,
                color: '#fff',
                fontSize: 28,
                fontWeight: '800',
                paddingVertical: 4,
              }}
            />
            <View
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: theme.roundness.full,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {UNITS.find((u) => u.id === fromUnit)?.label}
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
            {UNITS.map((u) => {
              const active = fromUnit === u.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => setFromUnit(u.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: theme.roundness.full,
                    backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)',
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: active ? theme.colors.secondary : '#fff',
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {u.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.secondary,
            marginBottom: 10,
          }}
        >
          Equivalent
        </Text>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: theme.roundness.lg,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            overflow: 'hidden',
          }}
        >
          {results.map((r, idx) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 14,
                borderBottomWidth: idx === results.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.outlineVariant,
                opacity: r.id === fromUnit ? 0.5 : 1,
              }}
            >
              <Text style={{ color: theme.colors.outline, fontSize: 13 }}>{r.label}</Text>
              <Text style={{ color: theme.colors.secondary, fontWeight: '700', fontSize: 15 }}>
                {formatVal(r.value)}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            marginTop: 20,
            backgroundColor: theme.colors.primaryContainer,
            padding: 12,
            borderRadius: theme.roundness.md,
            flexDirection: 'row',
          }}
        >
          <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.secondary, fontSize: 12, marginLeft: 8, flex: 1 }}>
            Regional unit definitions (bigha, ground, marla, kanal) vary by state. These values use
            the most common definitions — always confirm with the seller.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
