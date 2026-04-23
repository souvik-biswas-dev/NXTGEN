import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Expo push handles iOS (APNs) and Android (FCM) with a single token.
// The token is uploaded to the `push_tokens` table (migration 009). Server-side
// notification edge functions query this table to fan-out messages.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type RegisterOptions = {
  userId: string;
  onPermissionDenied?: () => void;
};

/**
 * Call from a screen the user has already signed in on. Safe to call every
 * launch — upserts by token so duplicates don't accumulate.
 */
export async function registerForPushNotifications({
  userId,
  onPermissionDenied,
}: RegisterOptions): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulators can't receive pushes — skip silently.
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    onPermissionDenied?.();
    return null;
  }

  // Android needs a default channel for notifications to display.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // projectId is required by Expo push for SDK 48+. Pull it from app.json.
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? (Constants.easConfig as any)?.projectId;

  try {
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined))
      .data;

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );
    if (error) console.warn('[push] upsert token failed:', error.message);

    return token;
  } catch (err) {
    // FCM fails in dev builds without google-services.json — non-fatal in dev.
    if (!__DEV__) console.warn('[push] getExpoPushTokenAsync failed:', err);
    return null;
  }
}

/** Remove the device's token — call on sign-out to stop sending pushes to it. */
export async function unregisterPushToken(token: string): Promise<void> {
  try {
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch (err) {
    console.warn('[push] unregister failed:', err);
  }
}
