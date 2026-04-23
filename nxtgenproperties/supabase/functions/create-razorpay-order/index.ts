// Supabase Edge Function: create-razorpay-order
// Deploy: `supabase functions deploy create-razorpay-order`
// Secrets needed (set via `supabase secrets set`):
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//
// Request body:  { plan: 'silver' | 'gold' }
// Response:      { order_id, amount, currency, key_id }
//
// Flow:
//   1. Authenticate caller via Supabase JWT.
//   2. Look up the plan price server-side (never trust client-supplied amount).
//   3. Call Razorpay Orders API.
//   4. Insert a row in `payments` with status='created' so we can reconcile.

/// <reference types="https://deno.land/x/deno@v1.37.0/cli/dts/lib.deno.d.ts" />

// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const PRICES_INR: Record<string, number> = {
  silver: 999,
  gold: 2499,
};

// CORS for the RN/Expo client.
const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
  const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!KEY_ID || !KEY_SECRET) return json({ error: 'Razorpay not configured' }, 500);

  // --- Authenticate the caller
  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace('Bearer ', '');
  if (!jwt) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes, error: userErr } = await anon.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, 401);
  const userId = userRes.user.id;

  // --- Validate plan
  const body = (await req.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan;
  if (!plan || !(plan in PRICES_INR)) return json({ error: 'Invalid plan' }, 400);
  const amountPaise = PRICES_INR[plan] * 100;

  // --- Create Razorpay order
  const receipt = `sub_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
  const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: { plan, user_id: userId },
    }),
  });
  if (!razorpayRes.ok) {
    const text = await razorpayRes.text();
    return json({ error: 'Razorpay order failed', detail: text }, 502);
  }
  const order = await razorpayRes.json() as any;

  // --- Persist a payment row (service role key bypasses RLS)
  const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  await service.from('payments').insert({
    user_id: userId,
    razorpay_order_id: order.id,
    amount_paise: amountPaise,
    currency: 'INR',
    plan,
    status: 'created',
  });

  return json({
    order_id: order.id,
    amount: amountPaise,
    currency: 'INR',
    key_id: KEY_ID,
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
