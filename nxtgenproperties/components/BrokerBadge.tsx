import React from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface BrokerBadgeProps {
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'premium' | 'trusted';
}

interface BrokerCardProps {
  name: string;
  phone: string;
  verified?: boolean;
  rating?: number;
  totalDeals?: number;
  experience?: number;
  specialization?: string[];
  responseTime?: string;
  onContact?: () => void;
}

interface BrokerProfileModalProps {
  visible: boolean;
  onClose: () => void;
  broker: {
    name: string;
    phone: string;
    verified?: boolean;
    rating?: number;
    totalDeals?: number;
    experience?: number;
    specialization?: string[];
    responseTime?: string;
  };
}

export const BrokerBadge: React.FC<BrokerBadgeProps> = ({ 
  verified = false, 
  size = 'md',
  variant = 'badge' 
}) => {
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

  if (variant === 'premium') {
    return (
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={`rounded-full flex-row items-center ${sizeClasses[size]}`}
      >
        <Ionicons name="shield-checkmark" size={iconSizes[size]} color="#1A1A1A" />
        <Text className={`text-gray-900 font-bold ml-1 ${textSizeClasses[size]}`}>
          Premium Broker
        </Text>
      </LinearGradient>
    );
  }

  if (variant === 'trusted') {
    return (
      <View className={`bg-green-500 rounded-full flex-row items-center ${sizeClasses[size]}`}>
        <Ionicons name="checkmark-circle" size={iconSizes[size]} color="white" />
        <Text className={`text-white font-semibold ml-1 ${textSizeClasses[size]}`}>
          Trusted Seller
        </Text>
      </View>
    );
  }

  return (
    <View className={`bg-yellow-400 rounded-full flex-row items-center ${sizeClasses[size]}`}>
      <Ionicons name="star" size={iconSizes[size]} color="#1A1A1A" />
      <Text className={`text-gray-900 font-semibold ml-1 ${textSizeClasses[size]}`}>
        Verified Broker
      </Text>
    </View>
  );
};

export const BrokerCard: React.FC<BrokerCardProps> = ({
  name,
  phone,
  verified = false,
  rating = 4.5,
  totalDeals = 0,
  experience = 0,
  specialization = [],
  responseTime = 'Usually responds within 1 hour',
  onContact,
}) => {
  const handleCall = () => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi, I am interested in your property listed on NxtGen Properties');
    Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`);
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center">
          <Text className="text-2xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="ml-4 flex-1">
          <View className="flex-row items-center">
            <Text className="text-lg font-bold text-gray-900">{name}</Text>
            {verified && (
              <View className="ml-2 bg-primary rounded-full p-0.5">
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text className="text-gray-700 ml-1 font-medium">{rating.toFixed(1)}</Text>
            <Text className="text-gray-400 mx-2">•</Text>
            <Text className="text-gray-500">{totalDeals}+ Deals</Text>
          </View>
          {verified && (
            <BrokerBadge verified={true} size="sm" variant="badge" />
          )}
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row bg-gray-50 rounded-xl p-3 mb-4">
        <View className="flex-1 items-center border-r border-gray-200">
          <Text className="text-xl font-bold text-primary">{experience}+</Text>
          <Text className="text-xs text-gray-500">Years Exp</Text>
        </View>
        <View className="flex-1 items-center border-r border-gray-200">
          <Text className="text-xl font-bold text-green-600">{totalDeals}+</Text>
          <Text className="text-xs text-gray-500">Properties</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-xl font-bold text-orange-600">{rating.toFixed(1)}</Text>
          <Text className="text-xs text-gray-500">Rating</Text>
        </View>
      </View>

      {/* Specialization */}
      {specialization.length > 0 && (
        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-2">Specializes in</Text>
          <View className="flex-row flex-wrap">
            {specialization.map((spec, index) => (
              <View key={index} className="bg-orange-50 rounded-full px-3 py-1 mr-2 mb-2">
                <Text className="text-primary text-xs font-medium">{spec}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Response Time */}
      <View className="flex-row items-center mb-4 bg-green-50 rounded-lg p-2">
        <Ionicons name="time-outline" size={16} color="#22C55E" />
        <Text className="text-green-600 text-xs ml-2 font-medium">{responseTime}</Text>
      </View>

      {/* Actions */}
      <View className="flex-row">
        <TouchableOpacity 
          onPress={handleCall}
          className="flex-1 bg-primary rounded-xl py-3 flex-row items-center justify-center mr-2"
        >
          <Ionicons name="call" size={18} color="white" />
          <Text className="text-white font-semibold ml-2">Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleWhatsApp}
          className="flex-1 bg-green-500 rounded-xl py-3 flex-row items-center justify-center"
        >
          <Ionicons name="logo-whatsapp" size={18} color="white" />
          <Text className="text-white font-semibold ml-2">WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const BrokerProfileModal: React.FC<BrokerProfileModalProps> = ({
  visible,
  onClose,
  broker,
}) => {
  const handleCall = () => {
    Linking.openURL(`tel:${broker.phone}`);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi, I am interested in your property listed on NxtGen Properties');
    Linking.openURL(`https://wa.me/${broker.phone.replace(/[^0-9]/g, '')}?text=${message}`);
  };

  const handleReport = () => {
    Alert.alert(
      'Report Broker',
      'Are you sure you want to report this broker?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thank you for your feedback. We will review this report.') }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-4">
            <Text className="text-lg font-bold text-gray-900">Broker Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="px-4 pb-8">
            {/* Profile Header */}
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-gradient-to-br from-primary to-orange-600 rounded-full items-center justify-center mb-3">
                <Text className="text-4xl font-bold text-white">
                  {broker.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-gray-900">{broker.name}</Text>
                {broker.verified && (
                  <View className="ml-2 bg-primary rounded-full p-1">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>
              <View className="flex-row items-center mt-2">
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text className="text-gray-700 ml-1 font-semibold">{broker.rating?.toFixed(1) || '4.5'}</Text>
                <Text className="text-gray-400 mx-2">•</Text>
                <Text className="text-gray-500">{broker.totalDeals || 0}+ Deals</Text>
              </View>
              {broker.verified && (
                <View className="mt-3">
                  <BrokerBadge verified={true} size="md" variant="premium" />
                </View>
              )}
            </View>

            {/* Stats Grid */}
            <View className="flex-row bg-gray-50 rounded-2xl p-4 mb-6">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">{broker.experience || 5}+</Text>
                <Text className="text-sm text-gray-500">Years Experience</Text>
              </View>
              <View className="flex-1 items-center border-l border-gray-200">
                <Text className="text-2xl font-bold text-green-600">{broker.totalDeals || 0}+</Text>
                <Text className="text-sm text-gray-500">Properties Sold</Text>
              </View>
            </View>

            {/* Specialization */}
            {broker.specialization && broker.specialization.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Specializes in</Text>
                <View className="flex-row flex-wrap">
                  {broker.specialization.map((spec, index) => (
                    <View key={index} className="bg-orange-50 rounded-full px-4 py-2 mr-2 mb-2">
                      <Text className="text-primary font-medium">{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Response Time */}
            <View className="flex-row items-center bg-green-50 rounded-xl p-3 mb-6">
              <Ionicons name="flash" size={20} color="#22C55E" />
              <Text className="text-green-700 ml-2 font-medium">
                {broker.responseTime || 'Usually responds within 1 hour'}
              </Text>
            </View>

            {/* Trust Indicators */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3">Trust Indicators</Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={20} color="#FF6B35" />
                  <Text className="text-gray-600 ml-3">Identity Verified</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="call" size={20} color="#FF6B35" />
                  <Text className="text-gray-600 ml-3">Phone Number Verified</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="document-text" size={20} color="#FF6B35" />
                  <Text className="text-gray-600 ml-3">RERA Registered</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row mb-4">
              <TouchableOpacity 
                onPress={handleCall}
                className="flex-1 bg-primary rounded-xl py-4 flex-row items-center justify-center mr-2"
              >
                <Ionicons name="call" size={20} color="white" />
                <Text className="text-white font-bold ml-2">Call Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleWhatsApp}
                className="flex-1 bg-green-500 rounded-xl py-4 flex-row items-center justify-center"
              >
                <Ionicons name="logo-whatsapp" size={20} color="white" />
                <Text className="text-white font-bold ml-2">WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Report */}
            <TouchableOpacity 
              onPress={handleReport}
              className="flex-row items-center justify-center py-2"
            >
              <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
              <Text className="text-gray-400 ml-2 text-sm">Report this broker</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Verification Request Component for brokers to get verified
export const VerificationRequestCard: React.FC<{ onRequest: () => void }> = ({ onRequest }) => {
  return (
    <LinearGradient
      colors={['#FF6B35', '#E5571E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-5 mx-4 my-4"
    >
      <View className="flex-row items-start">
        <View className="bg-white/20 rounded-full p-3">
          <Ionicons name="shield-checkmark" size={28} color="white" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-white text-lg font-bold mb-1">Get Verified</Text>
          <Text className="text-white/80 text-sm mb-4">
            Verified brokers get 3x more leads and higher visibility in search results.
          </Text>
          <TouchableOpacity 
            onPress={onRequest}
            className="bg-white rounded-xl py-3 items-center"
          >
            <Text className="text-primary font-bold">Request Verification</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};
