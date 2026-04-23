// Shared SendGrid transactional-email helper.
// Keep message bodies short + plain — no marketing copy, no images with
// remote CDN. Avoids spam-filter triggers.

export type EmailMessage = {
  to: string;
  toName?: string;
  subject: string;
  /** Plain-text body. HTML is derived by escaping + wrapping in <pre>. */
  text: string;
};

const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ESCAPE[ch]);
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const apiKey = Deno.env.get('SENDGRID_API_KEY');
  const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@nxtgenproperties.app';
  const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'NxtGen Properties';

  if (!apiKey) {
    // In development / unconfigured environments, log + return. Callers can
    // still succeed without a delivery attempt.
    console.warn('[email] SENDGRID_API_KEY not set — skipping send', {
      to: msg.to,
      subject: msg.subject,
    });
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: msg.to, name: msg.toName }],
          subject: msg.subject,
        },
      ],
      from: { email: fromEmail, name: fromName },
      content: [
        { type: 'text/plain', value: msg.text },
        {
          type: 'text/html',
          value: `<div style="font-family:-apple-system,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1B2838;"><pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.55;">${escapeHtml(msg.text)}</pre></div>`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid ${res.status}: ${body}`);
  }
}
