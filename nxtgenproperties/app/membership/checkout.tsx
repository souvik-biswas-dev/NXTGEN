import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { theme } from '@/constants/theme';
import { buildCheckoutHtml, createOrder, verifyPayment, RazorpayOrder } from '@/lib/razorpay';

type Status = 'preparing' | 'ready' | 'verifying' | 'done' | 'error';

export default function CheckoutScreen() {
  const { plan } = useLocalSearchParams<{ plan: 'silver' | 'gold' }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchSubscription, plans } = useSubscriptionStore();

  const [status, setStatus] = useState<Status>('preparing');
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const planDef = useMemo(() => plans.find((p) => p.plan === plan), [plans, plan]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!plan || (plan !== 'silver' && plan !== 'gold')) {
        setStatus('error');
        setErrorMsg('Invalid plan');
        return;
      }
      try {
        const o = await createOrder(plan);
        if (cancelled) return;
        setOrder(o);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Could not start payment');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan]);

  const onMessage = async (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as
        | {
            type: 'success';
            payload: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            };
          }
        | { type: 'failed'; payload: { description?: string } }
        | { type: 'dismissed' };

      if (msg.type === 'dismissed') {
        router.back();
        return;
      }
      if (msg.type === 'failed') {
        setStatus('error');
        setErrorMsg(msg.payload.description ?? 'Payment failed');
        return;
      }
      setStatus('verifying');
      await verifyPayment(msg.payload);
      await fetchSubscription();
      setStatus('done');
      Alert.alert('Upgrade complete', `You are now on the ${planDef?.name ?? plan} plan.`, [
        { text: 'OK', onPress: () => router.replace('/membership' as any) },
      ]);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Could not complete payment');
    }
  };

  const html = useMemo(() => {
    if (!order) return '';
    return buildCheckoutHtml({
      order,
      userName: user?.name ?? 'Customer',
      userEmail: user?.email,
      userPhone: user?.phone,
      description: `${planDef?.name ?? 'Subscription'} plan`,
    });
  }, [order, user?.name, user?.email, user?.phone, planDef?.name]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 17, fontWeight: '700', marginLeft: 4, color: theme.colors.secondary }}
        >
          Upgrade to {planDef?.name ?? plan}
        </Text>
      </View>

      {status === 'preparing' && <Centered text="Creating secure payment order…" />}
      {status === 'verifying' && <Centered text="Confirming your payment…" />}

      {status === 'ready' && order && (
        <WebView
          source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => <Centered text="Opening Razorpay…" />}
        />
      )}

      {status === 'error' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={{ marginTop: 12, fontWeight: '600', color: theme.colors.secondary }}>
            Payment failed
          </Text>
          <Text style={{ marginTop: 6, color: theme.colors.outline, textAlign: 'center' }}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              paddingVertical: 12,
              paddingHorizontal: 24,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.roundness.full,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Back to plans</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ marginTop: 12, color: theme.colors.outline }}>{text}</Text>
    </View>
  );
}
