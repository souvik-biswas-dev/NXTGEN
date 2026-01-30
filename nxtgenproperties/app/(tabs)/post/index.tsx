import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4">
        <Text className="text-primary text-2xl font-bold">Post Property</Text>
      </View>

      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-6 items-center justify-center" style={{ height: 400 }}>
          <Ionicons name="home-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-900 text-xl font-bold mt-4 mb-2">
            Post Your Property
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Create a listing to reach thousands of potential buyers and renters
          </Text>
          <TouchableOpacity className="bg-primary rounded-xl px-6 py-3">
            <Text className="text-white font-semibold">Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
