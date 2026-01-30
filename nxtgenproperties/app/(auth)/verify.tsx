import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });
      if (error) throw error;
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/34533806/pexels-photo-34533806.jpeg' }}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/40">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="pt-16 px-6">
            <TouchableOpacity onPress={() => router.back()} className="mb-8">
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <Text className="text-white text-3xl font-bold mb-2">Verification</Text>
            <Text className="text-white/80 text-base mb-8">
              Enter the otp code from the phone we just sent you
            </Text>
          </View>

          {/* OTP Input */}
          <View className="px-6 flex-row justify-center space-x-3 mb-8">
            {otp.map((digit, index) => (
              <View
                key={index}
                className="bg-white/20 border-2 border-primary rounded-2xl w-14 h-16 items-center justify-center"
              >
                <TextInput
                  ref={(ref) => {(inputs.current[index] = ref)}}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="text-white text-2xl font-bold text-center w-full h-full"
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>

          {loading && (
            <View className="bg-white rounded-2xl mx-6 p-6 items-center mb-6">
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text className="text-gray-700 mt-3">Please wait...</Text>
            </View>
          )}

          {/* Resend */}
          <View className="px-6 flex-row items-center justify-center mb-8">
            <Text className="text-white/80">Didn't receive otp code? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text className="text-primary font-bold">Resend</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <View className="px-6">
            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading}
              className="bg-primary rounded-2xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-semibold">Continue</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}