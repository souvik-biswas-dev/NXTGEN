import { create } from 'zustand';
import { PropertyAlert, SearchFilters } from '@/types';
import { api } from '@/lib/api';

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
      const { items } = await api.get<{ items: PropertyAlert[] }>('/notifications/alerts');
      set({ alerts: items ?? [] });
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      set({ loading: false });
    }
  },

  createAlert: async (filters: SearchFilters, name: string) => {
    set({ loading: true });
    try {
      const alert = await api.post<PropertyAlert>('/notifications/alerts', { name, filters });
      set({ alerts: [alert, ...get().alerts] });
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      set({ loading: false });
    }
  },

  deleteAlert: async (id: string) => {
    try {
      await api.del(`/notifications/alerts/${id}`);
      set({ alerts: get().alerts.filter((a) => a.id !== id) });
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  },

  toggleAlert: async (id: string) => {
    try {
      const alert = get().alerts.find((a) => a.id === id);
      if (!alert) return;
      await api.patch(`/notifications/alerts/${id}`, { active: !alert.active });
      set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)) });
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  },
}));
