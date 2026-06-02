import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import BrandedSplash from '@/components/BrandedSplash';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return <BrandedSplash />;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(tabs)" />;
}
