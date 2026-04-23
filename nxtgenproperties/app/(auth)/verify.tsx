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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input on entry
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current box is empty, move focus back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      } else {
        // Current box has content, just clear it
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
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
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
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
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Something went wrong');
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

            <Text className="text-white text-3xl font-bold mb-2">Verification</Text>
            <Text className="text-white/80 text-base mb-8">
              Enter the otp code from the phone we just sent you
            </Text>
          </View>

          {/* OTP Input */}
          <View className="px-6 mb-8">
            <View className="flex-row justify-between">
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = digit !== '';
                return (
                  <View
                    key={index}
                    className={`rounded-2xl w-13 h-16 items-center justify-center ${
                      isFilled
                        ? 'bg-white/30 border-2 border-primary'
                        : isFocused
                          ? 'bg-white/20 border-2 border-white'
                          : 'bg-white/10 border border-white/30'
                    }`}
                    style={{ width: 52, height: 64 }}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      className="text-white text-2xl font-bold text-center w-full h-full"
                      selectTextOnFocus
                      caretHidden
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {loading && (
            <View
              className="rounded-2xl mx-6 p-5 items-center mb-6 border border-white/30"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text className="text-white/90 mt-3 font-medium text-base">Verifying...</Text>
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
