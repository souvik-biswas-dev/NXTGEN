import { api } from '@/lib/api';

export type RazorpayOrder = {
  order_id: string;
  amount: number; // paise
  currency: string; // 'INR'
  key_id: string;
};

export type PaymentResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/**
 * Ask the server to create a Razorpay order. Amount lookups happen server-side,
 * never trust the client's number.
 */
export async function createOrder(plan: 'silver' | 'gold'): Promise<RazorpayOrder> {
  return api.post<RazorpayOrder>('/payments/order', { plan });
}

/**
 * Hand the payment success response to the server for HMAC verification and
 * subscription activation. Returns the new subscription id on success.
 */
export async function verifyPayment(result: PaymentResult): Promise<string> {
  const data = await api.post<{ ok: boolean; subscription_id: string; already?: boolean }>(
    '/payments/verify',
    result
  );
  if (!data?.ok) throw new Error('Payment verification failed');
  return data.subscription_id;
}

/**
 * Builds a self-contained HTML page that boots the Razorpay Checkout JS SDK,
 * then posts the success/failure payload back to the host app via
 * `window.ReactNativeWebView.postMessage(JSON.stringify(...))`.
 *
 * We render this inside a `<WebView />` rather than linking a native Razorpay
 * SDK so we don't need a custom native module — easier to ship via Expo.
 */
export function buildCheckoutHtml(opts: {
  order: RazorpayOrder;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  description: string;
}): string {
  const { order, userName, userEmail = '', userPhone = '', description } = opts;
  // Encode every interpolated value as a JS string literal. JSON.stringify
  // escapes quotes, backslashes and control chars (so a name like `John\` can't
  // break out of the string); the .replace() turns any "<" into a unicode
  // escape so a value containing "</script>" can't close the inline script tag.
  const js = (v: unknown) => JSON.stringify(String(v ?? '')).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Checkout</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #fff; font-family: -apple-system, system-ui, sans-serif; }
  .c { display:flex; align-items:center; justify-content:center; height:100%; }
</style></head>
<body><div class="c">Loading payment…</div>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var options = {
    key: ${js(order.key_id)},
    amount: ${Number(order.amount)},
    currency: ${js(order.currency)},
    order_id: ${js(order.order_id)},
    name: "NxtGen Properties",
    description: ${js(description)},
    prefill: { name: ${js(userName)}, email: ${js(userEmail)}, contact: ${js(userPhone)} },
    theme: { color: "#0F766E" },
    handler: function (res) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', payload: res }));
    },
    modal: {
      ondismiss: function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismissed' }));
      }
    }
  };
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'failed', payload: e.error }));
  });
  rzp.open();
</script></body></html>`;
}
