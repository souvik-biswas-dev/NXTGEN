import { create } from 'zustand';
import { PropertyAlert, SearchFilters } from '@/types';
import { supabase } from '@/lib/supabase';

interface AlertsState {
  alerts: PropertyAlert[];
  loading: boolean;
  createAlert: (filters: SearchFilters, name: string) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  toggleAlert: (id: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  loading: false,

  fetchAlerts: async () => {
    set({ loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ alerts: data ?? [] });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      set({ loading: false });
    }
  },

  createAlert: async (filters: SearchFilters, name: string) => {
    set({ loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_alerts')
        .insert({ user_id: user.id, filters, name, active: true })
        .select()
        .single();

      if (error) throw error;
      set({ alerts: [data, ...get().alerts] });
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      set({ loading: false });
    }
  },

  deleteAlert: async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('property_alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      set({ alerts: get().alerts.filter((a) => a.id !== id) });
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  },

  toggleAlert: async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const alert = get().alerts.find((a) => a.id === id);
      if (!alert) return;

      const { error } = await supabase
        .from('property_alerts')
        .update({ active: !alert.active })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      set({
        alerts: get().alerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  },
}));
