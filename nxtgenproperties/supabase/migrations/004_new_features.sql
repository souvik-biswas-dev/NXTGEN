-- Subscriptions table for broker membership plans
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'silver', 'gold')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Recently viewed properties
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id);

ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can view own recently viewed" ON public.recently_viewed
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can insert own recently viewed" ON public.recently_viewed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can delete own recently viewed" ON public.recently_viewed
  FOR DELETE USING (auth.uid() = user_id);

-- Allow upsert for recently viewed (update viewed_at on conflict)
DROP POLICY IF EXISTS "Users can update own recently viewed" ON public.recently_viewed;
CREATE POLICY "Users can update own recently viewed" ON public.recently_viewed
  FOR UPDATE USING (auth.uid() = user_id);

-- Property alerts
CREATE TABLE IF NOT EXISTS public.property_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  filters JSONB NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_alerts_user ON public.property_alerts(user_id);

ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own alerts" ON public.property_alerts;
CREATE POLICY "Users can view own alerts" ON public.property_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts" ON public.property_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.property_alerts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.property_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Add locality coordinates to properties for map feature
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS locality_lat DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS locality_lng DOUBLE PRECISION;
