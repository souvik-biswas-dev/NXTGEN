-- ============================================================
-- Migration 009: Notification preferences
-- ============================================================
-- Store notification toggles as a JSONB on user_preferences.
-- Default keys: matched, new_launches, property_news, price_drop.
-- ============================================================

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS notifications JSONB NOT NULL DEFAULT
    jsonb_build_object(
      'matched',        true,
      'new_launches',   false,
      'property_news',  false,
      'price_drop',     true
    );

-- Expo push tokens — one or many devices per user.
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User reads own tokens" ON public.push_tokens;
CREATE POLICY "User reads own tokens" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User writes own tokens" ON public.push_tokens;
CREATE POLICY "User writes own tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User updates own tokens" ON public.push_tokens;
CREATE POLICY "User updates own tokens" ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User deletes own tokens" ON public.push_tokens;
CREATE POLICY "User deletes own tokens" ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);
