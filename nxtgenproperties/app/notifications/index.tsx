import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useAuthStore } from '@/stores/authStore';
import { InAppNotification, NotificationType } from '@/types';
import { theme } from '@/constants/theme';

const TYPE_META: Record<
  NotificationType,
  { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }
> = {
  match: { icon: 'home', color: theme.colors.primary },
  price_drop: { icon: 'trending-down', color: theme.colors.success },
  message: { icon: 'chatbubble', color: '#3B82F6' },
  inquiry: { icon: 'mail', color: '#8B5CF6' },
  site_visit: { icon: 'calendar', color: theme.colors.gold },
  subscription: { icon: 'ribbon', color: '#EC4899' },
  system: { icon: 'information-circle', color: theme.colors.outline },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications, loading, unreadCount, fetch, markRead, markAllRead, remove } =
    useNotificationsStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (user) fetch();
  }, [user, fetch]);

  const handlePress = (n: InAppNotification) => {
    if (!n.read) markRead(n.id);
    // Route by type → property detail, chat, visits, etc.
    const data = n.data as Record<string, string> | undefined;
    if (n.type === 'match' || n.type === 'price_drop') {
      const pid = data?.property_id;
      if (pid) router.push(`/(tabs)/search/${pid}`);
    } else if (n.type === 'message') {
      const cid = data?.conversation_id;
      if (cid) router.push(`/chat/${cid}` as never);
    } else if (n.type === 'site_visit') {
      router.push('/site-visits' as never);
    } else if (n.type === 'subscription') {
      router.push('/membership' as never);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: theme.colors.secondary,
            flex: 1,
            marginLeft: 10,
          }}
        >
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {!user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="notifications-outline" size={48} color={theme.colors.outlineVariant} />
          <Text style={{ color: theme.colors.outline, marginTop: 12 }}>
            Sign in to see your notifications
          </Text>
        </View>
      ) : loading && notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="notifications-outline" size={48} color={theme.colors.outlineVariant} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: theme.colors.secondary,
              marginTop: 12,
            }}
          >
            All caught up
          </Text>
          <Text
            style={{
              color: theme.colors.outline,
              textAlign: 'center',
              fontSize: 13,
              marginTop: 6,
              maxWidth: 260,
            }}
          >
            New matches, price drops and messages will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetch();
                setRefreshing(false);
              }}
              colors={[theme.colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type];
            return (
              <TouchableOpacity
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.outlineVariant,
                  backgroundColor: item.read
                    ? theme.colors.surface
                    : theme.colors.primaryContainer + '40',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.roundness.full,
                    backgroundColor: meta.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: item.read ? '600' : '800',
                      color: theme.colors.secondary,
                      fontSize: 14,
                    }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.body && (
                    <Text
                      style={{ color: theme.colors.outline, fontSize: 13, marginTop: 2 }}
                      numberOfLines={2}
                    >
                      {item.body}
                    </Text>
                  )}
                  <Text style={{ color: theme.colors.outlineVariant, fontSize: 11, marginTop: 4 }}>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => remove(item.id)} style={{ padding: 6 }}>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={theme.colors.outlineVariant}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
