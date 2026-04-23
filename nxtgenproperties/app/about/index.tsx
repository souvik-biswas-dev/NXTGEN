import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IoniconsName; title: string; description: string }[] = [
  {
    icon: 'search-outline',
    title: 'Smart Search',
    description: 'Filter by location, price, type, BHK, and more to find the perfect property.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified Listings',
    description: 'RERA-verified brokers and owner-posted listings for a trustworthy experience.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Direct Chat',
    description: 'Connect directly with owners and brokers without middlemen.',
  },
  {
    icon: 'calculator-outline',
    title: 'Financial Tools',
    description: 'Built-in EMI and budget calculators to plan your investment.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Market Insights',
    description: 'Stay informed with real-time price trends and locality reports.',
  },
];

const LEGAL_LINKS: { label: string; url: string }[] = [
  { label: 'Privacy Policy', url: 'https://nxtgenproperties.com/privacy' },
  { label: 'Terms of Service', url: 'https://nxtgenproperties.com/terms' },
  { label: 'Cookie Policy', url: 'https://nxtgenproperties.com/cookies' },
  { label: 'RERA Compliance', url: 'https://nxtgenproperties.com/rera' },
];

const SOCIAL: { icon: IoniconsName; label: string; url: string; color: string }[] = [
  {
    icon: 'logo-instagram',
    label: 'Instagram',
    url: 'https://instagram.com/nxtgenproperties',
    color: '#E1306C',
  },
  {
    icon: 'logo-linkedin',
    label: 'LinkedIn',
    url: 'https://linkedin.com/company/nxtgenproperties',
    color: '#0A66C2',
  },
  {
    icon: 'logo-twitter',
    label: 'Twitter / X',
    url: 'https://twitter.com/nxtgenprops',
    color: '#1DA1F2',
  },
  {
    icon: 'logo-youtube',
    label: 'YouTube',
    url: 'https://youtube.com/@nxtgenproperties',
    color: '#FF0000',
  },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.surface }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: theme.colors.secondary }}>
          About
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <LinearGradient
          colors={['#FF6B35', '#F7931E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-5 rounded-3xl p-6 items-center"
        >
          <View
            className="w-20 h-20 items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: theme.roundness.xl }}
          >
            <Ionicons name="home" size={42} color="white" />
          </View>
          <Text className="text-white text-2xl font-bold">NxtGen Properties</Text>
          <Text className="text-white/80 text-sm mt-1">
            India's Next Generation Real Estate Platform
          </Text>
          <View className="flex-row mt-4 gap-3">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Text className="text-white text-xs font-semibold">v{APP_VERSION}</Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Text className="text-white text-xs font-semibold">Build {BUILD_NUMBER}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Mission */}
        <View className="px-4 mt-6">
          <Text className="text-base font-bold mb-2" style={{ color: theme.colors.secondary }}>
            Our Mission
          </Text>
          <Text className="text-sm leading-6" style={{ color: theme.colors.outline }}>
            NxtGenProperties is built to simplify India's real estate journey. Whether you are
            searching for your dream home, listing a property, or tracking the market — we bring
            buyers, owners, and brokers together in one trusted platform.
          </Text>
        </View>

        {/* Key features */}
        <View className="px-4 mt-6">
          <Text className="text-base font-bold mb-3" style={{ color: theme.colors.secondary }}>
            What We Offer
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            {FEATURES.map((f, i) => (
              <View
                key={f.title}
                className="flex-row items-start px-4 py-4"
                style={
                  i < FEATURES.length - 1
                    ? { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }
                    : undefined
                }
              >
                <View
                  className="w-10 h-10 items-center justify-center mr-3 mt-0.5"
                  style={{
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: theme.roundness.md,
                  }}
                >
                  <Ionicons name={f.icon} size={20} color={theme.colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold" style={{ color: theme.colors.secondary }}>
                    {f.title}
                  </Text>
                  <Text className="text-xs mt-1 leading-5" style={{ color: theme.colors.outline }}>
                    {f.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Social links */}
        <View className="px-4 mt-6">
          <Text className="text-base font-bold mb-3" style={{ color: theme.colors.secondary }}>
            Follow Us
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {SOCIAL.map((s) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => Linking.openURL(s.url)}
                activeOpacity={0.75}
                className="flex-row items-center px-4 py-3"
                style={{
                  backgroundColor: '#fff',
                  borderRadius: theme.roundness.lg,
                  flex: 1,
                  minWidth: '45%',
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                  gap: 8,
                }}
              >
                <Ionicons name={s.icon} size={22} color={s.color} />
                <Text className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legal */}
        <View className="px-4 mt-6">
          <Text className="text-base font-bold mb-3" style={{ color: theme.colors.secondary }}>
            Legal
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
          >
            {LEGAL_LINKS.map((l, i) => (
              <TouchableOpacity
                key={l.label}
                onPress={() => Linking.openURL(l.url)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between px-4 py-4"
                style={
                  i < LEGAL_LINKS.length - 1
                    ? { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }
                    : undefined
                }
              >
                <Text className="text-base" style={{ color: theme.colors.secondary }}>
                  {l.label}
                </Text>
                <Ionicons name="open-outline" size={16} color={theme.colors.outlineVariant} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="items-center mt-8 mb-12 px-4">
          <Text className="text-xs text-center" style={{ color: theme.colors.outlineVariant }}>
            © {new Date().getFullYear()} NxtGen Properties Pvt. Ltd.{'\n'}
            All rights reserved. Made with ❤️ in India.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
