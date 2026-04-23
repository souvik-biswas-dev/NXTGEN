-- ============================================================
-- 012_listings_platform.sql — 99acres parity features
--   • projects (full schema with floor plans, builder, RERA)
--   • site_visit_requests
--   • property_reports
--   • broker_reviews & locality_reviews_detailed
--   • in_app_notifications
--   • home_loan_leads
-- Seeds a couple of projects + FAQ + about/legal content into platform_data.
-- ============================================================

-- Projects (full, not just platform_data blob) --------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  developer TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  locality TEXT,
  description TEXT,
  price_min BIGINT,
  price_max BIGINT,
  launch_date TEXT,
  possession_date TEXT,
  rera_id TEXT,
  cover_image TEXT,
  gallery JSONB DEFAULT '[]'::JSONB,
  floor_plans JSONB DEFAULT '[]'::JSONB,
  amenities JSONB DEFAULT '[]'::JSONB,
  total_units INTEGER,
  available_units INTEGER,
  tower_count INTEGER,
  featured BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_city ON public.projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);

-- Site visit requests ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_visit_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  contact_user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE SET NULL,
  preferred_date TIMESTAMP WITH TIME ZONE NOT NULL,
  slot TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_user ON public.site_visit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_contact ON public.site_visit_requests(contact_user_id);

ALTER TABLE public.site_visit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own visits" ON public.site_visit_requests;
CREATE POLICY "Users can view own visits" ON public.site_visit_requests
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = contact_user_id);

DROP POLICY IF EXISTS "Users can request visits" ON public.site_visit_requests;
CREATE POLICY "Users can request visits" ON public.site_visit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Counterparties update visits" ON public.site_visit_requests;
CREATE POLICY "Counterparties update visits" ON public.site_visit_requests
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = contact_user_id);

-- Property reports (spam/duplicate/misleading) --------------------------------
CREATE TABLE IF NOT EXISTS public.property_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam','duplicate','misleading','sold_or_rented','inappropriate','fraud','other')),
  details TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','reviewing','resolved','dismissed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_property ON public.property_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.property_reports(status);

ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.property_reports;
CREATE POLICY "Users can create reports" ON public.property_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can view own reports" ON public.property_reports;
CREATE POLICY "Users can view own reports" ON public.property_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Broker reviews --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broker_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  broker_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broker_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_broker_reviews_broker ON public.broker_reviews(broker_id);

ALTER TABLE public.broker_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read broker reviews" ON public.broker_reviews;
CREATE POLICY "Anyone can read broker reviews" ON public.broker_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users write own broker reviews" ON public.broker_reviews;
CREATE POLICY "Users write own broker reviews" ON public.broker_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id AND auth.uid() <> broker_id);

DROP POLICY IF EXISTS "Users update own broker reviews" ON public.broker_reviews;
CREATE POLICY "Users update own broker reviews" ON public.broker_reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users delete own broker reviews" ON public.broker_reviews;
CREATE POLICY "Users delete own broker reviews" ON public.broker_reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- Locality reviews (detailed, per-user) --------------------------------------
CREATE TABLE IF NOT EXISTS public.locality_reviews_detailed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  locality TEXT NOT NULL,
  city TEXT NOT NULL,
  reviewer_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  safety INTEGER CHECK (safety BETWEEN 1 AND 5),
  connectivity INTEGER CHECK (connectivity BETWEEN 1 AND 5),
  amenities_rating INTEGER CHECK (amenities_rating BETWEEN 1 AND 5),
  cleanliness INTEGER CHECK (cleanliness BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locality_reviews_detailed_loc
  ON public.locality_reviews_detailed(locality, city);

ALTER TABLE public.locality_reviews_detailed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read locality reviews" ON public.locality_reviews_detailed;
CREATE POLICY "Anyone can read locality reviews" ON public.locality_reviews_detailed
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users write own locality reviews" ON public.locality_reviews_detailed;
CREATE POLICY "Users write own locality reviews" ON public.locality_reviews_detailed
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users update own locality reviews" ON public.locality_reviews_detailed;
CREATE POLICY "Users update own locality reviews" ON public.locality_reviews_detailed
  FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users delete own locality reviews" ON public.locality_reviews_detailed;
CREATE POLICY "Users delete own locality reviews" ON public.locality_reviews_detailed
  FOR DELETE USING (auth.uid() = reviewer_id);

-- In-app notification feed ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('match','price_drop','message','inquiry','site_visit','subscription','system')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user
  ON public.in_app_notifications(user_id, created_at DESC);

ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.in_app_notifications;
CREATE POLICY "Users read own notifications" ON public.in_app_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.in_app_notifications;
CREATE POLICY "Users update own notifications" ON public.in_app_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.in_app_notifications;
CREATE POLICY "Users delete own notifications" ON public.in_app_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Users can insert notifications for *themselves* (used for local-originated
-- match alerts from the client before the push fan-out worker catches up).
DROP POLICY IF EXISTS "Users insert own notifications" ON public.in_app_notifications;
CREATE POLICY "Users insert own notifications" ON public.in_app_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Home-loan leads -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.home_loan_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  loan_amount BIGINT,
  employment_type TEXT CHECK (employment_type IN ('salaried','self-employed','business','other')),
  monthly_income BIGINT,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  partner TEXT,
  status TEXT NOT NULL CHECK (status IN ('new','contacted','converted','lost')) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_loan_leads_user ON public.home_loan_leads(user_id);

ALTER TABLE public.home_loan_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create own leads" ON public.home_loan_leads;
CREATE POLICY "Users create own leads" ON public.home_loan_leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own leads" ON public.home_loan_leads;
CREATE POLICY "Users view own leads" ON public.home_loan_leads
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Seed platform_data — FAQ, about, support, loan partners, version
-- ============================================================

INSERT INTO public.platform_data (key, data) VALUES
('faqs', '[
  {"category":"Listings & Search","items":[
    {"q":"How do I search for properties?","a":"Use the Search tab at the bottom to filter properties by location, price, type, and BHK configuration. You can also use the home screen search bar for quick lookups."},
    {"q":"How do I save a property to my favorites?","a":"Tap the heart icon on any property card or detail page to save it. Saved properties are accessible from the Favorites section in your profile."},
    {"q":"Can I post a property listing?","a":"Yes. Tap the + button in the centre of the tab bar to create a new listing. You need to be registered as an Owner or Broker to post properties."},
    {"q":"How are property prices calculated?","a":"Prices are set by the property owner or broker. NxtGenProperties does not add any markup. Use the EMI Calculator in the Tools section to plan your finances."},
    {"q":"How do I compare properties?","a":"Tap the Compare icon on any property card or detail page to add it to compare. Open the Compare screen from your profile to see properties side-by-side."}
  ]},
  {"category":"Account & Profile","items":[
    {"q":"How do I change my password?","a":"Go to Settings → Change Password. A reset link will be sent to your registered email address."},
    {"q":"How do I become a verified broker?","a":"Go to your Profile and tap Request Verification. You will need to submit your RERA number, government ID, and address proof. Verification takes 2–3 business days."},
    {"q":"Can I change my account role (Buyer/Owner/Broker)?","a":"Account roles are set during sign-up and cannot be changed by the user. Contact our support team to request a role change."}
  ]},
  {"category":"Payments & Subscription","items":[
    {"q":"What plans are available?","a":"We offer Free, Silver, and Gold plans. Paid plans unlock unlimited listings, priority placement, and advanced analytics. See Plans in your profile for details."},
    {"q":"How do I cancel my subscription?","a":"Go to Profile → View Plans → Manage Subscription to cancel. Your benefits remain active until the end of the current billing period."},
    {"q":"Will I get a refund if I cancel?","a":"Paid plans are non-refundable once the billing period starts. Contact support within 48 hours of purchase for exceptional cases."}
  ]}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

INSERT INTO public.platform_data (key, data) VALUES
('support', '{
  "email":"support@nxtgenproperties.com",
  "bugs_email":"bugs@nxtgenproperties.com",
  "whatsapp":"+911234567890",
  "phone":"+911234567890",
  "hours":"Mon–Sat, 9 AM–7 PM"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

INSERT INTO public.platform_data (key, data) VALUES
('about_features', '[
  {"icon":"search-outline","title":"Smart Search","description":"Filter by location, price, type, BHK, and more to find the perfect property."},
  {"icon":"shield-checkmark-outline","title":"Verified Listings","description":"RERA-verified brokers and owner-posted listings for a trustworthy experience."},
  {"icon":"chatbubbles-outline","title":"Direct Chat","description":"Connect directly with owners and brokers without middlemen."},
  {"icon":"calculator-outline","title":"Financial Tools","description":"Built-in EMI and budget calculators to plan your investment."},
  {"icon":"trending-up-outline","title":"Market Insights","description":"Stay informed with real-time price trends and locality reports."},
  {"icon":"git-compare-outline","title":"Compare Properties","description":"Side-by-side comparison of shortlisted properties."}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

INSERT INTO public.platform_data (key, data) VALUES
('legal_links', '[
  {"label":"Privacy Policy","url":"https://nxtgenproperties.com/privacy"},
  {"label":"Terms of Service","url":"https://nxtgenproperties.com/terms"},
  {"label":"Cookie Policy","url":"https://nxtgenproperties.com/cookies"},
  {"label":"RERA Compliance","url":"https://nxtgenproperties.com/rera"},
  {"label":"Refund Policy","url":"https://nxtgenproperties.com/refund"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

INSERT INTO public.platform_data (key, data) VALUES
('social_links', '[
  {"icon":"logo-instagram","label":"Instagram","url":"https://instagram.com/nxtgenproperties","color":"#E1306C"},
  {"icon":"logo-linkedin","label":"LinkedIn","url":"https://linkedin.com/company/nxtgenproperties","color":"#0A66C2"},
  {"icon":"logo-twitter","label":"Twitter / X","url":"https://twitter.com/nxtgenprops","color":"#1DA1F2"},
  {"icon":"logo-youtube","label":"YouTube","url":"https://youtube.com/@nxtgenproperties","color":"#FF0000"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

INSERT INTO public.platform_data (key, data) VALUES
('home_loan_partners', '[
  {"id":"sbi","name":"SBI Home Loans","interest":"8.40%","processingFee":"0.35%","maxTenure":30,"logo":"https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg"},
  {"id":"hdfc","name":"HDFC Home Loans","interest":"8.50%","processingFee":"0.50%","maxTenure":30,"logo":"https://upload.wikimedia.org/wikipedia/commons/8/88/HDFC_Bank_Logo.svg"},
  {"id":"icici","name":"ICICI Home Loans","interest":"8.55%","processingFee":"0.50%","maxTenure":30,"logo":"https://upload.wikimedia.org/wikipedia/commons/1/1a/ICICI_Bank_Logo.svg"},
  {"id":"axis","name":"Axis Home Loans","interest":"8.60%","processingFee":"0.50%","maxTenure":30,"logo":"https://upload.wikimedia.org/wikipedia/commons/6/68/Axis_Bank_logo.svg"},
  {"id":"lichfl","name":"LIC Housing Finance","interest":"8.35%","processingFee":"0.25%","maxTenure":30,"logo":"https://upload.wikimedia.org/wikipedia/commons/2/28/LIC_Logo.svg"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

INSERT INTO public.platform_data (key, data) VALUES
('report_reasons', '[
  {"id":"spam","label":"Spam / Fake Listing"},
  {"id":"duplicate","label":"Duplicate Listing"},
  {"id":"misleading","label":"Misleading Information"},
  {"id":"sold_or_rented","label":"Already Sold / Rented"},
  {"id":"inappropriate","label":"Inappropriate Content"},
  {"id":"fraud","label":"Suspected Fraud"},
  {"id":"other","label":"Other"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed a couple of projects so the new projects screen has content -----------
INSERT INTO public.projects (
  id, name, developer, location, city, locality, description,
  price_min, price_max, launch_date, possession_date, rera_id,
  cover_image, gallery, floor_plans, amenities,
  total_units, available_units, tower_count, featured, verified
) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'DLF The Camellias',
  'DLF Ltd',
  'Golf Course Road, Gurgaon',
  'Gurgaon',
  'Golf Course Road',
  'Ultra-luxury high-rise with 360° views of the DLF Golf & Country Club. Private lift lobbies, concierge service, and sky-garden residences.',
  80000000, 250000000, 'Feb 2026', 'Dec 2027', 'HRERA-GGM-12345-2023',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  '[{"name":"4 BHK","area":4500,"price":80000000,"image":"https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"},{"name":"5 BHK","area":6200,"price":150000000,"image":"https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=600"},{"name":"Penthouse","area":9000,"price":250000000,"image":"https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=600"}]'::jsonb,
  '["Private Pool","Home Theater","Concierge","Helipad","Sky Deck","EV Charging","Club","Spa","Gym"]'::jsonb,
  250, 40, 3, true, true
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Godrej Reserve',
  'Godrej Properties',
  'Chandivali, Mumbai',
  'Mumbai',
  'Chandivali',
  'Forest-inspired 3 & 4 BHK residences set in 8 acres of landscaped green spaces, with a grand clubhouse and resort-style amenities.',
  25000000, 60000000, 'March 2026', 'Jun 2028', 'MAHARERA-P51800000987',
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  '[{"name":"3 BHK","area":1450,"price":25000000,"image":"https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=600"},{"name":"4 BHK","area":2150,"price":60000000,"image":"https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=600"}]'::jsonb,
  '["Swimming Pool","Gym","Clubhouse","Garden","Jogging Track","Kids Play","Yoga Deck","Amphitheater"]'::jsonb,
  420, 180, 4, true, true
),
(
  'b0000000-0000-0000-0000-000000000003',
  'Prestige Lakeside Habitat',
  'Prestige Group',
  'Whitefield, Bangalore',
  'Bangalore',
  'Whitefield',
  'Lakefront community with villas and apartments. Waterfront walking trails, infinity pools, and smart-home integration in every unit.',
  12000000, 30000000, 'Jan 2026', 'Mar 2027', 'RERA-KA-RERA/1251/305/PR/171015/000456',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  '[{"name":"2 BHK","area":1200,"price":12000000,"image":"https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=600"},{"name":"3 BHK","area":1800,"price":20000000,"image":"https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"},{"name":"Villa","area":3200,"price":30000000,"image":"https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=600"}]'::jsonb,
  '["Lake Walk","Swimming Pool","Gym","Clubhouse","Smart Home","EV Charging","Kids Play"]'::jsonb,
  600, 320, 5, false, true
)
ON CONFLICT (id) DO NOTHING;

-- updated_at trigger for projects --------------------------------------------
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.projects IS 'Builder projects with floor plans, amenities, RERA info';
COMMENT ON TABLE public.site_visit_requests IS 'User-initiated site visit requests for a property';
COMMENT ON TABLE public.property_reports IS 'Buyer reports for spam / duplicate / misleading listings';
COMMENT ON TABLE public.broker_reviews IS 'Per-user star rating + comment for a broker';
COMMENT ON TABLE public.locality_reviews_detailed IS 'Per-user detailed ratings for a locality';
COMMENT ON TABLE public.in_app_notifications IS 'User-visible notification feed';
COMMENT ON TABLE public.home_loan_leads IS 'Home-loan lead form submissions';
