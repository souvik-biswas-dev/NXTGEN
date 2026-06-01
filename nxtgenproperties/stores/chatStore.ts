import { create } from 'zustand';
import { Conversation, Message } from '@/types';
import { api } from '@/lib/api';
import { realtime, RealtimeEvent } from '@/lib/realtime';

interface ChatState {
  conversations: Conversation[];
  currentMessages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  // Unsubscribe handles for the active realtime listeners.
  _roomUnsub: (() => void) | null;
  _inboxUnsub: (() => void) | null;
  _openConversationId: string | null;
  _currentUserId: string | null;

  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string) => Promise<void>;
  getOrCreateConversation: (
    currentUserId: string,
    otherUserId: string,
    propertyId?: string
  ) => Promise<string | null>;

  subscribeToMessages: (conversationId: string, currentUserId: string) => void;
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
  _roomUnsub: null,
  _inboxUnsub: null,
  _openConversationId: null,
  _currentUserId: null,

  fetchConversations: async (userId: string) => {
    set({ loading: true, error: null, _currentUserId: userId });
    try {
      const { items } = await api.get<{ items: Conversation[] }>('/chat/conversations');
      set({ conversations: items ?? [], loading: false });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversations',
      });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ messagesLoading: true, error: null });
    try {
      const { items } = await api.get<{ items: Message[] }>(
        `/chat/conversations/${conversationId}/messages`
      );
      set({ currentMessages: items ?? [], messagesLoading: false });
    } catch (error) {
      set({
        messagesLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      });
    }
  },

  sendMessage: async (conversationId: string, _senderId: string, content: string) => {
    try {
      set({ error: null });
      // The backend echoes the message back over the websocket, so we don't
      // optimistically append here — the realtime handler does.
      await api.post(`/chat/conversations/${conversationId}/messages`, { content: content.trim() });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: msg });
      throw error;
    }
  },

  getOrCreateConversation: async (_currentUserId, otherUserId, propertyId) => {
    try {
      const { id } = await api.post<{ id: string }>('/chat/conversations', {
        otherUserId,
        propertyId,
      });
      return id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  subscribeToMessages: (conversationId: string, currentUserId: string) => {
    get().unsubscribeMessages();
    realtime.start();
    set({ _openConversationId: conversationId });

    const unsub = realtime.subscribe((e: RealtimeEvent) => {
      if (e.conversationId !== conversationId) return;
      if (e.type === 'message:new') {
        const newMessage = e.payload as Message;
        set((state) => {
          if (state.currentMessages.some((m) => m.id === newMessage.id)) return state;
          return { currentMessages: [...state.currentMessages, newMessage] };
        });
        if (newMessage.sender_id !== currentUserId) {
          get().markMessagesAsRead(conversationId, currentUserId);
        }
      } else if (e.type === 'message:read') {
        set((state) => ({
          currentMessages: state.currentMessages.map((m) =>
            m.sender_id === currentUserId ? { ...m, read: true } : m
          ),
        }));
      }
    });
    set({ _roomUnsub: unsub });
  },

  subscribeToConversations: (userId: string) => {
    get().unsubscribeConversations();
    realtime.start();
    set({ _currentUserId: userId });

    const unsub = realtime.subscribe((e: RealtimeEvent) => {
      if (e.type !== 'message:new') return;
      const msg = e.payload as Message;
      set((state) => {
        const idx = state.conversations.findIndex((c) => c.id === msg.conversation_id);
        if (idx === -1) {
          get().fetchConversations(userId);
          return state;
        }
        const updated = [...state.conversations];
        const conv = { ...updated[idx] };
        conv.last_message = msg.content;
        conv.last_message_at = msg.created_at;
        const isOpen = get()._openConversationId === msg.conversation_id;
        if (msg.sender_id !== userId && !isOpen) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }
        updated.splice(idx, 1);
        updated.unshift(conv);
        return { conversations: updated };
      });
    });
    set({ _inboxUnsub: unsub });
  },

  unsubscribeMessages: () => {
    get()._roomUnsub?.();
    set({ _roomUnsub: null, _openConversationId: null });
  },

  unsubscribeConversations: () => {
    get()._inboxUnsub?.();
    set({ _inboxUnsub: null });
  },

  markMessagesAsRead: async (conversationId: string) => {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  getUnreadCount: async () => {
    try {
      const { count } = await api.get<{ count: number }>('/chat/unread-count');
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },
}));
