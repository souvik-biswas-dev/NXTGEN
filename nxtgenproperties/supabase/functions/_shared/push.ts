// Shared Expo Push helper. Lookup tokens for a user and fire them
// at the Expo Push API in a single batch (Expo accepts up to 100 per call).
// Returns `true` if at least one token was dispatched successfully.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

export type PushMessage = {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendPush(msg: PushMessage): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supa = createClient(supabaseUrl, serviceKey);

  const { data: rows } = await supa.from('push_tokens').select('token').in('user_id', msg.userIds);

  const tokens = (rows ?? []).map((r: { token: string }) => r.token).filter(Boolean);
  if (tokens.length === 0) return false;

  const payload = tokens.map((to) => ({
    to,
    sound: 'default',
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
  }));

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.warn('[push] Expo push returned', res.status, await res.text());
    return false;
  }
  return true;
}
