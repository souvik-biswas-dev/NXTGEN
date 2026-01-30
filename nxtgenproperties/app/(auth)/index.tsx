import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const countries = [
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Afghanistan', code: '+93', flag: '🇦🇫' },
    { name: 'Albania', code: '+355', flag: '🇦🇱' },
    { name: 'Algeria', code: '+213', flag: '🇩🇿' },
  ];

  const handlePhoneAuth = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${phoneNumber}`;
      console.log('Sending OTP to:', fullPhone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) throw error;

      router.push({
        pathname: '/(auth)/verify',
        params: { phone: fullPhone },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/4878949/pexels-photo-4878949.jpeg' }}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/40">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View className="items-center mb-12">
              <Text className="text-white text-4xl font-bold">Nxt Gen Properties</Text>
            </View>

            {/* Welcome Text */}
            <View className="mb-8">
              <Text className="text-white text-3xl font-bold mb-2">Welcome back</Text>
              <Text className="text-white/80 text-base">Login your account</Text>
            </View>

            {/* Phone Input */}
            <View className="mb-6">
              <View className="bg-white/90 rounded-2xl flex-row items-center px-4 py-4">
                <TouchableOpacity
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                  className="flex-row items-center mr-3"
                >
                  <Text className="text-xl mr-1">🇺🇸</Text>
                  <Text className="text-gray-700 font-medium">{countryCode}</Text>
                </TouchableOpacity>
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  className="flex-1 text-gray-900 text-base"
                />
              </View>

              {showCountryPicker && (
                <View className="bg-white rounded-2xl mt-2 p-2 max-h-48">
                  <ScrollView>
                    {countries.map((country) => (
                      <TouchableOpacity
                        key={country.code}
                        onPress={() => {
                          setCountryCode(country.code);
                          setShowCountryPicker(false);
                        }}
                        className="flex-row items-center p-3 border-b border-gray-100"
                      >
                        <Text className="text-xl mr-3">{country.flag}</Text>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">{country.name}</Text>
                          <Text className="text-gray-500 text-sm">{country.code}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handlePhoneAuth}
              disabled={loading}
              className="bg-primary rounded-2xl py-4 items-center mb-4"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">Continue</Text>
              )}
            </TouchableOpacity>

            <Text className="text-white/80 text-center mb-6">
              We'll send otp for verification
            </Text>

            {/* Social Login */}
            <TouchableOpacity
              className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center mb-4"
              activeOpacity={0.8}
            >
              <Ionicons name="logo-facebook" size={24} color="white" />
              <Text className="text-white text-base font-semibold ml-3">
                Log in with Facebook
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              className="bg-white rounded-2xl py-4 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={24} color="#EA4335" />
              <Text className="text-gray-900 text-base font-semibold ml-3">
                Log in with Google
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}
