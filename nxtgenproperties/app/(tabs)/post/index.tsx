import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { BHKType, FurnishingType, PropertyType, PropertyCategory, FacingType, PossessionType } from '@/types';
import { theme } from '@/constants/theme';

type Step = 'basic' | 'details' | 'location' | 'amenities' | 'photos' | 'pricing';

interface PropertyFormData {
  type: PropertyType;
  category: PropertyCategory;
  title: string;
  description: string;
  bhk: BHKType | '';
  furnishing: FurnishingType | '';
  area_sqft: string;
  carpet_area: string;
  floor: string;
  total_floors: string;
  facing: FacingType | '';
  possession: PossessionType;
  age_years: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  parkings: string;
  city: string;
  locality: string;
  address: string;
  amenities: string[];
  photos: string[];
  price: string;
  maintenance: string;
  deposit: string;
  priceNegotiable: boolean;
}

export default function PostPropertyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    type: 'buy' as PropertyType,
    category: 'residential' as PropertyCategory,
    title: '',
    description: '',
    
    // Property Details
    bhk: '' as BHKType | '',
    furnishing: '' as FurnishingType | '',
    area_sqft: '',
    carpet_area: '',
    floor: '',
    total_floors: '',
    facing: '' as FacingType | '',
    possession: 'ready' as PossessionType,
    age_years: '',
    bedrooms: '',
    bathrooms: '',
    kitchens: '',
    parkings: '',
    
    // Location
    city: '',
    locality: '',
    address: '',
    
    // Amenities
    amenities: [] as string[],
    
    // Photos
    photos: [] as string[],
    
    // Pricing
    price: '',
    maintenance: '',
    deposit: '',
    priceNegotiable: true,
  });

  const steps: { id: Step; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'basic', title: 'Basic Info', icon: 'home-outline' },
    { id: 'details', title: 'Details', icon: 'list-outline' },
    { id: 'location', title: 'Location', icon: 'location-outline' },
    { id: 'amenities', title: 'Amenities', icon: 'fitness-outline' },
    { id: 'photos', title: 'Photos', icon: 'camera-outline' },
    { id: 'pricing', title: 'Pricing', icon: 'pricetag-outline' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to post a property.');
      return;
    }
    if (!formData.title.trim()) {
      Alert.alert('Missing Info', 'Please add a property title.');
      setCurrentStep('basic');
      return;
    }
    if (!formData.city || !formData.locality) {
      Alert.alert('Missing Info', 'Please select a city and locality.');
      setCurrentStep('location');
      return;
    }
    if (!formData.price) {
      Alert.alert('Missing Info', 'Please enter a price.');
      setCurrentStep('pricing');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (const localUri of formData.photos) {
        if (localUri.startsWith('http')) {
          // Already a remote URL (demo photos)
          uploadedUrls.push(localUri);
          continue;
        }
        const ext = localUri.split('.').pop() ?? 'jpg';
        const fileName = `properties/${user.user_id}/${Date.now()}_${uploadedUrls.length}.${ext}`;
        const response = await fetch(localUri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }

      // 2. Insert property record into DB
      const { error: insertError } = await supabase.from('properties').insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price.replace(/,/g, '')),
        maintenance: formData.maintenance ? Number(formData.maintenance.replace(/,/g, '')) : null,
        deposit: formData.deposit ? Number(formData.deposit.replace(/,/g, '')) : null,
        type: formData.type,
        category: formData.category,
        bhk: formData.bhk || null,
        furnishing: formData.furnishing || null,
        area_sqft: formData.area_sqft ? Number(formData.area_sqft) : null,
        carpet_area: formData.carpet_area ? Number(formData.carpet_area) : null,
        floor: formData.floor || null,
        total_floors: formData.total_floors || null,
        facing: formData.facing || null,
        possession: formData.possession,
        age_years: formData.age_years ? Number(formData.age_years) : null,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : 0,
        kitchens: formData.kitchens ? Number(formData.kitchens) : 0,
        parkings: formData.parkings ? Number(formData.parkings) : 0,
        city: formData.city,
        locality: formData.locality,
        address: formData.address || null,
        amenities: formData.amenities,
        photos: uploadedUrls,
        owner_id: user.user_id,
        verified: false,
        featured: false,
        price_negotiable: formData.priceNegotiable,
      });
      if (insertError) throw insertError;

      Alert.alert(
        'Property Posted!',
        'Your property has been submitted for review. It will be live within 24 hours.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)') }]
      );
    } catch (err) {
      Alert.alert('Submission Failed', err instanceof Error ? err.message : 'Could not post your property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep formData={formData} updateFormData={updateFormData} />;
      case 'details':
        return <PropertyDetailsStep formData={formData} updateFormData={updateFormData} />;
      case 'location':
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 'amenities':
        return <AmenitiesStep formData={formData} toggleAmenity={toggleAmenity} />;
      case 'photos':
        return <PhotosStep formData={formData} updateFormData={updateFormData} />;
      case 'pricing':
        return <PricingStep formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.push('/(tabs)')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-lg font-bold">Post Property</Text>
          <Text className="text-primary font-medium">
            {currentStepIndex + 1}/{steps.length}
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View className="flex-row mt-4">
          {steps.map((step, index) => (
            <View key={step.id} className="flex-1 flex-row items-center">
              <View 
                className={`h-1 flex-1 rounded-full ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-gray-200'
                }`} 
              />
            </View>
          ))}
        </View>

        {/* Step Indicators */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
          {steps.map((step, index) => (
            <TouchableOpacity
              key={step.id}
              onPress={() => setCurrentStep(step.id)}
              className={`flex-row items-center mr-6 pb-2 ${
                currentStep === step.id ? 'border-b-2 border-primary' : ''
              }`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${
                index < currentStepIndex ? 'bg-green-500' :
                currentStep === step.id ? 'bg-primary' : 'bg-gray-200'
              }`}>
                {index < currentStepIndex ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Ionicons name={step.icon} size={16} color={currentStep === step.id ? 'white' : '#666'} />
                )}
              </View>
              <Text className={`text-sm font-medium ${
                currentStep === step.id ? 'text-primary' : 'text-gray-500'
              }`}>
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Buttons — raised above the floating tab bar */}
        <View className="bg-white px-5 border-t border-gray-100 flex-row"
          style={{ paddingTop: 12, paddingBottom: theme.tabBarHeight }}
        >
          {currentStepIndex > 0 && (
            <TouchableOpacity
              onPress={goToPrevStep}
              className="flex-1 bg-gray-100 rounded-xl py-4 mr-3"
            >
              <Text className="text-gray-700 text-center font-semibold">Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={currentStepIndex === steps.length - 1 ? handleSubmit : goToNextStep}
            disabled={submitting}
            className="flex-1 bg-primary rounded-xl py-4 flex-row items-center justify-center"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-center font-semibold">
                {currentStepIndex === steps.length - 1 ? 'Post Property' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Step Components
const BasicInfoStep: React.FC<{ formData: PropertyFormData; updateFormData: (key: string, value: PropertyFormData[keyof PropertyFormData]) => void }> = ({ 
  formData, 
  updateFormData 
}) => (
  <View className="px-5 py-6">
    {/* Property For */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">I want to</Text>
      <View className="flex-row">
        {(['buy', 'rent'] as PropertyType[]).map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => updateFormData('type', type)}
            className={`flex-1 py-4 rounded-xl mr-2 border-2 ${
              formData.type === type ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-center font-semibold capitalize ${
              formData.type === type ? 'text-primary' : 'text-gray-600'
            }`}>
              {type === 'buy' ? 'Sell' : 'Rent Out'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Category */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Property Category</Text>
      <View className="flex-row">
        {(['residential', 'commercial'] as PropertyCategory[]).map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => updateFormData('category', category)}
            className={`flex-1 py-4 rounded-xl mr-2 border-2 ${
              formData.category === category ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-center font-semibold capitalize ${
              formData.category === category ? 'text-primary' : 'text-gray-600'
            }`}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Title */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Property Title</Text>
      <TextInput
        value={formData.title}
        onChangeText={(text) => updateFormData('title', text)}
        placeholder="e.g., Spacious 3 BHK with Garden View"
        placeholderTextColor="#999"
        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
      />
    </View>

    {/* Description */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Description</Text>
      <TextInput
        value={formData.description}
        onChangeText={(text) => updateFormData('description', text)}
        placeholder="Describe your property in detail..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 min-h-[120px]"
      />
    </View>
  </View>
);

const PropertyDetailsStep: React.FC<{ formData: PropertyFormData; updateFormData: (key: string, value: PropertyFormData[keyof PropertyFormData]) => void }> = ({ 
  formData, 
  updateFormData 
}) => (
  <View className="px-5 py-6">
    {/* BHK */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">BHK Type</Text>
      <View className="flex-row flex-wrap">
        {(['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK'] as BHKType[]).map((bhk) => (
          <TouchableOpacity
            key={bhk}
            onPress={() => updateFormData('bhk', bhk)}
            className={`px-5 py-3 rounded-xl mr-2 mb-2 border-2 ${
              formData.bhk === bhk ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`font-medium ${formData.bhk === bhk ? 'text-primary' : 'text-gray-600'}`}>
              {bhk}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Furnishing */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Furnishing</Text>
      <View className="flex-row flex-wrap">
        {(['furnished', 'semi-furnished', 'unfurnished'] as FurnishingType[]).map((furnishing) => (
          <TouchableOpacity
            key={furnishing}
            onPress={() => updateFormData('furnishing', furnishing)}
            className={`px-5 py-3 rounded-xl mr-2 mb-2 border-2 ${
              formData.furnishing === furnishing ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`font-medium capitalize ${
              formData.furnishing === furnishing ? 'text-primary' : 'text-gray-600'
            }`}>
              {furnishing}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Area */}
    <View className="flex-row mb-6">
      <View className="flex-1 mr-2">
        <Text className="text-gray-900 font-semibold mb-3">Super Built-up Area</Text>
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl">
          <TextInput
            value={formData.area_sqft}
            onChangeText={(text) => updateFormData('area_sqft', text)}
            placeholder="1500"
            placeholderTextColor="#999"
            keyboardType="numeric"
            className="flex-1 px-4 py-4 text-gray-900"
          />
          <Text className="text-gray-500 px-4">sq.ft</Text>
        </View>
      </View>
      <View className="flex-1 ml-2">
        <Text className="text-gray-900 font-semibold mb-3">Carpet Area</Text>
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl">
          <TextInput
            value={formData.carpet_area}
            onChangeText={(text) => updateFormData('carpet_area', text)}
            placeholder="1200"
            placeholderTextColor="#999"
            keyboardType="numeric"
            className="flex-1 px-4 py-4 text-gray-900"
          />
          <Text className="text-gray-500 px-4">sq.ft</Text>
        </View>
      </View>
    </View>

    {/* Floor */}
    <View className="flex-row mb-6">
      <View className="flex-1 mr-2">
        <Text className="text-gray-900 font-semibold mb-3">Floor No.</Text>
        <TextInput
          value={formData.floor}
          onChangeText={(text) => updateFormData('floor', text)}
          placeholder="5"
          placeholderTextColor="#999"
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
        />
      </View>
      <View className="flex-1 ml-2">
        <Text className="text-gray-900 font-semibold mb-3">Total Floors</Text>
        <TextInput
          value={formData.total_floors}
          onChangeText={(text) => updateFormData('total_floors', text)}
          placeholder="15"
          placeholderTextColor="#999"
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
        />
      </View>
    </View>

    {/* Rooms */}
    <View className="flex-row mb-6">
      <View className="flex-1 mr-2">
        <Text className="text-gray-900 font-semibold mb-3">Bedrooms</Text>
        <TextInput
          value={formData.bedrooms}
          onChangeText={(text) => updateFormData('bedrooms', text)}
          placeholder="3"
          placeholderTextColor="#999"
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
        />
      </View>
      <View className="flex-1 ml-2">
        <Text className="text-gray-900 font-semibold mb-3">Bathrooms</Text>
        <TextInput
          value={formData.bathrooms}
          onChangeText={(text) => updateFormData('bathrooms', text)}
          placeholder="2"
          placeholderTextColor="#999"
          keyboardType="numeric"
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
        />
      </View>
    </View>

    {/* Possession */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Possession Status</Text>
      <View className="flex-row">
        {(['ready', 'under-construction'] as PossessionType[]).map((possession) => (
          <TouchableOpacity
            key={possession}
            onPress={() => updateFormData('possession', possession)}
            className={`flex-1 py-4 rounded-xl mr-2 border-2 ${
              formData.possession === possession ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-center font-medium ${
              formData.possession === possession ? 'text-primary' : 'text-gray-600'
            }`}>
              {possession === 'ready' ? 'Ready to Move' : 'Under Construction'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </View>
);

const LocationStep: React.FC<{ formData: PropertyFormData; updateFormData: (key: string, value: PropertyFormData[keyof PropertyFormData]) => void }> = ({
  formData,
  updateFormData
}) => {
  const { popularCities, popularLocalities } = usePropertiesStore();
  return (
  <View className="px-5 py-6">
    {/* City */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">City</Text>
      <View className="flex-row flex-wrap">
        {popularCities.slice(0, 6).map((city) => (
          <TouchableOpacity
            key={city.id}
            onPress={() => updateFormData('city', city.name)}
            className={`px-5 py-3 rounded-xl mr-2 mb-2 border-2 ${
              formData.city === city.name ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`font-medium ${formData.city === city.name ? 'text-primary' : 'text-gray-600'}`}>
              {city.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* Locality */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Locality</Text>
      {formData.city && popularLocalities[formData.city] ? (
        <View className="flex-row flex-wrap">
          {popularLocalities[formData.city].map((locality) => (
            <TouchableOpacity
              key={locality}
              onPress={() => updateFormData('locality', locality)}
              className={`px-5 py-3 rounded-xl mr-2 mb-2 border-2 ${
                formData.locality === locality ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`font-medium ${formData.locality === locality ? 'text-primary' : 'text-gray-600'}`}>
                {locality}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          value={formData.locality}
          onChangeText={(text) => updateFormData('locality', text)}
          placeholder="Enter locality"
          placeholderTextColor="#999"
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
        />
      )}
    </View>

    {/* Full Address */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Full Address</Text>
      <TextInput
        value={formData.address}
        onChangeText={(text) => updateFormData('address', text)}
        placeholder="Building name, street, landmark..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-gray-900 min-h-[100px]"
      />
    </View>

    {/* Map placeholder */}
    <View className="bg-gray-100 rounded-xl h-40 items-center justify-center">
      <Ionicons name="location" size={40} color="#999" />
      <Text className="text-gray-500 mt-2">Map location (coming soon)</Text>
    </View>
  </View>
  );
};

const AmenitiesStep: React.FC<{ formData: PropertyFormData; toggleAmenity: (amenity: string) => void }> = ({
  formData,
  toggleAmenity
}) => {
  const { allAmenities } = usePropertiesStore();
  return (
  <View className="px-5 py-6">
    <Text className="text-gray-900 font-semibold mb-4">Select Amenities</Text>
    <Text className="text-gray-500 text-sm mb-6">
      Choose all the amenities available in your property
    </Text>
    
    <View className="flex-row flex-wrap">
      {allAmenities.map((amenity) => (
        <TouchableOpacity
          key={amenity}
          onPress={() => toggleAmenity(amenity)}
          className={`px-4 py-3 rounded-xl mr-2 mb-3 border-2 flex-row items-center ${
            formData.amenities.includes(amenity) ? 'border-primary bg-orange-50' : 'border-gray-200 bg-white'
          }`}
        >
          <Ionicons 
            name={formData.amenities.includes(amenity) ? 'checkbox' : 'square-outline'} 
            size={18} 
            color={formData.amenities.includes(amenity) ? '#FF6B35' : '#999'} 
          />
          <Text className={`ml-2 font-medium ${
            formData.amenities.includes(amenity) ? 'text-primary' : 'text-gray-600'
          }`}>
            {amenity}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View className="mt-4 p-4 bg-orange-50 rounded-xl flex-row items-center">
      <Ionicons name="information-circle" size={20} color="#FF6B35" />
      <Text className="text-orange-800 text-sm ml-2 flex-1">
        Properties with more amenities get 2x more views
      </Text>
    </View>
  </View>
  );
};

const PhotosStep: React.FC<{ formData: PropertyFormData; updateFormData: (key: string, value: PropertyFormData[keyof PropertyFormData]) => void }> = ({
  formData,
  updateFormData
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to upload photos.');
      return;
    }
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        if (formData.photos.length + result.assets.length > 10) {
          Alert.alert('Limit Reached', 'You can upload a maximum of 10 photos.');
          return;
        }
        // Upload each photo to Supabase Storage immediately
        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          const ext = asset.uri.split('.').pop() ?? 'jpg';
          const fileName = `properties/${user?.user_id ?? 'guest'}/${Date.now()}_${uploadedUrls.length}.${ext}`;
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const arrayBuffer = await new Response(blob).arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
          if (uploadError) {
            Alert.alert('Upload Error', `Failed to upload photo: ${uploadError.message}`);
            continue;
          }
          const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        }
        updateFormData('photos', [...formData.photos, ...uploadedUrls]);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick images');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = formData.photos.filter((_, i) => i !== index);
    updateFormData('photos', updatedPhotos);
  };

  return (
    <View className="px-5 py-6">
      <Text className="text-gray-900 font-semibold mb-4">Add Photos</Text>
      <Text className="text-gray-500 text-sm mb-6">
        Add at least 5 photos for better visibility
      </Text>

      {/* Upload Button */}
      <TouchableOpacity 
        onPress={pickImages}
        disabled={loading}
        className="bg-white border-2 border-dashed border-gray-300 rounded-2xl h-48 items-center justify-center mb-6"
      >
        <View className="items-center">
          <View className="w-16 h-16 bg-orange-50 rounded-full items-center justify-center mb-3">
            <Ionicons name={loading ? "hourglass" : "camera"} size={28} color="#FF6B35" />
          </View>
          <Text className="text-gray-900 font-semibold">{loading ? 'Loading...' : 'Upload Photos'}</Text>
          <Text className="text-gray-500 text-sm mt-1">JPG, PNG up to 10MB each</Text>
          <Text className="text-gray-400 text-xs mt-2">{formData.photos.length}/10 photos</Text>
        </View>
      </TouchableOpacity>

      {/* Uploaded Photos Grid */}
      {formData.photos.length > 0 && (
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Uploaded Photos ({formData.photos.length})</Text>
          <View className="flex-row flex-wrap">
            {formData.photos.map((photo: string, index: number) => (
              <View key={index} className="w-1/3 pr-3 pb-3">
                <View className="relative rounded-xl overflow-hidden bg-gray-200">
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-24"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Photo Guidelines */}
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-gray-900 font-semibold mb-3">Photo Guidelines</Text>
        <View className="space-y-2">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="text-gray-600 ml-2">Use high-quality, well-lit photos</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="text-gray-600 ml-2">Include photos of all rooms</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="text-gray-600 ml-2">Add exterior and view photos</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={18} color="#EF4444" />
            <Text className="text-gray-600 ml-2">Avoid blurry or dark photos</Text>
          </View>
        </View>
      </View>

    </View>
  );
};

const PricingStep: React.FC<{ formData: PropertyFormData; updateFormData: (key: string, value: PropertyFormData[keyof PropertyFormData]) => void }> = ({ 
  formData, 
  updateFormData 
}) => (
  <View className="px-5 py-6">
    {/* Price */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">
        {formData.type === 'buy' ? 'Expected Price' : 'Monthly Rent'}
      </Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl">
        <Text className="text-gray-500 px-4">₹</Text>
        <TextInput
          value={formData.price}
          onChangeText={(text) => updateFormData('price', text)}
          placeholder={formData.type === 'buy' ? '50,00,000' : '25,000'}
          placeholderTextColor="#999"
          keyboardType="numeric"
          className="flex-1 py-4 text-gray-900 text-lg"
        />
      </View>
    </View>

    {/* Maintenance */}
    <View className="mb-6">
      <Text className="text-gray-900 font-semibold mb-3">Maintenance (monthly)</Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl">
        <Text className="text-gray-500 px-4">₹</Text>
        <TextInput
          value={formData.maintenance}
          onChangeText={(text) => updateFormData('maintenance', text)}
          placeholder="5,000"
          placeholderTextColor="#999"
          keyboardType="numeric"
          className="flex-1 py-4 text-gray-900"
        />
      </View>
    </View>

    {/* Deposit (for rent) */}
    {formData.type === 'rent' && (
      <View className="mb-6">
        <Text className="text-gray-900 font-semibold mb-3">Security Deposit</Text>
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl">
          <Text className="text-gray-500 px-4">₹</Text>
          <TextInput
            value={formData.deposit}
            onChangeText={(text) => updateFormData('deposit', text)}
            placeholder="75,000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            className="flex-1 py-4 text-gray-900"
          />
        </View>
      </View>
    )}

    {/* Price Negotiable */}
    <TouchableOpacity
      onPress={() => updateFormData('priceNegotiable', !formData.priceNegotiable)}
      className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-4 mb-6"
    >
      <Text className="text-gray-900 font-medium">Price is negotiable</Text>
      <View className={`w-12 h-7 rounded-full p-1 ${formData.priceNegotiable ? 'bg-primary' : 'bg-gray-200'}`}>
        <View className={`w-5 h-5 rounded-full bg-white shadow ${formData.priceNegotiable ? 'ml-auto' : ''}`} />
      </View>
    </TouchableOpacity>

    {/* Summary Card */}
    <LinearGradient
      colors={['#FF6B35', '#0F1923']}
      className="rounded-2xl p-5"
    >
      <Text className="text-white/80 text-sm mb-2">Property Summary</Text>
      <Text className="text-white text-2xl font-bold mb-4">
        {formData.title || 'Your Property'}
      </Text>
      <View className="flex-row flex-wrap">
        {formData.bhk && (
          <View className="bg-white/20 px-3 py-1 rounded-full mr-2 mb-2">
            <Text className="text-white text-sm">{formData.bhk}</Text>
          </View>
        )}
        {formData.city && (
          <View className="bg-white/20 px-3 py-1 rounded-full mr-2 mb-2">
            <Text className="text-white text-sm">{formData.city}</Text>
          </View>
        )}
        {formData.furnishing && (
          <View className="bg-white/20 px-3 py-1 rounded-full mr-2 mb-2">
            <Text className="text-white text-sm capitalize">{formData.furnishing}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  </View>
);
