import { create } from 'zustand';
import { InAppNotification, NotificationType } from '@/types';
import { api, hasSession } from '@/lib/api';

interface NotificationsState {
  notifications: InAppNotification[];
  loading: boolean;
  unreadCount: number;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  push: (n: {
    type: NotificationType;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetch: async () => {
    set({ loading: true });
    try {
      if (!(await hasSession())) {
        set({ notifications: [], unreadCount: 0 });
        return;
      }
      const { items } = await api.get<{ items: InAppNotification[] }>('/notifications');
      const list = items ?? [];
      set({ notifications: list, unreadCount: list.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set({
        notifications: get().notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  },

  remove: async (id) => {
    try {
      await api.del(`/notifications/${id}`);
      const updated = get().notifications.filter((n) => n.id !== id);
      set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  // Local-originated notification (e.g. a client-side match alert). The server
  // is the source of truth for persisted notifications; this just updates the UI.
  push: async (n) => {
    const local: InAppNotification = {
      id: `local-${Date.now()}`,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data ?? {},
      read: false,
      created_at: new Date().toISOString(),
    } as InAppNotification;
    const list = [local, ...get().notifications];
    set({ notifications: list, unreadCount: list.filter((x) => !x.read).length });
  },
}));
