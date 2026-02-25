import { create } from 'zustand';
import { User, UserPreferences } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  userPreferences: UserPreferences | null;
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setLoading: (loading: boolean) => void;
  setUserPreferences: (preferences: UserPreferences | null) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  userPreferences: null,

  setUser: (user) => set({ user }),
  
  setSession: (session) => set({ session }),
  
  setLoading: (loading) => set({ loading }),

  setUserPreferences: (preferences) => set({ userPreferences: preferences }),

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null, userPreferences: null });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.user_id)
      if (error) throw error;

      set({ user: { ...user, ...updates } });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
}));
