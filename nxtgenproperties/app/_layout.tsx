import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import '../global.css';
import { useAuth } from '@/hooks/useAuth';

// Suppress known no-op warnings from the New Architecture bridge
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture',
]);

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
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="shortlist/index" options={{ headerShown: false }} />
        <Stack.Screen name="projects/index" options={{ headerShown: false }} />
        <Stack.Screen name="membership/index" options={{ headerShown: false }} />
        <Stack.Screen name="map/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="help/index" options={{ headerShown: false }} />
        <Stack.Screen name="about/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
