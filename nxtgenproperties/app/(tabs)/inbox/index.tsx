import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { theme } from '@/constants/theme';

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { conversations, loading, fetchConversations, subscribeToConversations, unsubscribeConversations } = useChatStore();

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      fetchConversations(user.id);
      subscribeToConversations(user.id);
      return () => {
        unsubscribeConversations();
      };
    }, [user?.id])
  );

  const handleConversationPress = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      {/* Header */}
      <View className="px-6 pt-6 pb-4" style={{ backgroundColor: theme.colors.surface }}>
        <Text className="text-3xl font-bold" style={{ color: theme.colors.secondary }}>Chats</Text>
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6" style={{ paddingBottom: theme.tabBarHeight }}>
          <View className="w-28 h-28 rounded-full items-center justify-center mb-5" style={{ backgroundColor: theme.colors.primaryContainer }}>
            <Ionicons name="chatbubble-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text className="text-xl font-semibold" style={{ color: theme.colors.secondary }}>No conversations</Text>
          <Text className="text-sm mt-3 text-center" style={{ color: theme.colors.outline }}>
            Start a conversation with property owners or brokers
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleConversationPress(item.id)}
              className="mx-4 mb-2 px-4 py-3.5 flex-row items-center"
              style={{ backgroundColor: theme.colors.surface, borderRadius: theme.roundness.lg }}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={{ borderRadius: 9999, borderWidth: 2, borderColor: theme.colors.primaryContainer }}>
                <Image
                  source={{
                    uri: item.other_user?.avatar_url ||
                      'https://ui-avatars.com/api/?name=' +
                      (item.other_user?.name || 'User') +
                      '&size=50&background=FF6B35&color=fff',
                  }}
                  className="w-12 h-12 rounded-full"
                />
              </View>

              {/* Conversation Info */}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold" style={{ color: theme.colors.secondary }}>
                    {item.other_user?.name || 'Unknown User'}
                  </Text>
                  <Text className="text-xs" style={{ color: theme.colors.outlineVariant }}>
                    {item.last_message_at
                      ? formatDistanceToNow(new Date(item.last_message_at), {
                        addSuffix: true,
                      })
                      : ''}
                  </Text>
                </View>
                <Text className="text-sm mt-1 line-clamp-1" style={{ color: theme.colors.outline }}>
                  {item.last_message || 'No messages yet'}
                </Text>
              </View>

              {/* Unread Indicator */}
              {item.unread_count && item.unread_count > 0 && (
                <View className="ml-3 px-2.5 py-1 items-center justify-center" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.roundness.full }}>
                  <Text className="text-white text-xs font-bold">
                    {item.unread_count > 9 ? '9+' : item.unread_count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: theme.tabBarHeight + 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
