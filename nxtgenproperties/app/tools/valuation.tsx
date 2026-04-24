import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';

const CITY_RATES: Record<string, number> = {
  Mumbai: 18000,
  Delhi: 12000,
  Bangalore: 9000,
  Hyderabad: 7500,
  Chennai: 7000,
  Pune: 8000,
  Kolkata: 6000,
  Gurgaon: 13000,
  Noida: 8500,
  Ahmedabad: 5500,
};

const CONDITION_MULTIPLIER: Record<string, number> = {
  new: 1.1,
  good: 1.0,
  average: 0.9,
  poor: 0.75,
};

const POSSESSION_MULTIPLIER: Record<string, number> = {
  ready: 1.0,
  'under-construction': 0.88,
};

function formatPrice(price: number): string {
  if (price >= 1_00_00_000) return `₹${(price / 1_00_00_000).toFixed(2)} Cr`;
  if (price >= 1_00_000) return `₹${(price / 1_00_000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function ValuationScreen() {
  const router = useRouter();

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState<'new' | 'good' | 'average' | 'poor'>('good');
  const [possession, setPossession] = useState<'ready' | 'under-construction'>('ready');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const AMENITY_OPTIONS = [
    'Parking',
    'Gym',
    'Swimming Pool',
    'Security',
    'Lift',
    'Power Backup',
    'Garden',
  ];

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const valuation = useMemo(() => {
    const areaNum = parseFloat(area);
    if (!areaNum || areaNum <= 0) return null;

    const baseRate = CITY_RATES[city] ?? 8000;

    // Floor premium: higher floors get up to +8%
    const floorNum = parseInt(floor) || 0;
    const totalNum = parseInt(totalFloors) || 10;
    const floorPremium = 1 + (floorNum / Math.max(totalNum, 1)) * 0.08;

    // Age depreciation: -1.5% per year, capped at 40%
    const ageNum = parseInt(age) || 0;
    const ageFactor = Math.max(1 - ageNum * 0.015, 0.6);

    // Amenities premium: +2% per amenity, capped at +10%
    const amenityPremium = 1 + Math.min(amenities.length * 0.02, 0.1);

    const condMul = CONDITION_MULTIPLIER[condition];
    const posMul = POSSESSION_MULTIPLIER[possession];

    const estimatedPrice =
      areaNum * baseRate * floorPremium * ageFactor * amenityPremium * condMul * posMul;
    const low = estimatedPrice * 0.9;
    const high = estimatedPrice * 1.1;
    const pricePerSqft = estimatedPrice / areaNum;

    return { estimatedPrice, low, high, pricePerSqft };
  }, [city, area, floor, totalFloors, age, condition, possession, amenities]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Property Valuation</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: theme.colors.outline, fontSize: 13, marginBottom: 16 }}>
          Get an instant estimate of your property's market value based on location, area, and
          condition.
        </Text>

        {/* City picker */}
        <Label>City</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {Object.keys(CITY_RATES).map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCity(c)}
              style={[styles.chip, city === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Area */}
        <Label>Built-up Area (sq.ft)</Label>
        <TextInput
          value={area}
          onChangeText={setArea}
          keyboardType="numeric"
          placeholder="e.g. 1200"
          placeholderTextColor={theme.colors.outline}
          style={styles.input}
        />

        {/* Floor */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Label>Floor No.</Label>
            <TextInput
              value={floor}
              onChangeText={setFloor}
              keyboardType="numeric"
              placeholder="e.g. 5"
              placeholderTextColor={theme.colors.outline}
              style={styles.input}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Label>Total Floors</Label>
            <TextInput
              value={totalFloors}
              onChangeText={setTotalFloors}
              keyboardType="numeric"
              placeholder="e.g. 12"
              placeholderTextColor={theme.colors.outline}
              style={styles.input}
            />
          </View>
        </View>

        {/* Age */}
        <Label>Property Age (years)</Label>
        <TextInput
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="e.g. 3"
          placeholderTextColor={theme.colors.outline}
          style={[styles.input, { marginBottom: 14 }]}
        />

        {/* Condition */}
        <Label>Condition</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {(['new', 'good', 'average', 'poor'] as const).map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCondition(c)}
              style={[styles.chip, condition === c && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  condition === c && styles.chipTextActive,
                  { textTransform: 'capitalize' },
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Possession */}
        <Label>Possession</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {(['ready', 'under-construction'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPossession(p)}
              style={[styles.chip, possession === p && styles.chipActive, { flex: 1 }]}
            >
              <Text
                style={[
                  styles.chipText,
                  possession === p && styles.chipTextActive,
                  { textAlign: 'center' },
                ]}
              >
                {p === 'ready' ? 'Ready to Move' : 'Under Construction'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amenities */}
        <Label>Amenities</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {AMENITY_OPTIONS.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => toggleAmenity(a)}
              style={[styles.chip, amenities.includes(a) && styles.chipActive]}
            >
              <Text style={[styles.chipText, amenities.includes(a) && styles.chipTextActive]}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estimate button */}
        <TouchableOpacity
          onPress={() => {
            if (!city || !area) return;
            setShowResult(true);
          }}
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.roundness.xl,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Estimate Value</Text>
        </TouchableOpacity>

        {/* Result */}
        {showResult && valuation && (
          <View
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.roundness.lg,
              padding: 20,
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>
              Estimated Market Value
            </Text>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 4 }}>
              {formatPrice(valuation.estimatedPrice)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16 }}>
              Range: {formatPrice(valuation.low)} – {formatPrice(valuation.high)}
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: theme.roundness.md,
                padding: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Rate/sq.ft</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                  ₹{Math.round(valuation.pricePerSqft).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>City</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                  {city}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Area</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                  {area} sqft
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              * This is an indicative estimate based on market averages. Actual price may vary.
            </Text>
          </View>
        )}

        {showResult && !valuation && (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: theme.roundness.md,
              padding: 14,
            }}
          >
            <Text style={{ color: '#92400E', fontSize: 13 }}>
              Please select a city and enter the area to get an estimate.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: theme.colors.secondary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.secondary,
    fontSize: 14,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
