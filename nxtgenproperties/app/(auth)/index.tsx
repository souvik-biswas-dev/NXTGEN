import React, { useState, useEffect } from 'react';
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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { auth } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { phoneSchema, firstError } from '@/lib/validation';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  (Constants.expoConfig?.extra?.googleClientId as string) ||
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Native Google sign-in → returns an id_token we exchange with our backend.
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    const idToken = response?.type === 'success' ? response.params?.id_token : undefined;
    if (!idToken) {
      if (response && response.type !== 'success') setGoogleLoading(false);
      return;
    }
    (async () => {
      try {
        const user = await auth.google(idToken);
        useAuthStore.getState().setUser(user);
        router.replace('/(tabs)');
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Google login failed.');
      } finally {
        setGoogleLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handlePhoneAuth = async () => {
    // Accept 10-digit national or +91-prefixed. Normalise to E.164.
    const raw = phoneNumber.trim();
    const parsed = phoneSchema.safeParse(raw);
    if (!parsed.success) {
      Alert.alert('Invalid number', firstError(parsed.error));
      return;
    }
    const fullPhone = raw.startsWith('+') ? raw : `+91${raw.replace(/^91/, '')}`;

    setLoading(true);
    try {
      await auth.requestOtp(fullPhone);
      router.push({ pathname: '/(auth)/verify', params: { phone: fullPhone } });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) {
      Alert.alert('Not configured', 'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.');
      return;
    }
    setGoogleLoading(true);
    await promptAsync();
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
              <Text className="text-white/80 text-base">Login to your account</Text>
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
              className="bg-primary rounded-2xl py-4 items-center mb-3"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">Continue</Text>
              )}
            </TouchableOpacity>

            <Text className="text-white/80 text-center mb-6">
              We'll send an OTP for verification
            </Text>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-white/30" />
              <Text className="text-white/70 mx-3 text-sm">or</Text>
              <View className="flex-1 h-px bg-white/30" />
            </View>

            {/* Sign in with Email */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/email-login' as never)}
              className="bg-white/15 border border-white/40 rounded-2xl py-4 flex-row items-center justify-center mb-4"
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={22} color="white" />
              <Text className="text-white text-base font-semibold ml-3">Sign in with Email</Text>
            </TouchableOpacity>

            {/* Google */}
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
                    Continue with Google
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
