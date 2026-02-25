import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Conversation, Message } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/lib/supabase';

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
  return format(date, 'MMM d, h:mm a');
}

function getAvatarUrl(name?: string, url?: string) {
  return (
    url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&size=80&background=FF6B35&color=fff`
  );
}

function ReadReceipt({ isSender, read }: { isSender: boolean; read: boolean }) {
  if (!isSender) return null;
  return (
    <View className="flex-row items-center ml-1">
      <Ionicons
        name="checkmark-done"
        size={14}
        color={read ? '#3B82F6' : '#D1D5DB'}
      />
    </View>
  );
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const {
    conversations,
    currentMessages,
    messagesLoading,
    sendMessage,
    fetchMessages,
    subscribeToMessages,
    unsubscribe,
    markMessagesAsRead,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loadingConvo, setLoadingConvo] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const conversationId = Array.isArray(id) ? id[0] : id;

  // Fetch conversation details (other_user + property)
  useEffect(() => {
    async function loadConversation() {
      // Try from store first
      const cached = conversations.find((c) => c.id === conversationId);
      if (cached?.other_user) {
        setConversation(cached);
        setLoadingConvo(false);
        return;
      }

      // Fetch from Supabase
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (!conv || !user?.id) {
          setLoadingConvo(false);
          return;
        }

        const otherUserId =
          conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

        const { data: profile } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('user_id', otherUserId)
          .single();

        let property;
        if (conv.property_id) {
          const { data: prop } = await supabase
            .from('properties')
            .select('id, title, price, type, photos, locality, city')
            .eq('id', conv.property_id)
            .single();
          property = prop || undefined;
        }

        setConversation({
          ...conv,
          other_user: profile || undefined,
          property: property || undefined,
        });
      } catch (e) {
        console.error('Error loading conversation:', e);
      } finally {
        setLoadingConvo(false);
      }
    }

    loadConversation();
  }, [conversationId, user?.id, conversations]);

  // Fetch messages + realtime subscription
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      subscribeToMessages(conversationId);
      if (user?.id) {
        markMessagesAsRead(conversationId, user.id);
      }
    }
    return () => {
      unsubscribe();
    };
  }, [conversationId, user?.id]);

  // Mark new incoming messages as read
  useEffect(() => {
    if (conversationId && user?.id && currentMessages.length > 0) {
      const hasUnread = currentMessages.some(
        (m) => m.sender_id !== user.id && !m.read
      );
      if (hasUnread) {
        markMessagesAsRead(conversationId, user.id);
      }
    }
  }, [currentMessages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (currentMessages.length > 0) {
      // Small delay to let the FlatList render
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages.length]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !user?.id || !conversationId) return;
    const text = messageText;
    setMessageText('');
    setIsSending(true);
    try {
      await sendMessage(conversationId, user.id, text);
    } catch {
      setMessageText(text); // Restore on failure
    } finally {
      setIsSending(false);
    }
  }, [messageText, user?.id, conversationId, sendMessage]);

  const otherUser = conversation?.other_user;
  const property = conversation?.property;

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)} L`;
    return `${(price / 1000).toFixed(0)}K`;
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isSender = item.sender_id === user?.id;
      return (
        <View
          className={`px-4 py-1 flex-row ${isSender ? 'justify-end' : 'justify-start'}`}
        >
          {/* Other user's avatar on received messages */}
          {!isSender && (
            <Image
              source={{ uri: getAvatarUrl(otherUser?.name, otherUser?.avatar_url) }}
              className="w-7 h-7 rounded-full mr-2 mt-1"
            />
          )}

          <View className="max-w-[75%]">
            <View
              className={`px-4 py-2.5 ${
                isSender
                  ? 'bg-[#FF6B35] rounded-2xl rounded-br-sm'
                  : 'bg-gray-100 rounded-2xl rounded-bl-sm'
              }`}
            >
              <Text
                className={`text-[15px] leading-5 ${
                  isSender ? 'text-white' : 'text-gray-900'
                }`}
              >
                {item.content}
              </Text>
            </View>

            {/* Timestamp + read receipt row */}
            <View
              className={`flex-row items-center mt-0.5 ${
                isSender ? 'justify-end' : 'justify-start'
              }`}
            >
              <Text className="text-[10px] text-gray-400">
                {formatMessageTime(item.created_at)}
              </Text>
              <ReadReceipt isSender={isSender} read={item.read} />
            </View>
          </View>
        </View>
      );
    },
    [user?.id, otherUser]
  );

  if (messagesLoading && loadingConvo) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header with user info */}
        <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row items-center">
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }} 
            className="mr-3"
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Image
            source={{ uri: getAvatarUrl(otherUser?.name, otherUser?.avatar_url) }}
            className="w-10 h-10 rounded-full"
          />

          <View className="flex-1 ml-3">
            <Text className="text-gray-900 text-base font-semibold" numberOfLines={1}>
              {otherUser?.name || 'Loading...'}
            </Text>
            {otherUser?.role && (
              <Text className="text-gray-400 text-xs capitalize">
                {otherUser.role}
              </Text>
            )}
          </View>
        </View>

        {/* Property context card */}
        {property && (
          <TouchableOpacity
            className="mx-4 mt-3 mb-1 p-3 bg-orange-50 border border-orange-100 rounded-xl flex-row items-center"
            activeOpacity={0.7}
            onPress={() => router.push(`/(tabs)/search/${property.id}` as any)}
          >
            {property.photos?.[0] && (
              <Image
                source={{ uri: property.photos[0] }}
                className="w-12 h-12 rounded-lg mr-3"
              />
            )}
            <View className="flex-1">
              <Text className="text-gray-900 text-sm font-semibold" numberOfLines={1}>
                {property.title}
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                {property.locality}, {property.city}
              </Text>
            </View>
            <Text className="text-[#FF6B35] text-sm font-bold ml-2">
              {property.type === 'rent' ? '\u20B9' : '\u20B9'}
              {formatPrice(property.price)}
              {property.type === 'rent' ? '/mo' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: currentMessages.length === 0 ? 'center' : 'flex-end',
            paddingVertical: 8,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View className="items-center justify-center px-6">
              <Ionicons name="chatbubble-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-sm mt-3">
                Send a message to start the conversation
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View className="px-4 py-3 bg-white border-t border-gray-100 flex-row items-end gap-2">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-900 text-[15px] max-h-24"
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className={`rounded-full p-3 items-center justify-center ${
              messageText.trim() ? 'bg-[#FF6B35]' : 'bg-gray-200'
            }`}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={messageText.trim() ? 'white' : '#9CA3AF'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
