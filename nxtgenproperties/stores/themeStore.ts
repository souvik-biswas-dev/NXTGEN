import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { _setActiveMode, palettes, type ThemeMode, type ResolvedMode } from '@/constants/theme';

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  syncFromSystem: () => void;
  _markHydrated: () => void;
}

function resolve(mode: ThemeMode): ResolvedMode {
  if (mode === 'system') {
    const scheme = Appearance.getColorScheme();
    return scheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolved: resolve('system'),
      hydrated: false,

      setMode: (mode) => {
        const resolved = resolve(mode);
        _setActiveMode(resolved);
        set({ mode, resolved });
      },

      syncFromSystem: () => {
        if (get().mode !== 'system') return;
        const resolved = resolve('system');
        if (resolved === get().resolved) return;
        _setActiveMode(resolved);
        set({ resolved });
      },

      _markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'theme-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        const mode = state?.mode ?? 'system';
        const resolved = resolve(mode);
        _setActiveMode(resolved);
        useThemeStore.setState({ resolved, hydrated: true });
      },
    }
  )
);

// Ensure the active mode reflects whatever is in the store synchronously —
// persist rehydration is async, but the initial in-memory default is 'system'.
_setActiveMode(useThemeStore.getState().resolved);

export { type ThemeMode, type ResolvedMode, palettes };
