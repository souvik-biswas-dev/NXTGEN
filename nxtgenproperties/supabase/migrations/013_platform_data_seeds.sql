-- 013_platform_data_seeds.sql
-- Seeds subscription_plans and property_view_counts table into platform_data.

INSERT INTO public.platform_data (key, data) VALUES
('subscription_plans', '[
  {
    "plan": "free",
    "name": "Free",
    "price": 0,
    "maxListings": 3,
    "features": ["3 listings", "Basic search", "Email support"]
  },
  {
    "plan": "silver",
    "name": "Silver",
    "price": 999,
    "maxListings": 10,
    "features": ["10 listings", "Priority support", "Analytics dashboard", "Verified badge"]
  },
  {
    "plan": "gold",
    "name": "Gold",
    "price": 2499,
    "maxListings": null,
    "features": ["Unlimited listings", "Featured placement", "Dedicated manager", "Premium badge", "Top search ranking"]
  }
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Property view tracking table for seller analytics
CREATE TABLE IF NOT EXISTS public.property_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.users_profiles(user_id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON public.property_views(property_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_viewer ON public.property_views(viewer_id);

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert view" ON public.property_views;
CREATE POLICY "Anyone can insert view" ON public.property_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Property owners can read views" ON public.property_views;
CREATE POLICY "Property owners can read views" ON public.property_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
        AND (p.owner_id = auth.uid() OR p.broker_id = auth.uid())
    )
    OR viewer_id = auth.uid()
  );

COMMENT ON TABLE public.property_views IS 'Per-view log for seller analytics';
