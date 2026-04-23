// Supabase Edge Function: send-email
// Deploy: `supabase functions deploy send-email`
// Secrets: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME
//
// Generic transactional email dispatcher. Use this for:
//   • broker-verification status updates
//   • subscription receipts
//   • admin-triggered blast notifications
//
// Auth: only callable by the service role (edge functions called server-side)
// OR by an admin user — bare users should not be able to email anyone.

/// <reference types="https://deno.land/x/deno@v1.37.0/cli/dts/lib.deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEmail, EmailMessage } from '../_shared/email.ts';

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-internal-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Allow internal service calls (from other edge functions or DB webhooks)
  // to bypass auth via a shared secret.
  const internalKey = req.headers.get('x-internal-key');
  const expectedInternal = Deno.env.get('EDGE_INTERNAL_KEY');
  const internalOk = expectedInternal && internalKey === expectedInternal;

  if (!internalOk) {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);

    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userRes } = await anon.auth.getUser();
    if (!userRes?.user) return json({ error: 'Unauthorized' }, 401);

    // Only admins can send arbitrary emails via this endpoint.
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: profile } = await service
      .from('users_profiles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  }

  const body = (await req.json().catch(() => ({}))) as Partial<EmailMessage>;
  if (!body.to || !body.subject || !body.text) {
    return json({ error: 'Missing to / subject / text' }, 400);
  }

  try {
    await sendEmail({ to: body.to, toName: body.toName, subject: body.subject, text: body.text });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'send failed' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
