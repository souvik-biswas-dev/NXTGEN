import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BrokerBadgeProps {
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrokerBadge: React.FC<BrokerBadgeProps> = ({ verified = false, size = 'md' }) => {
  if (!verified) return null;

  const sizeClasses = {
    sm: 'px-2 py-1',
    md: 'px-3 py-1.5',
    lg: 'px-4 py-2',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <View className={`bg-yellow-400 rounded-full flex-row items-center ${sizeClasses[size]}`}>
      <Ionicons name="star" size={iconSizes[size]} color="#1A1A1A" />
      <Text className={`text-gray-900 font-semibold ml-1 ${textSizeClasses[size]}`}>
        Verified Broker
      </Text>
    </View>
  );
};
