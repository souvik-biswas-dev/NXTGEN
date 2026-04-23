// Supabase Edge Function: notify-broker-status
// Deploy: `supabase functions deploy notify-broker-status`
// Secrets: EDGE_INTERNAL_KEY + SENDGRID_* (optional)
//
// Trigger: Supabase Database Webhook on `public.broker_verifications`
//          UPDATE. Only fires a notification when `status` changes.

/// <reference types="https://deno.land/x/deno@v1.37.0/cli/dts/lib.deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEmail } from '../_shared/email.ts';
import { sendPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const expectedInternal = Deno.env.get('EDGE_INTERNAL_KEY');
  const internalKey = req.headers.get('x-internal-key');
  if (!expectedInternal || internalKey !== expectedInternal) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = (await req.json().catch(() => ({}))) as {
    record?: { user_id: string; status: string; reviewer_notes: string | null };
    old_record?: { status: string };
  };
  const rec = body.record;
  if (!rec) return json({ error: 'No record' }, 400);
  if (rec.status === body.old_record?.status) return json({ ok: true, skipped: 'no-change' });
  if (rec.status !== 'approved' && rec.status !== 'rejected') {
    return json({ ok: true, skipped: 'not-terminal' });
  }

  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { data: profile } = await supa
    .from('users_profiles')
    .select('name, email')
    .eq('user_id', rec.user_id)
    .maybeSingle();
  if (!profile) return json({ ok: true, skipped: 'no-profile' });

  const approved = rec.status === 'approved';
  const title = approved ? 'You are now a verified broker' : 'Broker verification update';
  const emailBody = approved
    ? `Hi ${profile.name},\n\nYour broker profile on NxtGen Properties is now verified. You'll see the verified badge on your listings and rank higher in search.\n\n— The NxtGen team`
    : `Hi ${profile.name},\n\nWe couldn't approve your broker verification request.\n\n${rec.reviewer_notes ?? 'Please review the documents and resubmit.'}\n\nYou can resubmit at any time from the app.\n\n— The NxtGen team`;

  await Promise.allSettled([
    sendPush({
      userIds: [rec.user_id],
      title,
      body: approved ? 'Your profile now shows the verified badge.' : 'Tap to review and resubmit.',
      data: { kind: 'broker-status', status: rec.status },
    }),
    profile.email
      ? sendEmail({ to: profile.email, toName: profile.name, subject: title, text: emailBody })
      : Promise.resolve(),
  ]);

  return json({ ok: true });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
