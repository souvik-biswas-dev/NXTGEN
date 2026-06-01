import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { pushTokens } from '@/db/schema';
import { env } from '@/config/env';

export interface PushMessage {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Look up Expo push tokens for the users and fire a batch at Expo's push API. */
export async function sendPush(msg: PushMessage): Promise<boolean> {
  if (msg.userIds.length === 0) return false;
  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, msg.userIds));

  const tokens = rows.map((r) => r.token).filter(Boolean);
  if (tokens.length === 0) return false;

  const payload = tokens.map((to) => ({
    to,
    sound: 'default',
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
  }));

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (env.expo.accessToken) headers.Authorization = `Bearer ${env.expo.accessToken}`;

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[push] Expo returned', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[push] failed', e);
    return false;
  }
}
