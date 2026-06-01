import { db } from '@/db';
import { inAppNotifications } from '@/db/schema';
import { sendPush } from '@/lib/push';

type NotifType =
  | 'match' | 'price_drop' | 'message' | 'inquiry' | 'site_visit' | 'subscription' | 'system' | 'offer';

interface NotifyInput {
  userId: string;
  type: NotifType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  push?: boolean; // also send an Expo push (default true)
}

/** Write an in-app notification row and (optionally) fire an Expo push. */
export async function notify(input: NotifyInput): Promise<void> {
  // `offer` isn't in the original CHECK set; store it as 'system' in-app but keep type in data.
  const dbType = input.type === 'offer' ? 'system' : input.type;
  await db.insert(inAppNotifications).values({
    userId: input.userId,
    type: dbType,
    title: input.title,
    body: input.body,
    data: { ...(input.data ?? {}), kind: input.type },
  });
  if (input.push !== false) {
    await sendPush({
      userIds: [input.userId],
      title: input.title,
      body: input.body ?? '',
      data: input.data,
    });
  }
}
