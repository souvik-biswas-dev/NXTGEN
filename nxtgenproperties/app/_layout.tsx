import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import '../global.css';
import { useAuth } from '@/hooks/useAuth';

// Suppress deprecation warning from react-navigation internals — our code
// already uses react-native-safe-area-context everywhere.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export default function RootLayout() {
  // Keep useAuth to initialise the auth listener and populate authStore
  useAuth();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Main routing is handled by app/index.tsx */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="membership/index" />
        <Stack.Screen name="map/index" />
      </Stack>
    </>
  );
}
