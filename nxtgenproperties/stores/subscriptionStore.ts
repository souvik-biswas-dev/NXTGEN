import { create } from 'zustand';
import { Subscription, SubscriptionPlan } from '@/types';
import { api, hasSession } from '@/lib/api';

export interface PlanDefinition {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  maxListings: number | null;
  features: string[];
}

interface SubscriptionState {
  subscription: Subscription | null;
  loading: boolean;
  plans: PlanDefinition[];
  fetchSubscription: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  subscribe: (plan: SubscriptionPlan) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const DEFAULT_PLANS: PlanDefinition[] = [
  {
    plan: 'free',
    name: 'Free',
    price: 0,
    maxListings: 3,
    features: ['3 listings', 'Basic search', 'Email support'],
  },
  {
    plan: 'silver',
    name: 'Silver',
    price: 999,
    maxListings: 10,
    features: ['10 listings', 'Priority support', 'Analytics dashboard', 'Verified badge'],
  },
  {
    plan: 'gold',
    name: 'Gold',
    price: 2499,
    maxListings: null,
    features: [
      'Unlimited listings',
      'Featured placement',
      'Dedicated manager',
      'Premium badge',
      'Top search ranking',
    ],
  },
];

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  loading: false,
  plans: DEFAULT_PLANS,

  fetchPlans: async () => {
    try {
      const data = await api.get<PlanDefinition[]>('/platform-data/subscription_plans', undefined, false);
      if (Array.isArray(data)) set({ plans: data });
    } catch {
      // Keep DEFAULT_PLANS on error
    }
  },

  fetchSubscription: async () => {
    set({ loading: true });
    try {
      if (!(await hasSession())) {
        set({ subscription: null, loading: false });
        return;
      }
      const { subscription } = await api.get<{ subscription: Subscription | null }>(
        '/payments/subscription'
      );
      set({ subscription });
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      set({ loading: false });
    }
  },

  /**
   * `subscribe('free')` activates immediately (no payment).
   * `subscribe('silver' | 'gold')` is now a no-op at the store level — the UI
   * must navigate to `/membership/checkout?plan=...` which drives the Razorpay
   * flow. Only the `verify-razorpay-payment` edge function inserts paid rows.
   */
  subscribe: async (plan: SubscriptionPlan) => {
    if (plan !== 'free') {
      throw new Error('Paid plans must go through /membership/checkout');
    }
    set({ loading: true });
    try {
      const { subscription } = await api.post<{ subscription: Subscription }>(
        '/payments/subscription/free'
      );
      set({ subscription });
    } catch (error) {
      console.error('Error subscribing:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async () => {
    set({ loading: true });
    try {
      await api.post('/payments/subscription/cancel');
      set({ subscription: null });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
