import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const chats = [
  { id: 1, name: 'Russel Tailor', message: 'Hello, How can i help you?', time: '1d ago', unread: true },
  { id: 2, name: 'David Miller', message: 'Okay', time: '1d ago', unread: false },
  { id: 3, name: 'Liana George', message: 'You can come tomorrow.', time: '5d ago', unread: false },
  { id: 4, name: 'Suzein Smith', message: 'Nice to talk with you.', time: '1w ago', unread: false },
  { id: 5, name: 'Amenda Johnson', message: 'So what you think?', time: '2w ago', unread: true },
];

export default function InboxScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4">
        <Text className="text-primary text-2xl font-bold">Chats</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100"
          >
            <View className="w-14 h-14 bg-gray-300 rounded-full mr-4" />
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-900 text-base font-semibold">{chat.name}</Text>
                <Text className="text-gray-500 text-xs">{chat.time}</Text>
              </View>
              <Text className="text-gray-600 text-sm">{chat.message}</Text>
            </View>
            {chat.unread && (
              <View className="w-2 h-2 bg-primary rounded-full ml-2" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
