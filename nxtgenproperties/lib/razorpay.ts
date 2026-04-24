import { supabase } from '@/lib/supabase';

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
  const { data, error } = await supabase.functions.invoke<RazorpayOrder>('create-razorpay-order', {
    body: { plan },
  });
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not start payment');
  }
  return data;
}

/**
 * Hand the payment success response to the server for HMAC verification and
 * subscription activation. Returns the new subscription id on success.
 */
export async function verifyPayment(result: PaymentResult): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; subscription_id: string }>(
    'verify-razorpay-payment',
    { body: result }
  );
  if (error || !data?.ok) {
    throw new Error(error?.message ?? 'Payment verification failed');
  }
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
  const safe = (s: string) => s.replace(/["<>&]/g, '');
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
    key: "${safe(order.key_id)}",
    amount: ${Number(order.amount)},
    currency: "${safe(order.currency)}",
    order_id: "${safe(order.order_id)}",
    name: "NxtGen Properties",
    description: "${safe(description)}",
    prefill: { name: "${safe(userName)}", email: "${safe(userEmail)}", contact: "${safe(userPhone)}" },
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
