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
import { loginSchema, firstError } from '@/lib/validation';

export default function EmailLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      Alert.alert('Check your details', firstError(parsed.error));
      return;
    }

    setLoading(true);
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
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 24,
              paddingVertical: 80,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/20 rounded-full w-10 h-10 items-center justify-center mb-6"
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>

            {/* Logo */}
            <View className="items-center mb-10">
              <Text className="text-white text-4xl font-bold">Nxt Gen Properties</Text>
            </View>

            {/* Welcome Text */}
            <View className="mb-8">
              <Text className="text-white text-3xl font-bold mb-2">Sign in with Email</Text>
              <Text className="text-white/80 text-base">
                Use your email and password to continue
              </Text>
            </View>

            {/* Email */}
            <View className="bg-white/90 rounded-2xl flex-row items-center px-4 py-4 mb-4">
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-3 text-gray-900 text-base"
              />
            </View>

            {/* Password */}
            <View className="bg-white/90 rounded-2xl flex-row items-center px-4 py-4 mb-6">
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 ml-3 text-gray-900 text-base"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Sign in */}
            <TouchableOpacity
              onPress={handleEmailLogin}
              disabled={loading}
              className="bg-primary rounded-2xl py-4 items-center mb-4"
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Switch to phone */}
            <TouchableOpacity
              onPress={() => router.replace('/(auth)')}
              className="py-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white/90 text-sm">Use phone number instead</Text>
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
