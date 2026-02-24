import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritesStore } from '@/stores/favoritesStore';

export default function RootLayout() {
  const { user } = useAuth();
  const { fetchFavorites } = useFavoritesStore();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="membership/index" />
        <Stack.Screen name="map/index" />
      </Stack>
    </>
  );
}
