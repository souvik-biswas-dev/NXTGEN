import { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore, PlanDefinition } from '@/stores/subscriptionStore';
import { SubscriptionPlan } from '@/types';

const PLAN_ORDER: SubscriptionPlan[] = ['free', 'silver', 'gold'];

export default function MembershipScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { subscription, plans, loading, fetchSubscription, subscribe } = useSubscriptionStore();

  const currentPlan: SubscriptionPlan = subscription?.plan ?? 'free';

  useFocusEffect(
    useCallback(() => {
      fetchSubscription();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;

    const planIndex = PLAN_ORDER.indexOf(plan);
    const currentIndex = PLAN_ORDER.indexOf(currentPlan);
    const isDowngrade = planIndex < currentIndex;

    // Paid plans go through Razorpay checkout; downgrade/free stays here.
    if (!isDowngrade && (plan === 'silver' || plan === 'gold')) {
      router.push({ pathname: '/membership/checkout', params: { plan } } as any);
      return;
    }

    const action = isDowngrade ? 'downgrade' : 'upgrade';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Plan`,
      `Are you sure you want to ${action} to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await subscribe(plan);
              Alert.alert('Success', 'Your plan has been updated.');
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to update plan. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const getButtonLabel = (plan: SubscriptionPlan): string => {
    if (plan === currentPlan) return 'Current Plan';
    const planIndex = PLAN_ORDER.indexOf(plan);
    const currentIndex = PLAN_ORDER.indexOf(currentPlan);
    return planIndex < currentIndex ? 'Downgrade' : 'Subscribe';
  };

  const renderPlanCard = (planDef: PlanDefinition) => {
    const isCurrent = planDef.plan === currentPlan;
    const buttonLabel = getButtonLabel(planDef.plan);

    if (planDef.plan === 'gold') {
      return (
        <LinearGradient
          key={planDef.plan}
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl p-5 mb-4"
        >
          <PlanContent
            planDef={planDef}
            isCurrent={isCurrent}
            buttonLabel={buttonLabel}
            onPress={() => handleSubscribe(planDef.plan)}
            loading={loading}
            textColor="white"
            variant="gold"
          />
        </LinearGradient>
      );
    }

    if (planDef.plan === 'silver') {
      return (
        <View
          key={planDef.plan}
          className="rounded-2xl p-5 mb-4 bg-orange-50 border border-orange-200"
        >
          <PlanContent
            planDef={planDef}
            isCurrent={isCurrent}
            buttonLabel={buttonLabel}
            onPress={() => handleSubscribe(planDef.plan)}
            loading={loading}
            textColor="dark"
            variant="silver"
          />
        </View>
      );
    }

    return (
      <View key={planDef.plan} className="rounded-2xl p-5 mb-4 bg-white border border-gray-200">
        <PlanContent
          planDef={planDef}
          isCurrent={isCurrent}
          buttonLabel={buttonLabel}
          onPress={() => handleSubscribe(planDef.plan)}
          loading={loading}
          textColor="dark"
          variant="free"
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          className="w-10 h-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 mr-10">
          Membership Plans
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Current Plan Badge */}
        {user && (
          <View className="items-center mb-5">
            <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm">
              <Ionicons name="shield-checkmark" size={18} color="#FF6B35" />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Current Plan:{' '}
                <Text className="text-[#FF6B35]">
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Plan Cards */}
        {plans.map(renderPlanCard)}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */

interface PlanContentProps {
  planDef: PlanDefinition;
  isCurrent: boolean;
  buttonLabel: string;
  onPress: () => void;
  loading: boolean;
  textColor: 'white' | 'dark';
  variant: 'free' | 'silver' | 'gold';
}

function PlanContent({
  planDef,
  isCurrent,
  buttonLabel,
  onPress,
  loading,
  textColor,
  variant,
}: PlanContentProps) {
  const isLight = textColor === 'white';

  const nameColor = isLight ? 'text-white' : 'text-gray-900';
  const priceColor = isLight ? 'text-white' : 'text-gray-900';
  const featureColor = isLight ? 'text-white/90' : 'text-gray-600';
  const checkColor = isLight ? '#ffffff' : '#FF6B35';

  const buttonBg =
    variant === 'gold' ? 'bg-white' : variant === 'silver' ? 'bg-[#FF6B35]' : 'bg-gray-800';

  const buttonText =
    variant === 'gold' ? 'text-amber-600' : variant === 'silver' ? 'text-white' : 'text-white';

  return (
    <>
      {/* Plan name & price */}
      <View className="flex-row items-end justify-between mb-4">
        <View>
          <Text className={`text-xl font-bold ${nameColor}`}>{planDef.name}</Text>
          {planDef.price > 0 ? (
            <Text className={`text-2xl font-extrabold mt-1 ${priceColor}`}>
              {`₹${planDef.price.toLocaleString('en-IN')}`}
              <Text className="text-sm font-normal">/month</Text>
            </Text>
          ) : (
            <Text className={`text-2xl font-extrabold mt-1 ${priceColor}`}>Free</Text>
          )}
        </View>

        {isCurrent && (
          <View className="bg-white/20 rounded-full px-3 py-1">
            <Text className={`text-xs font-semibold ${isLight ? 'text-white' : 'text-[#FF6B35]'}`}>
              ACTIVE
            </Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View className="mb-5">
        {planDef.features.map((feature) => (
          <View key={feature} className="flex-row items-center mb-2">
            <Ionicons name="checkmark-circle" size={18} color={checkColor} />
            <Text className={`ml-2 text-sm ${featureColor}`}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Action button */}
      <TouchableOpacity
        onPress={onPress}
        disabled={isCurrent || loading}
        className={`rounded-xl py-3 items-center ${buttonBg} ${isCurrent ? 'opacity-60' : ''}`}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'gold' ? '#D97706' : '#fff'} />
        ) : (
          <Text className={`font-bold text-base ${buttonText}`}>{buttonLabel}</Text>
        )}
      </TouchableOpacity>
    </>
  );
}
