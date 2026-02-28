import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FAQ_DATA = [
  {
    category: 'Listings & Search',
    items: [
      {
        q: 'How do I search for properties?',
        a: 'Use the Search tab at the bottom to filter properties by location, price, type, and BHK configuration. You can also use the home screen search bar for quick lookups.',
      },
      {
        q: 'How do I save a property to my favorites?',
        a: 'Tap the heart icon on any property card or detail page to save it. Saved properties are accessible from the Favorites section in your profile.',
      },
      {
        q: 'Can I post a property listing?',
        a: 'Yes. Tap the + button in the centre of the tab bar to create a new listing. You need to be registered as an Owner or Broker to post properties.',
      },
      {
        q: 'How are property prices calculated?',
        a: 'Prices are set by the property owner or broker. NxtGenProperties does not add any markup. Use the EMI Calculator in the Tools section to plan your finances.',
      },
    ],
  },
  {
    category: 'Account & Profile',
    items: [
      {
        q: 'How do I change my password?',
        a: 'Go to Settings → Change Password. A reset link will be sent to your registered email address.',
      },
      {
        q: 'How do I become a verified broker?',
        a: 'Go to your Profile and tap "Request Verification". You will need to submit your RERA number, government ID, and address proof. Verification takes 2–3 business days.',
      },
      {
        q: 'Can I change my account role (Buyer/Owner/Broker)?',
        a: 'Account roles are set during sign-up and cannot be changed by the user. Contact our support team to request a role change.',
      },
    ],
  },
  {
    category: 'Payments & Subscription',
    items: [
      {
        q: 'What plans are available?',
        a: 'We offer Free, Standard, and Premium plans. Premium unlocks unlimited listings, priority placement, and advanced analytics. See Plans in your profile for details.',
      },
      {
        q: 'How do I cancel my subscription?',
        a: "Subscriptions are managed through the App Store or Google Play. Open your device's subscription settings and cancel from there.",
      },
      {
        q: 'Will I get a refund if I cancel?',
        a: 'Refunds follow the App Store / Google Play refund policy. Contact their support or reach out to us within 48 hours of purchase for assistance.',
      },
    ],
  },
];

const CONTACT_CHANNELS: {
  icon: IoniconsName;
  title: string;
  subtitle: string;
  action: () => void;
  color: string;
}[] = [
  {
    icon: 'mail-outline',
    title: 'Email Support',
    subtitle: 'support@nxtgenproperties.com',
    action: () => Linking.openURL('mailto:support@nxtgenproperties.com?subject=Help%20Request'),
    color: '#3B82F6',
  },
  {
    icon: 'logo-whatsapp',
    title: 'WhatsApp',
    subtitle: 'Chat with us on WhatsApp',
    action: () => Linking.openURL('https://wa.me/911234567890'),
    color: '#25D366',
  },
  {
    icon: 'call-outline',
    title: 'Call Us',
    subtitle: '+91 12345 67890  •  Mon–Sat, 9 AM–7 PM',
    action: () => Linking.openURL('tel:+911234567890'),
    color: theme.colors.primary,
  },
  {
    icon: 'bug-outline',
    title: 'Report a Bug',
    subtitle: 'bugs@nxtgenproperties.com',
    action: () => Linking.openURL('mailto:bugs@nxtgenproperties.com?subject=Bug%20Report'),
    color: theme.colors.error,
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => (prev === key ? null : key));
  };

  const filtered = query.trim().length > 1
    ? FAQ_DATA.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (it) =>
            it.q.toLowerCase().includes(query.toLowerCase()) ||
            it.a.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : FAQ_DATA;

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
          Help & Support
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Search bar */}
        <View className="px-4 pt-5 pb-2">
          <View
            className="flex-row items-center px-4 py-3"
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: theme.roundness.xl,
            }}
          >
            <Ionicons name="search-outline" size={20} color={theme.colors.outline} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search FAQs…"
              placeholderTextColor={theme.colors.outline}
              className="flex-1 text-base ml-3"
              style={{ color: theme.colors.secondary }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contact channels */}
        <View className="px-4 mt-4">
          <Text className="text-base font-bold mb-3" style={{ color: theme.colors.secondary }}>
            Contact Us
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {CONTACT_CHANNELS.map((ch) => (
              <TouchableOpacity
                key={ch.title}
                onPress={ch.action}
                activeOpacity={0.75}
                className="flex-1"
                style={{
                  minWidth: '45%',
                  backgroundColor: '#fff',
                  borderRadius: theme.roundness.lg,
                  padding: 14,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View
                  className="w-10 h-10 items-center justify-center mb-3"
                  style={{ backgroundColor: ch.color + '18', borderRadius: theme.roundness.md }}
                >
                  <Ionicons name={ch.icon} size={22} color={ch.color} />
                </View>
                <Text className="font-semibold text-sm" style={{ color: theme.colors.secondary }}>
                  {ch.title}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: theme.colors.outline }}>
                  {ch.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ accordion */}
        <View className="px-4 mt-6">
          <Text className="text-base font-bold mb-3" style={{ color: theme.colors.secondary }}>
            Frequently Asked Questions
          </Text>

          {filtered.length === 0 && (
            <View className="items-center py-10">
              <Ionicons name="search-outline" size={40} color={theme.colors.outlineVariant} />
              <Text className="mt-3 text-sm" style={{ color: theme.colors.outline }}>
                No results for "{query}"
              </Text>
            </View>
          )}

          {filtered.map((cat) => (
            <View key={cat.category} className="mb-5">
              <Text
                className="text-xs font-semibold uppercase mb-2 tracking-widest"
                style={{ color: theme.colors.outline }}
              >
                {cat.category}
              </Text>
              <View
                className="bg-white rounded-2xl overflow-hidden"
                style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                {cat.items.map((item, idx) => {
                  const key = `${cat.category}-${idx}`;
                  const open = expanded === key;
                  return (
                    <View key={key}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggle(key)}
                        className="flex-row items-center justify-between px-4 py-4"
                        style={
                          idx < cat.items.length - 1 || open
                            ? { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }
                            : undefined
                        }
                      >
                        <Text
                          className="flex-1 text-sm font-medium pr-3"
                          style={{ color: theme.colors.secondary }}
                        >
                          {item.q}
                        </Text>
                        <Ionicons
                          name={open ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={theme.colors.outlineVariant}
                        />
                      </TouchableOpacity>
                      {open && (
                        <View
                          className="px-4 pb-4 pt-2"
                          style={{ backgroundColor: theme.colors.surfaceVariant + '60' }}
                        >
                          <Text className="text-sm leading-6" style={{ color: theme.colors.outline }}>
                            {item.a}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
