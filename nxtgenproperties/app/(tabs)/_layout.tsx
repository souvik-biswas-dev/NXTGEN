import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View className={`${focused ? 'bg-blue-50' : ''} p-1.5 rounded-lg`}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View className={`${focused ? 'bg-blue-50' : ''} p-1.5 rounded-lg`}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Sell/Rent',
          tabBarIcon: ({ color, focused }) => (
            <View className="bg-blue-600 p-2.5 rounded-xl -mt-4 shadow-lg">
              <Ionicons name="add" size={28} color="white" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          title: 'Shortlisted',
          tabBarIcon: ({ color, focused }) => (
            <View className={`${focused ? 'bg-blue-50' : ''} p-1.5 rounded-lg`}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={`${focused ? 'bg-blue-50' : ''} p-1.5 rounded-lg`}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      {/* Hide inbox from tabs but keep it accessible */}
      <Tabs.Screen
        name="inbox"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
