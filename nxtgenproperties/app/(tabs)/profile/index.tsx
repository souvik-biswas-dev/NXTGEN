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
import { useCountUp } from '@/hooks/useCountUp';
import { LinearGradient } from 'expo-linear-gradient';
import { VerificationRequestCard } from '@/components/BrokerBadge';
import { useTheme } from '@/hooks/useTheme';
import { uploadImage } from '@/lib/uploads';
import { profileUpdateSchema, firstError } from '@/lib/validation';

type Colors = ReturnType<typeof useTheme>['colors'];

export default function ProfileScreen() {
  const { colors, roundness, tabBarHeight, dark } = useTheme();
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuthStore();
  const { favorites, fetchFavorites } = useFavoritesStore();
  const { prefs: notifications, update: updateNotifications } = useNotificationPreferences();
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleChangeAvatar = async () => {
    if (!user?.user_id) {
      Alert.alert('Sign In Required', 'Please sign in to change your avatar.');
      return;
    }
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
      email: user?.email || '',
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
    // Email is optional; validate only when the user typed one.
    const emailTrimmed = editForm.email.trim().toLowerCase();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      Alert.alert('Check your details', 'Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        ...parsed.data,
        ...(emailTrimmed && emailTrimmed !== user?.email?.toLowerCase()
          ? { email: emailTrimmed }
          : {}),
      });
      setEditModalVisible(false);
      Alert.alert('Saved', 'Your profile has been updated.');
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

  const avatarUri =
    user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=200&background=0F766E&color=fff`;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Cover */}
        <View style={{ position: 'relative' }}>
          <LinearGradient
            colors={dark ? ['#0B3B36', '#0B1220'] : [colors.secondary, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 168 }}
          />
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding: 9,
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 20, marginTop: -84 }}>
          <View
            style={{
              backgroundColor: colors.cardBackground,
              borderRadius: 26,
              padding: 22,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <View style={{ alignItems: 'center', marginTop: -64, marginBottom: 8 }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 56,
                    borderWidth: 4,
                    borderColor: colors.cardBackground,
                    backgroundColor: colors.primaryContainer,
                  }}
                  fadeDuration={0}
                />
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={avatarUploading}
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    backgroundColor: colors.primary,
                    borderRadius: 18,
                    padding: 8,
                    borderWidth: 3,
                    borderColor: colors.cardBackground,
                  }}
                >
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              <Text
                style={{ color: colors.onSurface, fontSize: 22, fontWeight: '800', marginTop: 14 }}
              >
                {user?.name || 'Welcome'}
              </Text>
              {user?.email ? (
                <Text style={{ color: colors.outline, fontSize: 13, marginTop: 2 }}>
                  {user.email}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleEditProfile}>
                  <Text
                    style={{ color: colors.primary, fontSize: 13, marginTop: 2, fontWeight: '600' }}
                  >
                    + Add your email
                  </Text>
                </TouchableOpacity>
              )}

              <View
                style={{
                  marginTop: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  backgroundColor: colors.primaryContainer,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 12,
                    fontWeight: '700',
                    textTransform: 'capitalize',
                  }}
                >
                  {user?.role || 'Buyer'}
                </Text>
              </View>

              {user?.role === 'broker' && user?.verified_broker && (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.success + '22',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 999,
                  }}
                >
                  <Ionicons name="shield-checkmark" size={15} color={colors.success} />
                  <Text
                    style={{
                      color: colors.success,
                      fontSize: 12,
                      fontWeight: '700',
                      marginLeft: 5,
                    }}
                  >
                    Verified Broker
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                backgroundColor: colors.surfaceVariant,
                borderRadius: roundness.lg,
                paddingVertical: 16,
                marginTop: 14,
              }}
            >
              {user?.role !== 'buyer' && (
                <Stat colors={colors} value={stats.listings} label="Listings" />
              )}
              <Stat colors={colors} value={stats.favorites} label="Favorites" />
              {user?.role === 'broker' && (
                <Stat colors={colors} value={stats.views} label="Profile Views" />
              )}
            </View>

            <TouchableOpacity
              onPress={handleEditProfile}
              style={{
                marginTop: 16,
                paddingVertical: 14,
                backgroundColor: colors.primary,
                borderRadius: roundness.xl,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {user?.role === 'broker' && !user?.verified_broker && (
          <VerificationRequestCard onRequest={() => router.push('/broker-verification' as any)} />
        )}

        {user?.role !== 'buyer' && (
          <Group colors={colors} title="My Activity">
            <MenuItem
              colors={colors}
              icon="home-outline"
              label="My Listings"
              onPress={() => router.push('/my-listings' as any)}
              showBorder
            />
            <MenuItem
              colors={colors}
              icon="bar-chart-outline"
              label="Performance"
              badge="New"
              onPress={() => router.push('/insights' as any)}
              showBorder
            />
            <MenuItem
              colors={colors}
              icon="calendar-outline"
              label="Site Visits"
              onPress={() => router.push('/site-visits' as any)}
            />
          </Group>
        )}

        <Group colors={colors} title="Saved & Favorites">
          <MenuItem
            colors={colors}
            icon="heart-outline"
            label="Favorite Properties"
            count={stats.favorites}
            onPress={() => router.push('/(tabs)/favorite')}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="bookmark-outline"
            label="Saved Searches"
            onPress={() => router.push('/saved-searches' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="git-compare-outline"
            label="Compare Properties"
            onPress={() => router.push('/compare' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/notifications' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="calendar-outline"
            label="Site Visits"
            onPress={() => router.push('/site-visits' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="pricetag-outline"
            label="My Offers"
            onPress={() => router.push('/offers' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="ribbon-outline"
            label="View Plans"
            onPress={() => router.push('/membership' as any)}
          />
        </Group>

        <Group colors={colors} title="Tools">
          <MenuItem
            colors={colors}
            icon="calculator-outline"
            label="EMI Calculator"
            onPress={() => router.push('/tools/emi-calculator' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="wallet-outline"
            label="Budget Calculator"
            onPress={() => router.push('/tools/budget-calculator' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="resize-outline"
            label="Area Converter"
            onPress={() => router.push('/tools/area-converter' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="cash-outline"
            label="Home Loan Offers"
            onPress={() => router.push('/tools/home-loan' as any)}
          />
        </Group>

        <Group colors={colors} title="Notifications">
          <SwitchItem
            colors={colors}
            label="Matched Properties"
            value={notifications.matched}
            onValueChange={(v) => updateNotifications({ matched: v })}
            showBorder
          />
          <SwitchItem
            colors={colors}
            label="New Launched Properties"
            value={notifications.new_launches}
            onValueChange={(v) => updateNotifications({ new_launches: v })}
            showBorder
          />
          <SwitchItem
            colors={colors}
            label="Price Drop Alerts"
            value={notifications.price_drop}
            onValueChange={(v) => updateNotifications({ price_drop: v })}
            showBorder
          />
          <SwitchItem
            colors={colors}
            label="Property News & Updates"
            value={notifications.property_news}
            onValueChange={(v) => updateNotifications({ property_news: v })}
          />
        </Group>

        <Group colors={colors} title="Settings & Support">
          <MenuItem
            colors={colors}
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/settings' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://nxtgenproperties.com/privacy')}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="document-text-outline"
            label="Terms of Use"
            onPress={() => Linking.openURL('https://nxtgenproperties.com/terms')}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => router.push('/help' as any)}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="bug-outline"
            label="Report a Bug"
            onPress={() => Linking.openURL('mailto:bugs@nxtgenproperties.com?subject=Bug%20Report')}
            showBorder
          />
          <MenuItem
            colors={colors}
            icon="information-circle-outline"
            label="App Version"
            rightText={Constants.expoConfig?.version ?? '1.0.0'}
          />
        </Group>

        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 15,
              backgroundColor: colors.cardBackground,
              borderRadius: roundness.xl,
              borderWidth: 1,
              borderColor: colors.error + '40',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 15, fontWeight: '700', marginLeft: 8 }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: tabBarHeight + 16 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
            }}
          >
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.onSurface }}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              <Text
                style={{
                  fontWeight: '700',
                  color: saving ? colors.outlineVariant : colors.primary,
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: avatarUri }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 4,
                    borderColor: colors.primaryContainer,
                  }}
                />
                <TouchableOpacity
                  onPress={handleChangeAvatar}
                  disabled={avatarUploading}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                    padding: 7,
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                >
                  {avatarUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={15} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.outline, fontSize: 12, marginTop: 10 }}>
                Tap the camera to change photo
              </Text>
            </View>

            <EditField
              colors={colors}
              roundness={roundness}
              label="Full Name"
              value={editForm.name}
              onChangeText={(t) => setEditForm((p) => ({ ...p, name: t }))}
              placeholder="Enter your name"
              icon="person-outline"
            />
            <EditField
              colors={colors}
              roundness={roundness}
              label="Phone Number"
              value={editForm.phone}
              onChangeText={(t) => setEditForm((p) => ({ ...p, phone: t }))}
              placeholder="Enter phone number"
              icon="call-outline"
              keyboardType="phone-pad"
            />
            <EditField
              colors={colors}
              roundness={roundness}
              label="Email"
              value={editForm.email}
              onChangeText={(t) => setEditForm((p) => ({ ...p, email: t }))}
              placeholder="Enter your email"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Role — locked */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{ color: colors.outline, fontSize: 13, fontWeight: '600', marginBottom: 8 }}
              >
                I am a
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: roundness.lg,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  opacity: 0.85,
                }}
              >
                <Ionicons name="briefcase-outline" size={18} color={colors.outline} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 15,
                    color: colors.outline,
                    textTransform: 'capitalize',
                  }}
                >
                  {user?.role || 'Buyer'}
                </Text>
                <Ionicons name="lock-closed" size={15} color={colors.outline} />
              </View>
              <Text style={{ color: colors.outlineVariant, fontSize: 12, marginTop: 6 }}>
                Contact support to change your role
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.outlineVariant,
            }}
          >
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              style={{
                paddingVertical: 16,
                borderRadius: roundness.xl,
                backgroundColor: saving ? colors.outlineVariant : colors.primary,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 }}>
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ colors, value, label }: { colors: Colors; value: number; label: string }) {
  const animated = useCountUp(value, 800, [value]);
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: '800' }}>{animated}</Text>
      <Text style={{ color: colors.outline, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Group({
  colors,
  title,
  children,
}: {
  colors: Colors;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
      <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: '800', marginBottom: 12 }}>
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.cardBackground,
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.outlineVariant,
        }}
      >
        {children}
      </View>
    </View>
  );
}

interface EditFieldProps {
  colors: Colors;
  roundness: ReturnType<typeof useTheme>['roundness'];
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}

function EditField({
  colors,
  roundness,
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  autoCapitalize,
}: EditFieldProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.outline, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: roundness.lg,
          paddingHorizontal: 14,
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : colors.outlineVariant,
        }}
      >
        <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.outline} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={{
            flex: 1,
            marginLeft: 10,
            paddingVertical: 14,
            fontSize: 15,
            color: colors.onSurface,
          }}
        />
      </View>
    </View>
  );
}

interface MenuItemProps {
  colors: Colors;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  showBorder?: boolean;
  rightText?: string;
  count?: number;
  badge?: string;
}

function MenuItem({
  colors,
  icon,
  label,
  onPress,
  showBorder,
  rightText,
  count,
  badge,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 15,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: colors.outlineVariant,
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={19} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 15, marginLeft: 12, flex: 1, color: colors.onSurface }}>
          {label}
        </Text>

        {badge && (
          <View
            style={{
              paddingHorizontal: 9,
              paddingVertical: 2,
              marginRight: 8,
              backgroundColor: colors.primary,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{badge}</Text>
          </View>
        )}
        {count !== undefined && (
          <View
            style={{
              paddingHorizontal: 9,
              paddingVertical: 2,
              marginRight: 8,
              backgroundColor: colors.primaryContainer,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{count}</Text>
          </View>
        )}
        {rightText && (
          <Text style={{ fontSize: 13, marginRight: 8, color: colors.outline }}>{rightText}</Text>
        )}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={colors.outlineVariant} />}
    </TouchableOpacity>
  );
}

interface SwitchItemProps {
  colors: Colors;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showBorder?: boolean;
}

function SwitchItem({ colors, label, value, onValueChange, showBorder }: SwitchItemProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={value ? 'notifications' : 'notifications-outline'}
            size={19}
            color={value ? colors.primary : colors.outline}
          />
        </View>
        <Text style={{ fontSize: 15, marginLeft: 12, flex: 1, color: colors.onSurface }}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={colors.outlineVariant}
      />
    </View>
  );
}
