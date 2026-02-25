import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { theme } from '@/constants/theme';

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
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.roundness.full,
                      paddingHorizontal: 16,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? 'white' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.roundness.full,
                      paddingHorizontal: 16,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={22}
                color={focused ? 'white' : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="post/index"
        options={{
          title: 'Post',
          tabBarIcon: () => (
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: theme.roundness.xl,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              <Ionicons name="add" size={30} color={theme.colors.onPrimary} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: theme.roundness.full,
                      paddingHorizontal: 16,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="inbox/index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: theme.roundness.full,
                      paddingHorizontal: 16,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <Ionicons
                name={focused ? 'chatbubble' : 'chatbubble-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={
                focused
                  ? {
                      backgroundColor: theme.colors.primaryContainer,
                      borderRadius: theme.roundness.full,
                      paddingHorizontal: 16,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      {/* Hide non-tab routes */}
      <Tabs.Screen name="search/[id]" options={{ href: null }} />
    </Tabs>
  );
}
