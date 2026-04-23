import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_COMPARE = 4;

interface CompareState {
  propertyIds: string[];
  toggle: (id: string) => boolean;
  add: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

// Up to 4 properties can sit in the compare tray — more than that gets cramped
// on a phone and isn't useful. `toggle` returns the new "included" state.
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      propertyIds: [],
      has: (id) => get().propertyIds.includes(id),
      add: (id) => {
        const ids = get().propertyIds;
        if (ids.includes(id)) return true;
        if (ids.length >= MAX_COMPARE) return false;
        set({ propertyIds: [...ids, id] });
        return true;
      },
      remove: (id) => {
        set({ propertyIds: get().propertyIds.filter((x) => x !== id) });
      },
      toggle: (id) => {
        const ids = get().propertyIds;
        if (ids.includes(id)) {
          set({ propertyIds: ids.filter((x) => x !== id) });
          return false;
        }
        if (ids.length >= MAX_COMPARE) return false;
        set({ propertyIds: [...ids, id] });
        return true;
      },
      clear: () => set({ propertyIds: [] }),
    }),
    {
      name: 'compare-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const MAX_COMPARE_SIZE = MAX_COMPARE;
