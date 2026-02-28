import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { theme } from '@/constants/theme';

function TabIcon({
  name,
  outlineName,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  outlineName: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={focused ? name : outlineName}
        size={22}
        color={focused ? theme.colors.primary : color}
      />
    </Animated.View>
  );
}

function PostTabIcon({ focused }: { focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        width: 54,
        height: 54,
        borderRadius: theme.roundness.xl,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: focused ? 0.5 : 0.35,
        shadowRadius: 10,
        elevation: 10,
        transform: [{ scale }],
      }}
    >
      <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          height: 70,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.roundness.xl,
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 12,
          borderWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" outlineName="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" outlineName="search-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="post/index"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused }) => <PostTabIcon focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          href: null,
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart" outlineName="heart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="chatbubble"
              outlineName="chatbubble-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" outlineName="person-outline" color={color} focused={focused} />
          ),
        }}
      />
      {/* Hide non-tab routes */}
      <Tabs.Screen name="search/[id]" options={{ href: null }} />
    </Tabs>
  );
}
