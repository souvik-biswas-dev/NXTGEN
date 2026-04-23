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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { loginSchema, phoneSchema, firstError } from '@/lib/validation';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handlePhoneAuth = async () => {
    // Accept 10-digit national or +91-prefixed. Normalise to E.164 for Supabase.
    const raw = phoneNumber.trim();
    const parsed = phoneSchema.safeParse(raw);
    if (!parsed.success) {
      Alert.alert('Invalid number', firstError(parsed.error));
      return;
    }
    const fullPhone = raw.startsWith('+') ? raw.slice(1) : `91${raw.replace(/^91/, '')}`;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) throw error;

      router.push({
        pathname: '/(auth)/verify',
        params: { phone: `+${fullPhone}` },
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      Alert.alert('Check your details', firstError(parsed.error));
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Email login failed. Please try again.'
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'nxtgenproperties://auth/callback',
        },
      });

      if (error) throw error;
      if (data?.url) {
        await Linking.openURL(data.url);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Google login failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
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
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
              paddingVertical: 80,
            }}
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

            {/* Phone Input - India Only */}
            <View className="mb-6">
              <View className="bg-white/90 rounded-2xl flex-row items-center px-4 py-4">
                <View className="flex-row items-center mr-3 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Text className="text-xl mr-1">🇮🇳</Text>
                  <Text className="text-gray-700 font-medium">+91</Text>
                </View>
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={10}
                  className="flex-1 text-gray-900 text-base"
                />
              </View>
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

            <Text className="text-white/80 text-center mb-6">We'll send otp for verification</Text>

            {/* Email/password login */}
            <View className="mb-6">
              <Text className="text-white/80 text-center mb-3">Or log in with email</Text>
              <View className="bg-white/90 rounded-2xl px-4 py-4 mb-3">
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="text-gray-900 text-base"
                />
              </View>
              <View className="bg-white/90 rounded-2xl px-4 py-4 mb-3">
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="text-gray-900 text-base"
                />
              </View>
              <TouchableOpacity
                onPress={handleEmailLogin}
                disabled={emailLoading}
                className="bg-primary rounded-2xl py-4 items-center"
                activeOpacity={0.8}
              >
                {emailLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-semibold">Log in with Email</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Social Login */}
            <TouchableOpacity
              className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center mb-4"
              activeOpacity={0.8}
            >
              <Ionicons name="logo-facebook" size={24} color="white" />
              <Text className="text-white text-base font-semibold ml-3">Log in with Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              className="bg-white rounded-2xl py-4 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#EA4335" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                  <Text className="text-gray-900 text-base font-semibold ml-3">
                    Log in with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <View className="mt-8 items-center">
              <Text className="text-white/80">
                Don&apos;t have an account?{' '}
                <Text
                  className="text-primary font-semibold"
                  onPress={() => router.push('/(auth)/signup')}
                >
                  Register
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}
