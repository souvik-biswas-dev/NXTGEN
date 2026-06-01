import { env } from '@/config/env';

/** Generate a numeric OTP of the given length. */
export function generateOtp(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

/**
 * Deliver an OTP to a phone number via MSG91 (India). If MSG91 isn't
 * configured we log to the console so the flow is testable in dev.
 */
export async function sendPhoneOtp(phone: string, code: string): Promise<boolean> {
  if (!env.msg91.configured) {
    console.log(`[otp:dev] phone=${phone} code=${code}`);
    return true;
  }
  try {
    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: env.msg91.authKey },
      body: JSON.stringify({
        template_id: env.msg91.templateId,
        mobile: phone.replace(/^\+/, ''),
        otp: code,
        sender: env.msg91.senderId,
      }),
    });
    if (!res.ok) {
      console.warn('[otp] MSG91 returned', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[otp] failed', e);
    return false;
  }
}
