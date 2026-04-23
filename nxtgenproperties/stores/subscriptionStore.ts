import { create } from 'zustand';
import { Subscription, SubscriptionPlan } from '@/types';
import { supabase } from '@/lib/supabase';

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
      const { data } = await supabase
        .from('platform_data')
        .select('data')
        .eq('key', 'subscription_plans')
        .maybeSingle();
      if (data?.data && Array.isArray(data.data)) {
        set({ plans: data.data as PlanDefinition[] });
      }
    } catch {
      // Keep DEFAULT_PLANS on error
    }
  },

  fetchSubscription: async () => {
    set({ loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // User not authenticated, just clear subscription and return
        set({ subscription: null, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      set({ subscription: data });
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setDate(endsAt.getDate() + 30);

      // Cancel any prior active sub, then create a free one.
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      set({ subscription: data });
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      set({ subscription: null });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
