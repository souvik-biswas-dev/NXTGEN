import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { payments, subscriptions } from '@/db/schema';
import { requireAuth, mustUser } from '@/middleware/auth';
import { createOrder, verifySignature } from '@/lib/razorpay';
import { env } from '@/config/env';
import { badRequest, conflict, forbidden, notFound, ApiError } from '@/lib/errors';
import { notify } from '@/services/notify';
import type { AppEnv } from '@/types';

export const paymentRoutes = new Hono<AppEnv>();

// Server-authoritative prices (never trust the client). ₹ → paise.
const PRICES_INR: Record<string, number> = { silver: 999, gold: 2499 };

// ── Create order (was create-razorpay-order edge function) ───────
paymentRoutes.post('/order', requireAuth, async (c) => {
  const u = mustUser(c);
  if (!env.razorpay.configured) throw new ApiError(500, 'Razorpay not configured');
  const { plan } = z.object({ plan: z.enum(['silver', 'gold']) }).parse(await c.req.json());
  const amountPaise = PRICES_INR[plan] * 100;

  const receipt = `sub_${u.id.slice(0, 8)}_${Date.now().toString(36)}`;
  const order = await createOrder(amountPaise, receipt, { plan, user_id: u.id });

  await db.insert(payments).values({
    userId: u.id,
    razorpayOrderId: order.id,
    amountPaise,
    currency: 'INR',
    plan,
    status: 'created',
  });

  return c.json({ order_id: order.id, amount: amountPaise, currency: 'INR', key_id: env.razorpay.keyId });
});

// ── Verify payment (was verify-razorpay-payment edge function) ───
paymentRoutes.post('/verify', requireAuth, async (c) => {
  const u = mustUser(c);
  const b = z
    .object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    })
    .parse(await c.req.json());

  if (!verifySignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) {
    throw badRequest('Invalid payment signature');
  }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.razorpayOrderId, b.razorpay_order_id),
  });
  if (!payment) throw notFound('Payment not found');
  if (payment.userId !== u.id) throw forbidden();
  if (payment.status === 'captured') return c.json({ ok: true, already: true });

  await db
    .update(payments)
    .set({
      status: 'captured',
      razorpayPaymentId: b.razorpay_payment_id,
      razorpaySignature: b.razorpay_signature,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + 30);

  // Cancel any prior active subscription, then insert the new one.
  await db
    .update(subscriptions)
    .set({ status: 'cancelled' })
    .where(and(eq(subscriptions.userId, u.id), eq(subscriptions.status, 'active')));

  const [sub] = await db
    .insert(subscriptions)
    .values({
      userId: u.id,
      plan: payment.plan,
      status: 'active',
      startsAt: now,
      endsAt,
      paymentId: b.razorpay_payment_id,
    })
    .returning({ id: subscriptions.id });

  await notify({
    userId: u.id,
    type: 'subscription',
    title: 'Subscription active',
    body: `Your ${payment.plan} plan is now active.`,
  });
  return c.json({ ok: true, subscription_id: sub.id });
});

// ── My subscription / payment history ────────────────────────────
paymentRoutes.get('/subscription', requireAuth, async (c) => {
  const u = mustUser(c);
  const sub = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.userId, u.id), eq(subscriptions.status, 'active')),
    orderBy: desc(subscriptions.createdAt),
  });
  return c.json({ subscription: sub ?? null });
});

// Activate the free plan (no payment). Paid plans go through /order + /verify.
paymentRoutes.post('/subscription/free', requireAuth, async (c) => {
  const u = mustUser(c);
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + 30);
  await db
    .update(subscriptions)
    .set({ status: 'cancelled' })
    .where(and(eq(subscriptions.userId, u.id), eq(subscriptions.status, 'active')));
  const [sub] = await db
    .insert(subscriptions)
    .values({ userId: u.id, plan: 'free', status: 'active', startsAt: now, endsAt })
    .returning();
  return c.json({ subscription: sub });
});

paymentRoutes.post('/subscription/cancel', requireAuth, async (c) => {
  const u = mustUser(c);
  await db
    .update(subscriptions)
    .set({ status: 'cancelled' })
    .where(and(eq(subscriptions.userId, u.id), eq(subscriptions.status, 'active')));
  return c.json({ ok: true });
});

paymentRoutes.get('/history', requireAuth, async (c) => {
  const u = mustUser(c);
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, u.id))
    .orderBy(desc(payments.createdAt));
  return c.json({ items: rows });
});
