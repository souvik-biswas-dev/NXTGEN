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

export default function SignupScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up the user
      // We pass 'name' in user_metadata so the SQL Trigger can find it
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.username, 
          },
        },
      });

      if (authError) throw authError;

      // NOTE: We no longer manually insert into 'users_profiles' here.
      // The Database Trigger handles it instantly on the server side.

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/34533806/pexels-photo-34533806.jpeg ' }}
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
              paddingVertical: 80 
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)');
                }
              }} 
              className="mb-8"
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-3xl font-bold mb-2">Register</Text>
            <Text className="text-white/80 text-base mb-8">Create account</Text>

            {/* Form */}
            <View className="space-y-4">
              <View className="bg-white/90 rounded-2xl px-4 py-4 mb-4">
                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#9CA3AF"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  className="text-gray-900 text-base"
                />
              </View>

              <View className="bg-white/90 rounded-2xl px-4 py-4 mb-4">
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="text-gray-900 text-base"
                />
              </View>

              <View className="bg-white/90 rounded-2xl px-4 py-4 mb-4">
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  className="text-gray-900 text-base"
                />
              </View>

              <View className="bg-white/90 rounded-2xl px-4 py-4 mb-6">
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry
                  className="text-gray-900 text-base"
                />
              </View>

              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="bg-primary rounded-2xl py-4 items-center"
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-semibold">Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}