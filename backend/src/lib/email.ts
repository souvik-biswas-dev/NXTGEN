import { env } from '@/config/env';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/** Send a transactional email via Resend. Logs to console if not configured (dev). */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  if (!env.resend.configured) {
    console.log(`[email:dev] to=${msg.to} subject="${msg.subject}"`);
    return true;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.resend.from,
        to: Array.isArray(msg.to) ? msg.to : [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      console.warn('[email] Resend returned', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[email] failed', e);
    return false;
  }
}
