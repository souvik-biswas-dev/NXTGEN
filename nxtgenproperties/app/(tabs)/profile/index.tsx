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
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { LinearGradient } from 'expo-linear-gradient';
import { VerificationRequestCard } from '@/components/BrokerBadge';
import { theme } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { uploadImage } from '@/lib/uploads';
import { profileUpdateSchema, firstError } from '@/lib/validation';

export default function ProfileScreen() {
  useTheme(); // Subscribe so the screen re-renders immediately on theme change
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuthStore();
  const { favorites, fetchFavorites } = useFavoritesStore();
  const { prefs: notifications, update: updateNotifications } = useNotificationPreferences();
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
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to change your profile picture.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    if (!user?.user_id) {
      Alert.alert('Sign In Required', 'Please sign in to change your avatar.');
      return;
    }
    setAvatarUploading(true);
    try {
      const url = await uploadImage({
        localUri: result.assets[0].uri,
        bucket: 'profile-avatars',
        userId: user.user_id,
      });
      await updateProfile({ avatar_url: url });
    } catch (err) {
      Alert.alert(
        'Upload Failed',
        err instanceof Error ? err.message : 'Could not upload photo. Please try again.'
      );
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
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    setEditForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const parsed = profileUpdateSchema.safeParse({
      name: editForm.name,
      phone: editForm.phone,
    });
    if (!parsed.success) {
      Alert.alert('Check your details', firstError(parsed.error));
      return;
    }
    setSaving(true);
    try {
      await updateProfile(parsed.data);
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
            colors={['#0F766E', '#D4A24C']}
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
          <View
            className="rounded-3xl shadow-lg p-6"
            style={{ backgroundColor: theme.colors.cardBackground }}
          >
            {/* Avatar and Edit Button */}
            <View className="items-center -mt-16 mb-4">
              <View className="relative">
                <Image
                  source={{
                    uri:
                      user?.avatar_url ||
                      'https://ui-avatars.com/api/?name=' +
                        (user?.name || 'User') +
                        '&size=200&background=0F766E&color=fff',
                  }}
                  className="w-28 h-28 rounded-full shadow-md"
                  style={{
                    borderWidth: 4,
                    borderColor: theme.colors.primaryContainer,
                    backgroundColor: theme.colors.primaryContainer,
                  }}
                  fadeDuration={0}
                />
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2.5 border-4 border-white"
                >
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="camera" size={18} color="white" />
                  )}
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
                <View className="mt-2 flex-row items-center bg-teal-50 px-3 py-1.5 rounded-full">
                  <Ionicons name="shield-checkmark" size={16} color="#0F766E" />
                  <Text className="text-primary text-xs font-medium ml-1">Verified Broker</Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View
              className="flex-row justify-around pt-5 mt-3 mx-2 pb-4"
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: theme.roundness.lg,
              }}
            >
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
              <Text className="text-white text-base font-semibold ml-2">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Broker Verification Card - Show for brokers who aren't verified */}
        {user?.role === 'broker' && !user?.verified_broker && (
          <VerificationRequestCard onRequest={() => router.push('/broker-verification' as any)} />
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
            <View
              className="rounded-2xl shadow-sm overflow-hidden"
              style={{ backgroundColor: theme.colors.cardBackground }}
            >
              <MenuItem
                icon="home-outline"
                label="My Listings"
                onPress={() => router.push('/my-listings' as any)}
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
                icon="calendar-outline"
                label="Site Visits"
                onPress={() => router.push('/site-visits' as any)}
              />
            </View>
          </View>
        )}

        {/* Favorites & Saved */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Saved & Favorites</Text>
          <View
            className="rounded-2xl shadow-sm overflow-hidden"
            style={{ backgroundColor: theme.colors.cardBackground }}
          >
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
              onPress={() => router.push('/saved-searches' as any)}
              showBorder
            />
            <MenuItem
              icon="git-compare-outline"
              label="Compare Properties"
              onPress={() => router.push('/compare' as any)}
              showBorder
            />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => router.push('/notifications' as any)}
              showBorder
            />
            <MenuItem
              icon="calendar-outline"
              label="Site Visits"
              onPress={() => router.push('/site-visits' as any)}
              showBorder
            />
            <MenuItem
              icon="ribbon-outline"
              label="View Plans"
              onPress={() => router.push('/membership' as any)}
            />
          </View>
        </View>

        {/* Financial Tools */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Tools</Text>
          <View
            className="rounded-2xl shadow-sm overflow-hidden"
            style={{ backgroundColor: theme.colors.cardBackground }}
          >
            <MenuItem
              icon="calculator-outline"
              label="EMI Calculator"
              onPress={() => router.push('/tools/emi-calculator' as any)}
              showBorder
            />
            <MenuItem
              icon="wallet-outline"
              label="Budget Calculator"
              onPress={() => router.push('/tools/budget-calculator' as any)}
              showBorder
            />
            <MenuItem
              icon="resize-outline"
              label="Area Converter"
              onPress={() => router.push('/tools/area-converter' as any)}
              showBorder
            />
            <MenuItem
              icon="cash-outline"
              label="Home Loan Offers"
              onPress={() => router.push('/tools/home-loan' as any)}
            />
          </View>
        </View>

        {/* Notifications */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Notifications</Text>
          <View
            className="rounded-2xl shadow-sm"
            style={{ backgroundColor: theme.colors.cardBackground }}
          >
            <SwitchItem
              label="Matched Properties"
              value={notifications.matched}
              onValueChange={(value) => updateNotifications({ matched: value })}
              showBorder
            />
            <SwitchItem
              label="New Launched Properties"
              value={notifications.new_launches}
              onValueChange={(value) => updateNotifications({ new_launches: value })}
              showBorder
            />
            <SwitchItem
              label="Price Drop Alerts"
              value={notifications.price_drop}
              onValueChange={(value) => updateNotifications({ price_drop: value })}
              showBorder
            />
            <SwitchItem
              label="Property News & Updates"
              value={notifications.property_news}
              onValueChange={(value) => updateNotifications({ property_news: value })}
            />
          </View>
        </View>

        {/* Settings & Support */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Settings & Support</Text>
          <View
            className="rounded-2xl shadow-sm overflow-hidden"
            style={{ backgroundColor: theme.colors.cardBackground }}
          >
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
              onPress={() =>
                Linking.openURL('mailto:bugs@nxtgenproperties.com?subject=Bug%20Report')
              }
              showBorder
            />
            <MenuItem
              icon="information-circle-outline"
              label="App Version"
              rightText={Constants.expoConfig?.version ?? '1.0.0'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="shadow-sm flex-row items-center justify-center py-4"
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.roundness.xl,
              borderWidth: 1,
              borderColor: theme.colors.error + '30',
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="text-red-500 text-base font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Extra padding for floating tab bar */}
        <View style={{ height: theme.tabBarHeight + 16 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
          {/* Modal Header */}
          <View
            className="flex-row items-center justify-between px-5 py-4"
            style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}
          >
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: theme.colors.secondary }}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text
                className={`font-semibold`}
                style={{ color: saving ? theme.colors.outlineVariant : theme.colors.primary }}
              >
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
                    uri:
                      user?.avatar_url ||
                      'https://ui-avatars.com/api/?name=' +
                        (user?.name || 'User') +
                        '&size=200&background=0F766E&color=fff',
                  }}
                  className="w-24 h-24 rounded-full"
                  style={{ borderWidth: 4, borderColor: theme.colors.primaryContainer }}
                />
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-white"
                >
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="camera" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 text-xs mt-2">Tap camera to change photo</Text>
            </View>

            {/* Full Name */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>
                Full Name
              </Text>
              <TextInput
                value={editForm.name}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                className="px-4 py-3 text-base"
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.roundness.lg,
                  color: theme.colors.secondary,
                }}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.outline}
              />
            </View>

            {/* Email (read-only) */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>
                Email
              </Text>
              <View
                className="px-4 py-3"
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.roundness.lg,
                }}
              >
                <Text className="text-base" style={{ color: theme.colors.outline }}>
                  {user?.email || 'Not set'}
                </Text>
              </View>
              <Text className="text-xs mt-1" style={{ color: theme.colors.outlineVariant }}>
                Change email in Settings → Account
              </Text>
            </View>

            {/* Phone */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>
                Phone Number
              </Text>
              <TextInput
                value={editForm.phone}
                onChangeText={(text) => setEditForm((prev) => ({ ...prev, phone: text }))}
                className="px-4 py-3 text-base"
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.roundness.lg,
                  color: theme.colors.secondary,
                }}
                placeholder="Enter phone number"
                placeholderTextColor={theme.colors.outline}
                keyboardType="phone-pad"
              />
            </View>

            {/* Role (read-only) */}
            <View className="mb-5">
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.outline }}>
                I am a
              </Text>
              <View
                className="px-4 py-3"
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.roundness.lg,
                }}
              >
                <Text className="text-base capitalize" style={{ color: theme.colors.outline }}>
                  {user?.role || 'Buyer'}
                </Text>
              </View>
              <Text className="text-xs mt-1" style={{ color: theme.colors.outlineVariant }}>
                Contact support to change role
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View
            className="px-5 py-4"
            style={{ borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}
          >
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              className="py-4 flex-row items-center justify-center"
              style={{
                borderRadius: theme.roundness.xl,
                backgroundColor: saving ? theme.colors.outlineVariant : theme.colors.primary,
              }}
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

function MenuItem({ icon, label, onPress, showBorder, rightText, count, badge }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${showBorder ? 'border-b' : ''}`}
      style={showBorder ? { borderBottomColor: theme.colors.outlineVariant } : undefined}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 items-center justify-center"
          style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.md }}
        >
          <Ionicons name={icon} size={20} color={theme.colors.outline} />
        </View>
        <Text className="text-base ml-3 flex-1" style={{ color: theme.colors.secondary }}>
          {label}
        </Text>

        {badge && (
          <View
            className="px-2.5 py-0.5 mr-2"
            style={{ backgroundColor: theme.colors.primary, borderRadius: theme.roundness.full }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.colors.onPrimary }}>
              {badge}
            </Text>
          </View>
        )}

        {count !== undefined && (
          <View
            className="px-2.5 py-0.5 mr-2"
            style={{
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: theme.roundness.full,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
              {count}
            </Text>
          </View>
        )}

        {rightText && (
          <Text className="text-sm mr-2" style={{ color: theme.colors.outline }}>
            {rightText}
          </Text>
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
      className={`flex-row items-center justify-between px-4 py-4 ${showBorder ? 'border-b' : ''}`}
      style={showBorder ? { borderBottomColor: theme.colors.outlineVariant } : undefined}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 items-center justify-center"
          style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.md }}
        >
          <Ionicons
            name={value ? 'notifications' : 'notifications-outline'}
            size={20}
            color={value ? theme.colors.primary : theme.colors.outline}
          />
        </View>
        <Text className="text-base ml-3" style={{ color: theme.colors.secondary }}>
          {label}
        </Text>
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
