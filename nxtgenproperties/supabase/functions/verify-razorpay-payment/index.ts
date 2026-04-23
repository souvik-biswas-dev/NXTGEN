// Supabase Edge Function: verify-razorpay-payment
// Deploy: `supabase functions deploy verify-razorpay-payment`
// Secrets needed:
//   RAZORPAY_KEY_SECRET  (HMAC signing secret)
//
// Request body:
//   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Response:
//   { ok: true, subscription_id }
//
// Flow:
//   1. Authenticate caller.
//   2. Load the payment row; confirm it belongs to this user.
//   3. HMAC-verify the Razorpay signature (orderId + '|' + paymentId).
//   4. Update payment → captured, cancel any prior active subscription,
//      insert new `subscriptions` row with ends_at = now + 30 days.

/// <reference types="https://deno.land/x/deno@v1.37.0/cli/dts/lib.deno.d.ts" />

// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!KEY_SECRET) return json({ error: 'Razorpay not configured' }, 500);

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

  const body = (await req.json().catch(() => ({}))) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return json({ error: 'Missing fields' }, 400);
  }

  // --- HMAC verification
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = await hmacSha256Hex(KEY_SECRET, payload);
  if (expected !== razorpay_signature) {
    return json({ error: 'Invalid signature' }, 400);
  }

  // --- Load payment row, verify ownership, flip to captured
  const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: payment, error: loadErr } = await service
    .from('payments')
    .select('id, user_id, plan, amount_paise, status')
    .eq('razorpay_order_id', razorpay_order_id)
    .maybeSingle();
  if (loadErr || !payment) return json({ error: 'Payment not found' }, 404);
  if (payment.user_id !== userId) return json({ error: 'Forbidden' }, 403);
  if (payment.status === 'captured') {
    return json({ ok: true, already: true });
  }

  const { error: updErr } = await service
    .from('payments')
    .update({
      status: 'captured',
      razorpay_payment_id,
      razorpay_signature,
    })
    .eq('id', payment.id);
  if (updErr) return json({ error: 'Could not update payment' }, 500);

  // --- Cancel any prior active subscription, then insert the new one.
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + 30);

  await service
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data: sub, error: subErr } = await service
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan: payment.plan,
      status: 'active',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      payment_id: razorpay_payment_id,
    })
    .select('id')
    .single();
  if (subErr) return json({ error: 'Could not create subscription' }, 500);

  return json({ ok: true, subscription_id: sub.id });
});

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return [...new Uint8Array(signed)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
