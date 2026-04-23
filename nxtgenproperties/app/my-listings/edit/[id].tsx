import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useAuthStore } from '@/stores/authStore';
import { uploadImage } from '@/lib/uploads';
import { Property } from '@/types';
import { theme } from '@/constants/theme';

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getPropertyById, updateProperty, allAmenities } = usePropertiesStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [deposit, setDeposit] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [kitchens, setKitchens] = useState('');
  const [parkings, setParkings] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const p = await getPropertyById(id);
      if (!p) {
        Alert.alert('Not found', 'This listing no longer exists.');
        router.back();
        return;
      }
      setProperty(p);
      setTitle(p.title);
      setDescription(p.description);
      setPrice(String(p.price));
      setMaintenance(p.maintenance ? String(p.maintenance) : '');
      setDeposit(p.deposit ? String(p.deposit) : '');
      setAreaSqft(String(p.area_sqft));
      setLocality(p.locality);
      setCity(p.city);
      setAddress(p.address || '');
      setBedrooms(String(p.bedrooms));
      setBathrooms(String(p.bathrooms));
      setKitchens(String(p.kitchens));
      setParkings(String(p.parkings));
      setAmenities(p.amenities || []);
      setPhotos(p.photos || []);
      setFeatured(p.featured);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Allow photo access to add images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !user?.user_id) return;
    if (photos.length + result.assets.length > 10) {
      Alert.alert('Limit reached', 'Maximum 10 photos.');
      return;
    }
    const newUrls: string[] = [];
    for (const asset of result.assets) {
      try {
        const url = await uploadImage({
          localUri: asset.uri,
          bucket: 'property-images',
          userId: user.user_id,
          prefix: 'properties',
        });
        newUrls.push(url);
      } catch (err) {
        Alert.alert('Upload error', err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setPhotos((prev) => [...prev, ...newUrls]);
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const toInt = (s: string) => {
    const n = Number(String(s).replace(/,/g, ''));
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  };

  const handleSave = async () => {
    if (!property) return;
    if (!title.trim() || !price.trim() || !city.trim() || !locality.trim()) {
      Alert.alert('Missing info', 'Title, price, city and locality are required.');
      return;
    }
    setSaving(true);
    try {
      await updateProperty(property.id, {
        title: title.trim(),
        description: description.trim(),
        price: toInt(price),
        maintenance: maintenance ? toInt(maintenance) : undefined,
        deposit: deposit ? toInt(deposit) : undefined,
        area_sqft: toInt(areaSqft),
        locality: locality.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        bedrooms: toInt(bedrooms),
        bathrooms: toInt(bathrooms),
        kitchens: toInt(kitchens),
        parkings: toInt(parkings),
        amenities,
        photos,
        featured,
      });
      Alert.alert('Saved', 'Your listing has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
          Edit Listing
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text
            style={{
              color: saving ? theme.colors.outlineVariant : theme.colors.primary,
              fontWeight: '700',
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Field label="Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={inputStyle}
            placeholderTextColor={theme.colors.outline}
          />
        </Field>
        <Field label="Description">
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            style={[inputStyle, { minHeight: 100, textAlignVertical: 'top' }]}
            placeholderTextColor={theme.colors.outline}
          />
        </Field>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Price (₹)">
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Area (sqft)">
              <TextInput
                value={areaSqft}
                onChangeText={setAreaSqft}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Maintenance">
              <TextInput
                value={maintenance}
                onChangeText={setMaintenance}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Deposit">
              <TextInput
                value={deposit}
                onChangeText={setDeposit}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="City">
              <TextInput value={city} onChangeText={setCity} style={inputStyle} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Locality">
              <TextInput value={locality} onChangeText={setLocality} style={inputStyle} />
            </Field>
          </View>
        </View>

        <Field label="Full Address">
          <TextInput
            value={address}
            onChangeText={setAddress}
            multiline
            style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
          />
        </Field>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Bedrooms">
              <TextInput
                value={bedrooms}
                onChangeText={setBedrooms}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Bathrooms">
              <TextInput
                value={bathrooms}
                onChangeText={setBathrooms}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="Kitchens">
              <TextInput
                value={kitchens}
                onChangeText={setKitchens}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Parkings">
              <TextInput
                value={parkings}
                onChangeText={setParkings}
                keyboardType="numeric"
                style={inputStyle}
              />
            </Field>
          </View>
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.secondary,
            marginTop: 8,
            marginBottom: 8,
          }}
        >
          Amenities
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(allAmenities.length > 0 ? allAmenities : amenities).map((a) => {
            const on = amenities.includes(a);
            return (
              <TouchableOpacity
                key={a}
                onPress={() => toggleAmenity(a)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: theme.roundness.full,
                  borderWidth: 1,
                  borderColor: on ? theme.colors.primary : theme.colors.outlineVariant,
                  backgroundColor: on ? theme.colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: on ? '#fff' : theme.colors.secondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {a}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.secondary,
            marginBottom: 8,
          }}
        >
          Photos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {photos.map((uri, idx) => (
            <View key={idx} style={{ position: 'relative' }}>
              <Image
                source={{ uri }}
                style={{ width: 100, height: 100, borderRadius: theme.roundness.md }}
              />
              <TouchableOpacity
                onPress={() => removePhoto(idx)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: theme.colors.error,
                  borderRadius: theme.roundness.full,
                  padding: 4,
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={pickImages}
            style={{
              width: 100,
              height: 100,
              borderRadius: theme.roundness.md,
              borderWidth: 2,
              borderColor: theme.colors.outlineVariant,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={28} color={theme.colors.outline} />
            <Text style={{ fontSize: 11, color: theme.colors.outline, marginTop: 2 }}>Add</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.colors.surfaceVariant,
            padding: 12,
            borderRadius: theme.roundness.md,
            marginTop: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: theme.colors.secondary }}>
              Featured listing
            </Text>
            <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 2 }}>
              Requires Gold plan
            </Text>
          </View>
          <Switch value={featured} onValueChange={setFeatured} />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            borderRadius: theme.roundness.xl,
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.outline,
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
