import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { VerificationRequestCard } from '@/components/BrokerBadge';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [notifications, setNotifications] = React.useState({
    matched: true,
    newLaunched: false,
    propertyNews: false,
  });

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    Alert.alert('Edit Profile', 'Feature coming soon!');
  };

  // Mock stats - replace with real data from your store/API
  const stats = {
    listings: user?.role === 'owner' || user?.role === 'broker' ? 12 : 0,
    favorites: 8,
    views: user?.role === 'broker' ? 1240 : 0,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo with Gradient */}
        <View className="relative">
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-40"
          />
          
          {/* Settings Icon */}
          <TouchableOpacity className="absolute top-4 right-4 bg-white/20 rounded-full p-2">
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Profile Info Card */}
        <View className="px-6 -mt-20">
          <View className="bg-white rounded-3xl shadow-lg p-6">
            {/* Avatar and Edit Button */}
            <View className="items-center -mt-16 mb-4">
              <View className="relative">
                <Image
                  source={{ 
                    uri: user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&size=200&background=FF6B35&color=fff'
                  }}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-md"
                />
                <TouchableOpacity 
                  onPress={handleEditProfile}
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2.5 border-4 border-white"
                >
                  <Ionicons name="camera" size={18} color="white" />
                </TouchableOpacity>
              </View>

              {/* Name and Email */}
              <Text className="text-gray-900 text-2xl font-bold mt-4">
                {user?.name || 'Stella French'}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {user?.email || 'stella@example.com'}
              </Text>

              {/* Role Badge */}
              <View className="mt-3 px-4 py-1.5 bg-primary/10 rounded-full">
                <Text className="text-primary text-xs font-semibold capitalize">
                  {user?.role || 'Buyer'}
                </Text>
              </View>

              {/* Broker Verification Badge */}
              {user?.role === 'broker' && (
                <View className="mt-2 flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full">
                  <Ionicons name="shield-checkmark" size={16} color="#3B82F6" />
                  <Text className="text-blue-600 text-xs font-medium ml-1">
                    Verified Broker
                  </Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-around border-t border-gray-100 pt-5 mt-2">
              {user?.role !== 'buyer' && (
                <View className="items-center">
                  <Text className="text-gray-900 text-xl font-bold">{stats.listings}</Text>
                  <Text className="text-gray-500 text-xs mt-1">Listings</Text>
                </View>
              )}
              <View className="items-center">
                <Text className="text-gray-900 text-xl font-bold">{stats.favorites}</Text>
                <Text className="text-gray-500 text-xs mt-1">Favorites</Text>
              </View>
              {user?.role === 'broker' && (
                <View className="items-center">
                  <Text className="text-gray-900 text-xl font-bold">{stats.views}</Text>
                  <Text className="text-gray-500 text-xs mt-1">Profile Views</Text>
                </View>
              )}
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity 
              onPress={handleEditProfile}
              className="mt-5 bg-primary rounded-xl py-3.5 flex-row items-center justify-center"
            >
              <Ionicons name="pencil" size={18} color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Broker Verification Card - Show for brokers who aren't verified */}
        {user?.role === 'broker' && !user?.verified_broker && (
          <VerificationRequestCard 
            onRequest={() => {
              Alert.alert(
                'Verification Request',
                'To get verified, you need to submit:\n\n• RERA Registration Number\n• Government ID Proof\n• Address Proof\n• Business Registration (if applicable)\n\nOur team will review your documents within 2-3 business days.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Start Verification', onPress: () => Alert.alert('Success', 'Verification request submitted! You will receive an email with next steps.') }
                ]
              );
            }}
          />
        )}

        {/* Verified Broker Benefits */}
        {user?.role === 'broker' && user?.verified_broker && (
          <View className="px-4 mt-4">
            <View className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4">
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-2">
                  <Ionicons name="shield-checkmark" size={24} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-bold text-lg">Verified Broker</Text>
                  <Text className="text-white/80 text-sm">Your profile is trusted by buyers</Text>
                </View>
              </View>
              <View className="flex-row mt-4">
                <View className="flex-1 bg-white/20 rounded-xl p-3 mr-2">
                  <Text className="text-white text-xl font-bold">3x</Text>
                  <Text className="text-white/80 text-xs">More Leads</Text>
                </View>
                <View className="flex-1 bg-white/20 rounded-xl p-3 mr-2">
                  <Text className="text-white text-xl font-bold">Top</Text>
                  <Text className="text-white/80 text-xs">Search Rank</Text>
                </View>
                <View className="flex-1 bg-white/20 rounded-xl p-3">
                  <Text className="text-white text-xl font-bold">Badge</Text>
                  <Text className="text-white/80 text-xs">On Listings</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* My Activity Section */}
        {user?.role !== 'buyer' && (
          <View className="px-6 mt-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">My Activity</Text>
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <MenuItem
                icon="home-outline"
                label="My Listings"
                onPress={() => Alert.alert('My Listings', 'Feature coming soon!')}
                showBorder
              />
              <MenuItem
                icon="bar-chart-outline"
                label="Performance"
                badge="New"
                onPress={() => Alert.alert('Performance', 'Feature coming soon!')}
                showBorder
              />
              <MenuItem
                icon="time-outline"
                label="Recent Activity"
                onPress={() => Alert.alert('Recent Activity', 'Feature coming soon!')}
              />
            </View>
          </View>
        )}

        {/* Favorites & Saved */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Saved & Favorites</Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <MenuItem
              icon="heart-outline"
              label="Favorite Properties"
              count={stats.favorites}
              onPress={() => router.push('/shortlist')}
              showBorder
            />
            <MenuItem
              icon="bookmark-outline"
              label="Saved Searches"
              onPress={() => Alert.alert('Saved Searches', 'Feature coming soon!')}
              showBorder
            />
            <MenuItem
              icon="eye-outline"
              label="Recently Viewed"
              onPress={() => Alert.alert('Recently Viewed', 'Feature coming soon!')}
            />
          </View>
        </View>

        {/* Notifications */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Notifications</Text>
          <View className="bg-white rounded-2xl shadow-sm">
            <SwitchItem
              label="Matched Properties"
              value={notifications.matched}
              onValueChange={(value) =>
                setNotifications({ ...notifications, matched: value })
              }
              showBorder
            />
            <SwitchItem
              label="New Launched Properties"
              value={notifications.newLaunched}
              onValueChange={(value) =>
                setNotifications({ ...notifications, newLaunched: value })
              }
              showBorder
            />
            <SwitchItem
              label="Property News & Updates"
              value={notifications.propertyNews}
              onValueChange={(value) =>
                setNotifications({ ...notifications, propertyNews: value })
              }
            />
          </View>
        </View>

        {/* Settings & Support */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Settings & Support</Text>
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <MenuItem
              icon="lock-closed-outline"
              label="Privacy Policy"
              onPress={() => Alert.alert('Privacy Policy', 'Feature coming soon!')}
              showBorder
            />
            <MenuItem
              icon="document-text-outline"
              label="Terms of Use"
              onPress={() => Alert.alert('Terms of Use', 'Feature coming soon!')}
              showBorder
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => Alert.alert('Help & Support', 'Feature coming soon!')}
              showBorder
            />
            <MenuItem
              icon="bug-outline"
              label="Report a Bug"
              onPress={() => Alert.alert('Report Bug', 'Feature coming soon!')}
              showBorder
            />
            <MenuItem
              icon="information-circle-outline"
              label="App Version"
              rightText="1.0.0"
            />
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-2xl shadow-sm flex-row items-center justify-center py-4 border border-red-100"
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="text-red-500 text-base font-semibold ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable MenuItem Component
interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  showBorder?: boolean;
  rightText?: string;
  count?: number;
  badge?: string;
}

function MenuItem({ 
  icon, 
  label, 
  onPress, 
  showBorder, 
  rightText, 
  count,
  badge 
}: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${
        showBorder ? 'border-b border-gray-100' : ''
      }`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name={icon} size={20} color="#6B7280" />
        </View>
        <Text className="text-gray-900 text-base ml-3 flex-1">{label}</Text>
        
        {badge && (
          <View className="bg-primary px-2 py-0.5 rounded-full mr-2">
            <Text className="text-white text-xs font-semibold">{badge}</Text>
          </View>
        )}
        
        {count !== undefined && (
          <View className="bg-gray-100 px-2.5 py-0.5 rounded-full mr-2">
            <Text className="text-gray-600 text-xs font-semibold">{count}</Text>
          </View>
        )}
        
        {rightText && (
          <Text className="text-gray-400 text-sm mr-2">{rightText}</Text>
        )}
      </View>
      
      {onPress && <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />}
    </TouchableOpacity>
  );
}

// Reusable SwitchItem Component
interface SwitchItemProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showBorder?: boolean;
}

function SwitchItem({ label, value, onValueChange, showBorder }: SwitchItemProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${
        showBorder ? 'border-b border-gray-100' : ''
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons 
            name={value ? "notifications" : "notifications-outline"} 
            size={20} 
            color={value ? "#FF6B35" : "#6B7280"} 
          />
        </View>
        <Text className="text-gray-900 text-base ml-3">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
        thumbColor={value ? '#FF6B35' : '#F3F4F6'}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}