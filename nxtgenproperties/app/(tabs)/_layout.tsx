import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Animated, View, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

// Tab design: icon + small label below, stacked vertically. Active state is
// signalled by the primary colour and a filled icon variant. No horizontal
// expansion — keeps every item inside its own slot so nothing can clip.

function TabItem({
  focused,
  name,
  outlineName,
  label,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>['name'];
  outlineName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(focused ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.05 : 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const color = focused ? colors.primary : colors.outline;

  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 4,
      }}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <Ionicons name={focused ? name : outlineName} size={22} color={color} />
        <Text
          numberOfLines={1}
          style={{
            color,
            fontSize: 10,
            fontWeight: focused ? '700' : '500',
            marginTop: 2,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

function PostButton({ focused }: { focused: boolean }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      friction: 4,
      tension: 160,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <View
      style={{
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -18,
      }}
    >
      <Animated.View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: colors.surface,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: focused ? 0.5 : 0.35,
          shadowRadius: 10,
          elevation: 10,
          transform: [{ scale }],
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 14,
          right: 14,
          height: 68,
          backgroundColor: colors.surface,
          borderRadius: 32,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 14,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} name="home" outlineName="home-outline" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} name="search" outlineName="search-outline" label="Search" />
          ),
        }}
      />
      <Tabs.Screen
        name="post/index"
        options={{
          tabBarIcon: ({ focused }) => <PostButton focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              focused={focused}
              name="chatbubble"
              outlineName="chatbubble-outline"
              label="Inbox"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} name="person" outlineName="person-outline" label="Account" />
          ),
        }}
      />
      {/* Hide non-tab routes */}
      <Tabs.Screen name="favorite" options={{ href: null }} />
      <Tabs.Screen name="search/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
