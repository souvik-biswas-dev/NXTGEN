import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { PUBLIC_PROFILE_COLUMNS } from '@/types';
import { registerForPushNotifications } from '@/lib/pushNotifications';

export const useAuth = () => {
  const { user, session, loading, setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Set loading true so UI shows spinner instead of "Guest User"
        // while the profile DB fetch is in flight.
        setLoading(true);
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const [{ data: profile, error: profileError }, { data: contact }] = await Promise.all([
        supabase
          .from('users_profiles')
          .select(PUBLIC_PROFILE_COLUMNS)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase.rpc('get_my_contact'),
      ]);

      if (profileError) throw profileError;
      if (!profile) {
        setUser(null);
        return;
      }
      const { email, phone } =
        Array.isArray(contact) && contact[0] ? contact[0] : { email: undefined, phone: undefined };
      setUser({ ...(profile as any), email, phone });
      // Register Expo push token in the background — don't block profile load.
      registerForPushNotifications({ userId }).catch(() => {});
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return { user, session, loading };
};
