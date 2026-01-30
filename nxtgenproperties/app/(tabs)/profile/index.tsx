import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [notifications, setNotifications] = React.useState({
    matched: true,
    newLaunched: false,
    propertyNews: false,
  });

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-primary text-2xl font-bold">Settings</Text>
        </View>

        {/* Profile Card */}
        <View className="bg-white mx-6 rounded-2xl p-4 flex-row items-center mb-6">
          <Image
            source={{ uri: user?.avatar_url || 'https://via.placeholder.com/80' }}
            className="w-16 h-16 rounded-full"
          />
          <View className="flex-1 ml-4">
            <Text className="text-gray-900 text-lg font-bold">{user?.name || 'Stella French'}</Text>
          </View>
          <TouchableOpacity className="bg-primary rounded-full p-3">
            <Ionicons name="pencil" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* My Listing */}
        <View className="bg-white mx-6 rounded-2xl mb-6">
          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <Text className="text-gray-900 text-base font-medium">My Listing</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View className="bg-white mx-6 rounded-2xl mb-6">
          <View className="px-4 py-3">
            <Text className="text-gray-500 text-xs font-medium uppercase">ABOUT</Text>
          </View>

          <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">Terms of use</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View className="bg-white mx-6 rounded-2xl mb-6">
          <View className="px-4 py-3">
            <Text className="text-gray-500 text-xs font-medium uppercase">
              Manage Notification
            </Text>
          </View>

          <View className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">For Matched Properties</Text>
            <Switch
              value={notifications.matched}
              onValueChange={(value) =>
                setNotifications({ ...notifications, matched: value })
              }
              trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
              thumbColor="white"
            />
          </View>

          <View className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">For New Launched Properties</Text>
            <Switch
              value={notifications.newLaunched}
              onValueChange={(value) =>
                setNotifications({ ...notifications, newLaunched: value })
              }
              trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
              thumbColor="white"
            />
          </View>

          <View className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">For Property News</Text>
            <Switch
              value={notifications.propertyNews}
              onValueChange={(value) =>
                setNotifications({ ...notifications, propertyNews: value })
              }
              trackColor={{ false: '#E5E7EB', true: '#FF6B35' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* App Section */}
        <View className="bg-white mx-6 rounded-2xl mb-6">
          <View className="px-4 py-3">
            <Text className="text-gray-500 text-xs font-medium uppercase">APP</Text>
          </View>

          <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">Report a Bug</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-row items-center justify-between px-4 py-4 border-t border-gray-100">
            <Text className="text-gray-900 text-base">App Version 1.0</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white mx-6 rounded-2xl mb-6 flex-row items-center px-4 py-4"
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B35" />
          <Text className="text-primary text-base font-medium ml-3">Logout</Text>
        </TouchableOpacity>

        {/* FAB */}
        <TouchableOpacity className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg">
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
