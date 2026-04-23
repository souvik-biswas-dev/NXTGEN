-- ============================================================
-- Migration 011: Payments (Razorpay)
-- ============================================================
-- `payments` stores every Razorpay order the client kicks off.
-- Order status transitions: created -> authorized -> captured
--                                         -> failed
-- Subscriptions are only inserted after captured + signature-verified.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id   TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature  TEXT,
  amount_paise    BIGINT NOT NULL,           -- store in paise to avoid float drift
  currency        TEXT NOT NULL DEFAULT 'INR',
  plan            TEXT NOT NULL CHECK (plan IN ('silver', 'gold')),
  status          TEXT NOT NULL DEFAULT 'created'
                    CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  notes           JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own payments" ON public.payments;
CREATE POLICY "User reads own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Only the Edge Function (service role) writes to this table.
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;

DROP TRIGGER IF EXISTS payments_updated_at ON public.payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- One active subscription per user. The client no longer inserts directly;
-- the verify-razorpay-payment edge function does the upsert.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_subscription
  ON public.subscriptions (user_id)
  WHERE status = 'active';

-- Deny direct INSERT/UPDATE of subscriptions from the client keys. All writes
-- go through the server (edge function w/ service role, or admin panel).
REVOKE INSERT, UPDATE ON public.subscriptions FROM anon, authenticated;
