import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Conversation, Message } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatState {
  conversations: Conversation[];
  currentMessages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  // Separate channels: one for the open chat room, one for the inbox list.
  messageChannel: RealtimeChannel | null;
  conversationChannel: RealtimeChannel | null;

  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string) => Promise<void>;
  getOrCreateConversation: (
    currentUserId: string,
    otherUserId: string,
    propertyId?: string
  ) => Promise<string | null>;

  /** Subscribe to INSERT + UPDATE on messages for the open chat room. */
  subscribeToMessages: (conversationId: string, currentUserId: string) => void;
  /** Subscribe to conversation-level changes so the inbox list stays live. */
  subscribeToConversations: (userId: string) => void;
  unsubscribeMessages: () => void;
  unsubscribeConversations: () => void;

  markMessagesAsRead: (conversationId: string, userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => Promise<number>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentMessages: [],
  loading: false,
  messagesLoading: false,
  error: null,
  messageChannel: null,
  conversationChannel: null,

  fetchConversations: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        set({ conversations: [], loading: false });
        return;
      }

      const otherUserIds = data.map((conv) =>
        conv.participant_1 === userId ? conv.participant_2 : conv.participant_1
      );
      const convIds = data.map((conv) => conv.id);

      const [{ data: profiles }, { data: unreadRows }] = await Promise.all([
        supabase.from('users_profiles').select('*').in('user_id', otherUserIds),
        supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('read', false)
          .neq('sender_id', userId),
      ]);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p) => { profileMap[p.user_id] = p; });

      const unreadMap: Record<string, number> = {};
      (unreadRows || []).forEach((row) => {
        unreadMap[row.conversation_id] = (unreadMap[row.conversation_id] || 0) + 1;
      });

      const conversationsWithUsers: Conversation[] = data.map((conv) => {
        const otherUserId =
          conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
        return {
          ...conv,
          other_user: profileMap[otherUserId] || undefined,
          unread_count: unreadMap[conv.id] || 0,
        };
      });

      set({ conversations: conversationsWithUsers, loading: false });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
      });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ messagesLoading: true });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ currentMessages: data || [], messagesLoading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ messagesLoading: false });
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
      throw error;
    }
  },

  getOrCreateConversation: async (
    currentUserId: string,
    otherUserId: string,
    propertyId?: string
  ) => {
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${currentUserId},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: currentUserId,
          participant_2: otherUserId,
          property_id: propertyId || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  subscribeToMessages: (conversationId: string, currentUserId: string) => {
    const { messageChannel } = get();
    if (messageChannel) supabase.removeChannel(messageChannel);

    const channel = supabase
      .channel(`chat:messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          set((state) => ({
            currentMessages: [...state.currentMessages, newMessage],
          }));
          // Auto-mark incoming messages as read while the chat room is open
          if (newMessage.sender_id !== currentUserId) {
            get().markMessagesAsRead(conversationId, currentUserId);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          set((state) => ({
            currentMessages: state.currentMessages.map((m) =>
              m.id === updated.id ? { ...m, read: updated.read } : m
            ),
          }));
        }
      )
      .subscribe();

    set({ messageChannel: channel });
  },

  subscribeToConversations: (userId: string) => {
    const { conversationChannel } = get();
    if (conversationChannel) supabase.removeChannel(conversationChannel);

    const channel = supabase
      .channel(`chat:inbox:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message;
          set((state) => {
            const convIndex = state.conversations.findIndex(
              (c) => c.id === msg.conversation_id
            );
            if (convIndex === -1) {
              // New conversation not yet in list — full refresh to get profile data
              get().fetchConversations(userId);
              return state;
            }
            const updated = [...state.conversations];
            const conv = { ...updated[convIndex] };
            conv.last_message = msg.content;
            conv.last_message_at = msg.created_at;
            if (msg.sender_id !== userId) {
              conv.unread_count = (conv.unread_count || 0) + 1;
            }
            // Bubble updated conversation to the top
            updated.splice(convIndex, 1);
            updated.unshift(conv);
            return { conversations: updated };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message;
          // When a message is marked read, decrement the unread badge
          if (msg.read) {
            set((state) => ({
              conversations: state.conversations.map((c) => {
                if (c.id !== msg.conversation_id) return c;
                return { ...c, unread_count: Math.max(0, (c.unread_count || 0) - 1) };
              }),
            }));
          }
        }
      )
      .subscribe();

    set({ conversationChannel: channel });
  },

  unsubscribeMessages: () => {
    const { messageChannel } = get();
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
      set({ messageChannel: null });
    }
  },

  unsubscribeConversations: () => {
    const { conversationChannel } = get();
    if (conversationChannel) {
      supabase.removeChannel(conversationChannel);
      set({ conversationChannel: null });
    }
  },

  markMessagesAsRead: async (conversationId: string, userId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  getUnreadCount: async (userId: string) => {
    try {
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

      if (!convos || convos.length === 0) return 0;

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convos.map((c) => c.id))
        .eq('read', false)
        .neq('sender_id', userId);

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },
}));
