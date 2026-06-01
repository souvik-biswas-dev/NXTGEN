import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { auth, toUser } from '@/lib/auth';
import { hasSession, onAuthChange } from '@/lib/api';
import { registerForPushNotifications } from '@/lib/pushNotifications';

export const useAuth = () => {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!(await hasSession())) {
        if (mounted) setLoading(false);
        return;
      }
      await loadProfile();
    };

    const loadProfile = async () => {
      try {
        const me = await auth.me();
        if (!mounted) return;
        setUser(toUser(me));
        registerForPushNotifications({ userId: me.id }).catch(() => {});
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    // React to sign-in / sign-out from anywhere (auth screens, token refresh failure).
    const unsub = onAuthChange((signedIn) => {
      if (signedIn) {
        setLoading(true);
        loadProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
};
