// Supabase Edge Function: notify-inquiry
// Deploy: `supabase functions deploy notify-inquiry`
// Secrets: EDGE_INTERNAL_KEY + (optional) SENDGRID_*
//
// Trigger: call this from a Supabase Database Webhook on `public.inquiries`
//          INSERT. Webhook body is `{ type, table, record, ... }` — we read
//          the inserted row from `record`.
//
// What it does:
//   1. Load recipient contact (email, name) + sender name + property title.
//   2. Fire an Expo push + a SendGrid email to the recipient.

/// <reference types="https://deno.land/x/deno@v1.37.0/cli/dts/lib.deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEmail } from '../_shared/email.ts';
import { sendPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // DB webhooks don't send a user JWT. Gate with a shared secret header.
  const expectedInternal = Deno.env.get('EDGE_INTERNAL_KEY');
  const internalKey = req.headers.get('x-internal-key');
  if (!expectedInternal || internalKey !== expectedInternal) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = (await req.json().catch(() => ({}))) as {
    record?: {
      id: string;
      from_user_id: string;
      to_user_id: string;
      property_id: string;
      message: string;
    };
  };
  const inquiry = body.record;
  if (!inquiry) return json({ error: 'No record' }, 400);

  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Load the bits we need for the notification body.
  const [{ data: recipient }, { data: sender }, { data: property }] = await Promise.all([
    supa
      .from('users_profiles')
      .select('name, email')
      .eq('user_id', inquiry.to_user_id)
      .maybeSingle(),
    supa.from('users_profiles').select('name').eq('user_id', inquiry.from_user_id).maybeSingle(),
    supa
      .from('properties')
      .select('title, city, locality')
      .eq('id', inquiry.property_id)
      .maybeSingle(),
  ]);

  if (!recipient) return json({ ok: true, skipped: 'no recipient' });

  const title = 'New inquiry on your property';
  const bodyText =
    `${sender?.name ?? 'A buyer'} is interested in ` +
    `"${property?.title ?? 'your listing'}" (${property?.locality ?? ''}${property?.city ? ', ' + property.city : ''}).\n\n` +
    `Message:\n${inquiry.message}\n\n` +
    `Reply from the NxtGen Properties app.`;

  // Push + email in parallel — don't let one block the other.
  await Promise.allSettled([
    sendPush({
      userIds: [inquiry.to_user_id],
      title,
      body: `${sender?.name ?? 'Buyer'}: ${inquiry.message.slice(0, 80)}`,
      data: { kind: 'inquiry', inquiry_id: inquiry.id, property_id: inquiry.property_id },
    }),
    recipient.email
      ? sendEmail({ to: recipient.email, toName: recipient.name, subject: title, text: bodyText })
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
