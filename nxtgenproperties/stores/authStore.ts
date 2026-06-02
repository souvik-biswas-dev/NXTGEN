import { create } from 'zustand';
import { User, UserPreferences } from '@/types';
import { auth, toUser } from '@/lib/auth';
import { clearTokens } from '@/lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  userPreferences: UserPreferences | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setUserPreferences: (preferences: UserPreferences | null) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  userPreferences: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),

  signOut: async () => {
    // Clear local state immediately so the UI reacts without waiting for network.
    set({ user: null, userPreferences: null });
    try {
      await auth.logout();
    } catch {
      await clearTokens();
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    // Only fields the API accepts; server maintains the rest.
    const { name, phone, email, avatar_url } = updates;
    const me = await auth.updateProfile({ name, phone, email, avatar_url });
    // Prefer the server's canonical profile (handles camelCase), then overlay
    // the just-sent edits so the UI reflects them immediately.
    const fromServer = toUser(me);
    set({ user: { ...user, ...(fromServer ?? {}), ...updates } });
  },
}));
