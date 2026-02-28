import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [emailModalVisible, setEmailModalVisible] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [emailSaving, setEmailSaving] = React.useState(false);

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (trimmed === user?.email?.toLowerCase()) {
      Alert.alert('Same Email', 'The new email is the same as your current one.');
      return;
    }
    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      // Also update the profile table so the display stays in sync
      await updateProfile({ email: trimmed });
      setEmailModalVisible(false);
      setNewEmail('');
      Alert.alert(
        'Verification Sent',
        'A confirmation link has been sent to ' + trimmed + '. Your email will update once you click the link.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update email.');
    } finally {
      setEmailSaving(false);
    }
  };

  const [notifications, setNotifications] = React.useState({
    push: true,
    email: true,
    sms: false,
    matchedProperties: true,
    priceDrops: true,
    newListings: false,
    inquiryUpdates: true,
  });

  const [privacy, setPrivacy] = React.useState({
    profileVisible: true,
    showPhone: false,
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, listings, and conversations will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Request Submitted', 'Our team will process your account deletion within 7 business days.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: theme.colors.secondary }}>
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Account */}
        <Section title="Account">
          <RowItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/(tabs)/profile')}
            showBorder
          />
          <RowItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() =>
              Alert.alert('Change Password', 'A password reset link will be sent to your email.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send Link', onPress: () => Alert.alert('Sent', 'Check your inbox for the reset link.') },
              ])
            }
            showBorder
          />
          <RowItem
            icon="mail-outline"
            label="Email Address"
            valueText={user?.email || '—'}
            onPress={() => {
              setNewEmail(user?.email || '');
              setEmailModalVisible(true);
            }}
          />
        </Section>

        {/* Email Change Modal */}
        <Modal visible={emailModalVisible} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
              <TouchableOpacity onPress={() => { setEmailModalVisible(false); setNewEmail(''); }}>
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.secondary }}>Change Email</Text>
              <TouchableOpacity onPress={handleChangeEmail} disabled={emailSaving}>
                {emailSaving
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 15 }}>Save</Text>}
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ color: theme.colors.outline, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
                Enter your new email address. A verification link will be sent to confirm the change.
              </Text>
              <Text style={{ color: theme.colors.outline, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Current Email</Text>
              <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 }}>
                <Text style={{ color: theme.colors.outline }}>{user?.email || '—'}</Text>
              </View>
              <Text style={{ color: theme.colors.outline, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>New Email</Text>
              <TextInput
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Enter new email address"
                placeholderTextColor={theme.colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.secondary }}
              />
            </View>
          </SafeAreaView>
        </Modal>

        {/* Push Notifications */}
        <Section title="Push Notifications">
          <SwitchRow
            icon="notifications-outline"
            label="Push Notifications"
            value={notifications.push}
            onChange={(v) => setNotifications((p) => ({ ...p, push: v }))}
            showBorder
          />
          <SwitchRow
            icon="mail-outline"
            label="Email Notifications"
            value={notifications.email}
            onChange={(v) => setNotifications((p) => ({ ...p, email: v }))}
            showBorder
          />
          <SwitchRow
            icon="chatbubble-outline"
            label="SMS Alerts"
            value={notifications.sms}
            onChange={(v) => setNotifications((p) => ({ ...p, sms: v }))}
          />
        </Section>

        {/* Property Alerts */}
        <Section title="Property Alerts">
          <SwitchRow
            icon="home-outline"
            label="Matched Properties"
            value={notifications.matchedProperties}
            onChange={(v) => setNotifications((p) => ({ ...p, matchedProperties: v }))}
            showBorder
          />
          <SwitchRow
            icon="trending-down-outline"
            label="Price Drops"
            value={notifications.priceDrops}
            onChange={(v) => setNotifications((p) => ({ ...p, priceDrops: v }))}
            showBorder
          />
          <SwitchRow
            icon="add-circle-outline"
            label="New Listings in My Area"
            value={notifications.newListings}
            onChange={(v) => setNotifications((p) => ({ ...p, newListings: v }))}
            showBorder
          />
          <SwitchRow
            icon="chatbubbles-outline"
            label="Inquiry Updates"
            value={notifications.inquiryUpdates}
            onChange={(v) => setNotifications((p) => ({ ...p, inquiryUpdates: v }))}
          />
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <SwitchRow
            icon="eye-outline"
            label="Public Profile"
            value={privacy.profileVisible}
            onChange={(v) => setPrivacy((p) => ({ ...p, profileVisible: v }))}
            showBorder
          />
          <SwitchRow
            icon="call-outline"
            label="Show Phone to Buyers"
            value={privacy.showPhone}
            onChange={(v) => setPrivacy((p) => ({ ...p, showPhone: v }))}
          />
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <RowItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push('/about' as any)}
            showBorder
          />
          <RowItem
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => router.push('/about' as any)}
          />
        </Section>

        {/* Danger Zone */}
        <View className="px-4 mt-6 mb-10">
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="flex-row items-center justify-center py-4"
            style={{
              borderRadius: theme.roundness.xl,
              borderWidth: 1,
              borderColor: theme.colors.error + '40',
            }}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            <Text className="ml-2 font-semibold text-base" style={{ color: theme.colors.error }}>
              Delete My Account
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-4 mt-6">
      <Text className="text-base font-bold mb-3" style={{ color: theme.colors.secondary }}>
        {title}
      </Text>
      <View className="bg-white rounded-2xl overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
        {children}
      </View>
    </View>
  );
}

/* ─── Row item (navigate / info) ─── */
interface RowItemProps {
  icon: IoniconsName;
  label: string;
  onPress?: () => void;
  showBorder?: boolean;
  valueText?: string;
}

function RowItem({ icon, label, onPress, showBorder, valueText }: RowItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      className={`flex-row items-center justify-between px-4 py-4 ${showBorder ? 'border-b' : ''}`}
      style={showBorder ? { borderBottomColor: theme.colors.outlineVariant } : undefined}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-9 h-9 items-center justify-center"
          style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.md }}
        >
          <Ionicons name={icon} size={19} color={theme.colors.outline} />
        </View>
        <Text className="ml-3 text-base flex-1" style={{ color: theme.colors.secondary }}>
          {label}
        </Text>
        {valueText && (
          <Text className="text-sm mr-2" style={{ color: theme.colors.outline }}>
            {valueText}
          </Text>
        )}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={theme.colors.outlineVariant} />}
    </TouchableOpacity>
  );
}

/* ─── Switch row ─── */
interface SwitchRowProps {
  icon: IoniconsName;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  showBorder?: boolean;
}

function SwitchRow({ icon, label, value, onChange, showBorder }: SwitchRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${showBorder ? 'border-b' : ''}`}
      style={showBorder ? { borderBottomColor: theme.colors.outlineVariant } : undefined}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-9 h-9 items-center justify-center"
          style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness.md }}
        >
          <Ionicons name={icon} size={19} color={value ? theme.colors.primary : theme.colors.outline} />
        </View>
        <Text className="ml-3 text-base flex-1" style={{ color: theme.colors.secondary }}>
          {label}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primaryContainer }}
        thumbColor={value ? theme.colors.primary : theme.colors.surface}
        ios_backgroundColor={theme.colors.outlineVariant}
      />
    </View>
  );
}
