import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Animated, View } from 'react-native';
import { useRef, useEffect } from 'react';
import { theme } from '@/constants/theme';

// Signature design choice: inactive tabs are icon-only (dim), the ACTIVE tab
// inflates into a navy pill showing icon + label. It's instantly clear which
// tab you're on without relying on subtle colour tints, and keeps the bar
// compact when glanced at.

function Pill({
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
  const widthAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: focused ? 1 : 0,
      friction: 8,
      tension: 120,
      useNativeDriver: false,
    }).start();
  }, [focused, widthAnim]);

  const extraWidth = widthAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 72] });
  const labelOpacity = widthAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={{
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 40,
          paddingHorizontal: 12,
          borderRadius: 20,
          backgroundColor: focused ? theme.colors.secondary : 'transparent',
        }}
      >
        <Ionicons
          name={focused ? name : outlineName}
          size={20}
          color={focused ? '#fff' : theme.colors.outline}
        />
        <Animated.View style={{ overflow: 'hidden', width: extraWidth }}>
          <Animated.Text
            numberOfLines={1}
            style={{
              color: '#fff',
              fontWeight: '700',
              fontSize: 12,
              marginLeft: 6,
              opacity: labelOpacity,
            }}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Raised Post FAB — sits half above the tab bar for a clear primary CTA.
function PostButton({ focused }: { focused: boolean }) {
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
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: theme.colors.surface,
          shadowColor: theme.colors.primary,
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 14,
          right: 14,
          height: 64,
          backgroundColor: theme.colors.surface,
          borderRadius: 32,
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 4,
          shadowColor: '#1B2838',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 14,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
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
            <Pill focused={focused} name="home" outlineName="home-outline" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pill focused={focused} name="search" outlineName="search-outline" label="Search" />
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
        name="favorite"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pill focused={focused} name="heart" outlineName="heart-outline" label="Saved" />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Pill
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
            <Pill focused={focused} name="person" outlineName="person-outline" label="Account" />
          ),
        }}
      />
      {/* Hide non-tab routes */}
      <Tabs.Screen
        name="search/[id]"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
