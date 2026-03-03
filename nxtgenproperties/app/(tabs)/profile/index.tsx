import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { VerificationRequestCard } from '@/components/BrokerBadge';
import { theme } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuthStore();
  const { favorites, fetchFavorites } = useFavoritesStore();
  const [notifications, setNotifications] = React.useState({
    matched: true,
    newLaunched: false,
    propertyNews: false,
  });
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const fileName = `avatars/${user!.user_id}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: urlData.publicUrl });
    } catch (err) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not upload photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

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
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    listings: user?.role === 'owner' || user?.role === 'broker' ? 12 : 0,
    favorites: favorites.size,
    views: user?.role === 'broker' ? 1240 : 0,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Cover Photo with Gradient */}
        <View className="relative">
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-40"
          />
          
          {/* Settings Icon */}
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            className="absolute top-4 right-4 bg-white/20 rounded-full p-2"
          >
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
                  className="w-28 h-28 rounded-full shadow-md"
                  style={{ borderWidth: 4, borderColor: theme.colors.primaryContainer, backgroundColor: theme.colors.primaryContainer }}
                  fadeDuration={0}
                />
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2.5 border-4 border-white"
                >
                  {avatarUploading
                    ? <ActivityIndicator size="small" color="white" />
                    : <Ionicons name="camera" size={18} color="white" />}
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
                <View className="mt-2 flex-row items-center bg-orange-50 px-3 py-1.5 rounded-full">
                  <Ionicons name="shield-checkmark" size={16} color="#FF6B35" />
                  <Text className="text-primary text-xs font-medium ml-1">
                    Verified Broker
                  </Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-around pt-5 mt-3 mx-2 pb-4" style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg }}>
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
              className="mt-5 py-3.5 flex-row items-center justify-center"
              style={{ backgroundColor: theme.colors.primary, borderRadius: theme.roundness.xl }}
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
                onPress={() => router.push('/(tabs)/post')}
                showBorder
              />
              <MenuItem
                icon="bar-chart-outline"
                label="Performance"
                badge="New"
                onPress={() => router.push('/insights' as any)}
                showBorder
              />
              <MenuItem
                icon="time-outline"
                label="Recent Activity"
                onPress={() => router.push('/(tabs)/search')}
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
              onPress={() => router.push('/(tabs)/favorite')}
              showBorder
            />
            <MenuItem
              icon="bookmark-outline"
              label="Saved Searches"
              onPress={() => router.push('/(tabs)/search')}
              showBorder
            />
            <MenuItem
              icon="eye-outline"
              label="Recently Viewed"
              onPress={() => router.push('/(tabs)/search')}
              showBorder
            />
            <MenuItem
              icon="ribbon-outline"
              label="View Plans"
              onPress={() => router.push('/membership' as any)}
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
              onPress={() => Linking.openURL('https://nxtgenproperties.com/privacy')}
              showBorder
            />
            <MenuItem
              icon="document-text-outline"
              label="Terms of Use"
              onPress={() => Linking.openURL('https://nxtgenproperties.com/terms')}
              showBorder
            />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => router.push('/help' as any)}
              showBorder
            />
            <MenuItem
              icon="bug-outline"
              label="Report a Bug"
              onPress={() => Linking.openURL('mailto:bugs@nxtgenproperties.com?subject=Bug%20Report')}
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
            className="shadow-sm flex-row items-center justify-center py-4"
            style={{ backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, borderWidth: 1, borderColor: theme.colors.error + '30' }}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="text-red-500 text-base font-semibold ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Extra padding for floating tab bar */}
        <View style={{ height: theme.tabBarHeight + 16 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: theme.colors.secondary }}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text className={`font-semibold`} style={{ color: saving ? theme.colors.outlineVariant : theme.colors.primary }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
            {/* Avatar */}
            <View className="items-center mb-8">
              <View className="relative">
                <Image
                  source={{
                    uri: user?.avatar_url || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User') + '&size=200&background=FF6B35&color=fff'
                  }}
                  className="w-24 h-24 rounded-full"
                  style={{ borderWidth: 4, borderColor: theme.colors.primaryContainer }}
                />
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-white"
                >
                  {avatarUploading
                    ? <ActivityIndicator size="small" color="white" />
                    : <Ionicons name="camera" size={16} color="white" />}
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 text-xs mt-2">Tap camera to change photo</Text>
            </View>

            {/* Full Name */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>Full Name</Text>
              <TextInput
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                className="px-4 py-3 text-base"
                style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg, color: theme.colors.secondary }}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.outline}
              />
            </View>

            {/* Email (read-only) */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>Email</Text>
              <View className="px-4 py-3" style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg }}>
                <Text className="text-base" style={{ color: theme.colors.outline }}>{user?.email || 'Not set'}</Text>
              </View>
              <Text className="text-xs mt-1" style={{ color: theme.colors.outlineVariant }}>Change email in Settings → Account</Text>
            </View>

            {/* Phone */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>Phone Number</Text>
              <TextInput
                value={editForm.phone}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                className="px-4 py-3 text-base"
                style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg, color: theme.colors.secondary }}
                placeholder="Enter phone number"
                placeholderTextColor={theme.colors.outline}
                keyboardType="phone-pad"
              />
            </View>

            {/* Role (read-only) */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>I am a</Text>
              <View className="px-4 py-3" style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg }}>
                <Text className="text-base capitalize" style={{ color: theme.colors.outline }}>{user?.role || 'Buyer'}</Text>
              </View>
              <Text className="text-xs mt-1" style={{ color: theme.colors.outlineVariant }}>Contact support to change role</Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View className="px-5 py-4" style={{ borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              className="py-4 flex-row items-center justify-center"
              style={{ borderRadius: theme.roundness.xl, backgroundColor: saving ? theme.colors.outlineVariant : theme.colors.primary }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white text-base font-semibold ml-2">Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
        showBorder ? 'border-b' : ''
      }`}
      style={showBorder ? { borderBottomColor: theme.colors.outlineVariant } : undefined}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 items-center justify-center" style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.md }}>
          <Ionicons name={icon} size={20} color={theme.colors.outline} />
        </View>
        <Text className="text-base ml-3 flex-1" style={{ color: theme.colors.secondary }}>{label}</Text>

        {badge && (
          <View className="px-2.5 py-0.5 mr-2" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.roundness.full }}>
            <Text className="text-xs font-semibold" style={{ color: theme.colors.onPrimary }}>{badge}</Text>
          </View>
        )}

        {count !== undefined && (
          <View className="px-2.5 py-0.5 mr-2" style={{ backgroundColor: theme.colors.primaryContainer, borderRadius: theme.roundness.full }}>
            <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>{count}</Text>
          </View>
        )}

        {rightText && (
          <Text className="text-sm mr-2" style={{ color: theme.colors.outline }}>{rightText}</Text>
        )}
      </View>

      {onPress && <Ionicons name="chevron-forward" size={20} color={theme.colors.outlineVariant} />}
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
        showBorder ? 'border-b' : ''
      }`}
      style={showBorder ? { borderBottomColor: theme.colors.outlineVariant } : undefined}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 items-center justify-center" style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.md }}>
          <Ionicons
            name={value ? "notifications" : "notifications-outline"}
            size={20}
            color={value ? theme.colors.primary : theme.colors.outline}
          />
        </View>
        <Text className="text-base ml-3" style={{ color: theme.colors.secondary }}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primaryContainer }}
        thumbColor={value ? theme.colors.primary : theme.colors.surface}
        ios_backgroundColor={theme.colors.outlineVariant}
      />
    </View>
  );
}