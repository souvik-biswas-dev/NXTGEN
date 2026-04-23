import { create } from 'zustand';
import { InAppNotification, NotificationType } from '@/types';
import { supabase } from '@/lib/supabase';

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ notifications: [], unreadCount: 0 });
        return;
      }
      const { data, error } = await supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const list = (data as InAppNotification[]) ?? [];
      set({
        notifications: list,
        unreadCount: list.filter((n) => !n.read).length,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('in_app_notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
      const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  },

  markAllRead: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('in_app_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('in_app_notifications').delete().eq('id', id).eq('user_id', user.id);
      const updated = get().notifications.filter((n) => n.id !== id);
      set({ notifications: updated, unreadCount: updated.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  push: async (n) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('in_app_notifications')
        .insert({
          user_id: user.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data ?? {},
        })
        .select()
        .single();
      if (error) throw error;
      const list = [data as InAppNotification, ...get().notifications];
      set({ notifications: list, unreadCount: list.filter((x) => !x.read).length });
    } catch (error) {
      console.error('Error pushing notification:', error);
    }
  },
}));
