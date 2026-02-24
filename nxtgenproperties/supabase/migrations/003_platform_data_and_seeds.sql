-- Platform data table for dynamic app content
CREATE TABLE IF NOT EXISTS public.platform_data (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view platform data" ON public.platform_data;
CREATE POLICY "Anyone can view platform data" ON public.platform_data
  FOR SELECT USING (true);

-- Seed popular cities
INSERT INTO public.platform_data (key, data) VALUES
('popular_cities', '[
  {"id":"1","name":"Mumbai","properties":2500},
  {"id":"2","name":"Delhi","properties":1800},
  {"id":"3","name":"Bangalore","properties":2100},
  {"id":"4","name":"Hyderabad","properties":1500},
  {"id":"5","name":"Pune","properties":1200},
  {"id":"6","name":"Chennai","properties":950},
  {"id":"7","name":"Noida","properties":800},
  {"id":"8","name":"Gurgaon","properties":1100},
  {"id":"9","name":"Kolkata","properties":750},
  {"id":"10","name":"Ahmedabad","properties":600}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed popular localities
INSERT INTO public.platform_data (key, data) VALUES
('popular_localities', '{
  "Mumbai": ["Bandra", "Andheri", "Powai", "Juhu", "Worli", "Lower Parel", "Malad"],
  "Delhi": ["Connaught Place", "Dwarka", "Saket", "Vasant Kunj", "Defence Colony", "Greater Kailash"],
  "Bangalore": ["Whitefield", "Koramangala", "Indiranagar", "HSR Layout", "Electronic City", "Marathahalli"],
  "Hyderabad": ["Jubilee Hills", "Banjara Hills", "Gachibowli", "HITEC City", "Kondapur", "Madhapur"],
  "Noida": ["Sector 150", "Sector 137", "Sector 62", "Sector 44", "Sector 76", "Sector 128"],
  "Gurgaon": ["DLF Phase 1", "DLF Phase 3", "Golf Course Road", "Sohna Road", "Sector 56", "MG Road"],
  "Pune": ["Kothrud", "Baner", "Hinjewadi", "Wakad", "Koregaon Park", "Viman Nagar"],
  "Chennai": ["Adyar", "Anna Nagar", "T Nagar", "Velachery", "OMR", "ECR"]
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed amenities
INSERT INTO public.platform_data (key, data) VALUES
('amenities', '["Swimming Pool","Gym","Clubhouse","Power Backup","24x7 Security","Garden","Play Area","Jogging Track","Indoor Games","Home Theater","Smart Home","EV Charging","Concierge","Private Pool","Solar Power","Lift","Covered Parking","Water Purifier","Conference Room","Cafeteria"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed price ranges
INSERT INTO public.platform_data (key, data) VALUES
('price_ranges', '{
  "buy": [
    {"label":"Under ₹50 Lakh","min":0,"max":5000000},
    {"label":"₹50 Lakh - ₹1 Cr","min":5000000,"max":10000000},
    {"label":"₹1 Cr - ₹2 Cr","min":10000000,"max":20000000},
    {"label":"₹2 Cr - ₹5 Cr","min":20000000,"max":50000000},
    {"label":"Above ₹5 Cr","min":50000000,"max":null}
  ],
  "rent": [
    {"label":"Under ₹15K","min":0,"max":15000},
    {"label":"₹15K - ₹30K","min":15000,"max":30000},
    {"label":"₹30K - ₹50K","min":30000,"max":50000},
    {"label":"₹50K - ₹1 Lakh","min":50000,"max":100000},
    {"label":"Above ₹1 Lakh","min":100000,"max":null}
  ]
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed market trends
INSERT INTO public.platform_data (key, data) VALUES
('market_trends', '[
  {"city":"Mumbai","trend":"up","change":"+8.5%","avgPrice":"18,500","period":"YoY"},
  {"city":"Bangalore","trend":"up","change":"+12.3%","avgPrice":"12,200","period":"YoY"},
  {"city":"Hyderabad","trend":"up","change":"+15.7%","avgPrice":"8,800","period":"YoY"},
  {"city":"Pune","trend":"up","change":"+9.2%","avgPrice":"9,500","period":"YoY"},
  {"city":"Delhi NCR","trend":"up","change":"+6.8%","avgPrice":"14,200","period":"YoY"},
  {"city":"Chennai","trend":"up","change":"+7.5%","avgPrice":"7,800","period":"YoY"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed new launches
INSERT INTO public.platform_data (key, data) VALUES
('new_launches', '[
  {"id":"nl1","name":"DLF The Camellias","developer":"DLF Ltd","location":"Golf Course Road, Gurgaon","priceRange":"₹8 Cr - ₹25 Cr","image":"https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800","launchDate":"Feb 2026"},
  {"id":"nl2","name":"Godrej Reserve","developer":"Godrej Properties","location":"Chandivali, Mumbai","priceRange":"₹2.5 Cr - ₹6 Cr","image":"https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800","launchDate":"March 2026"},
  {"id":"nl3","name":"Prestige Lakeside Habitat","developer":"Prestige Group","location":"Whitefield, Bangalore","priceRange":"₹1.2 Cr - ₹3 Cr","image":"https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800","launchDate":"Jan 2026"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- Seed additional properties (with proper UUIDs)
-- Using the existing seed users: 00000000-0000-0000-0000-000000000001 (owner), 00000000-0000-0000-0000-000000000002 (broker)

INSERT INTO public.properties (id, title, description, price, maintenance, deposit, type, category, bhk, furnishing, area_sqft, carpet_area, super_built_up, photos, locality, city, address, floor, total_floors, facing, possession, age_years, amenities, owner_id, broker_id, verified, featured, bedrooms, bathrooms, kitchens, parkings) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Luxury 4 BHK Apartment in Sector 150',
  'Experience luxury living at its finest with this stunning 4 BHK apartment featuring modern amenities, premium finishes, and breathtaking views. The spacious layout includes a large living room, modular kitchen, and private balconies in each bedroom.',
  25000000, 15000, 500000, 'buy', 'residential', '4BHK', 'semi-furnished',
  2500, 2100, 2800,
  '["https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Sector 150', 'Noida', 'Block A, Sector 150, Noida, UP 201310',
  '15', '25', 'east', 'ready', 1,
  '["Swimming Pool","Gym","Clubhouse","Power Backup","24x7 Security","Garden","Play Area","Jogging Track"]'::jsonb,
  NULL, '00000000-0000-0000-0000-000000000002', true, true, 4, 4, 1, 2
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Spacious 3 BHK Flat for Rent in Gurgaon',
  'Beautiful 3 BHK fully furnished flat available for rent in the heart of Gurgaon. Perfect location with easy access to major IT parks, shopping malls, and metro station.',
  45000, 5000, 135000, 'rent', 'residential', '3BHK', 'furnished',
  1800, 1500, 2000,
  '["https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'DLF Phase 3', 'Gurgaon', 'Tower B, DLF Phase 3, Gurgaon, Haryana 122002',
  '8', '20', 'north', 'ready', 3,
  '["Swimming Pool","Gym","Power Backup","24x7 Security","Covered Parking"]'::jsonb,
  '00000000-0000-0000-0000-000000000001', NULL, true, true, 3, 3, 1, 1
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Premium 2 BHK Apartment in Whitefield',
  'Modern 2 BHK apartment in a premium gated community. Features world-class amenities and is located in the IT hub of Bangalore.',
  8500000, 4500, NULL, 'buy', 'residential', '2BHK', 'semi-furnished',
  1200, 1000, 1350,
  '["https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Whitefield', 'Bangalore', 'ITPL Main Road, Whitefield, Bangalore 560066',
  '12', '18', 'south-east', 'ready', 2,
  '["Swimming Pool","Gym","Clubhouse","Power Backup","24x7 Security","Indoor Games"]'::jsonb,
  NULL, '00000000-0000-0000-0000-000000000002', true, false, 2, 2, 1, 1
),
(
  'a0000000-0000-0000-0000-000000000004',
  'Elegant 5 BHK Villa in Jubilee Hills',
  'Luxurious 5 BHK independent villa with private garden, pool, and modern architecture. Located in the most premium locality of Hyderabad.',
  75000000, 25000, NULL, 'buy', 'residential', '5+BHK', 'furnished',
  5500, 5000, 6000,
  '["https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2091166/pexels-photo-2091166.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Jubilee Hills', 'Hyderabad', 'Road No. 10, Jubilee Hills, Hyderabad 500033',
  'G+2', '3', 'west', 'ready', 1,
  '["Private Pool","Home Theater","Gym","Garden","Solar Power","24x7 Security","Smart Home"]'::jsonb,
  '00000000-0000-0000-0000-000000000001', NULL, true, true, 5, 6, 2, 4
),
(
  'a0000000-0000-0000-0000-000000000005',
  'Cozy 1 BHK for Rent in Andheri',
  'Well-maintained 1 BHK apartment ideal for young professionals. Close to metro station and major offices.',
  25000, 3000, 75000, 'rent', 'residential', '1BHK', 'furnished',
  650, 550, 750,
  '["https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1743227/pexels-photo-1743227.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Andheri West', 'Mumbai', 'DN Nagar, Andheri West, Mumbai 400053',
  '5', '12', 'north-east', 'ready', 5,
  '["Gym","Power Backup","24x7 Security","Lift"]'::jsonb,
  '00000000-0000-0000-0000-000000000001', NULL, true, false, 1, 1, 1, 0
),
(
  'a0000000-0000-0000-0000-000000000006',
  'New Launch 3 BHK in Powai',
  'Brand new 3 BHK in an under-construction premium project. Book now at pre-launch prices with flexible payment plans.',
  32000000, 8000, NULL, 'buy', 'residential', '3BHK', 'unfurnished',
  1650, 1400, 1850,
  '["https://images.pexels.com/photos/3797991/pexels-photo-3797991.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2082087/pexels-photo-2082087.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Powai', 'Mumbai', 'Hiranandani Gardens, Powai, Mumbai 400076',
  '22', '45', 'south', 'under-construction', NULL,
  '["Swimming Pool","Gym","Clubhouse","Sky Deck","Concierge","EV Charging","Smart Home"]'::jsonb,
  NULL, '00000000-0000-0000-0000-000000000002', true, true, 3, 3, 1, 2
),
(
  'a0000000-0000-0000-0000-000000000007',
  'Commercial Office Space in Connaught Place',
  'Prime commercial office space in the heart of Delhi. Perfect for startups and established businesses looking for prestigious address.',
  150000, 20000, 450000, 'rent', 'commercial', '3BHK', 'semi-furnished',
  2000, 1800, 2200,
  '["https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/3182826/pexels-photo-3182826.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/260689/pexels-photo-260689.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Connaught Place', 'Delhi', 'Block M, Connaught Place, New Delhi 110001',
  '4', '8', 'north', 'ready', 10,
  '["Conference Room","Cafeteria","Power Backup","24x7 Security","Lift","Reception"]'::jsonb,
  NULL, '00000000-0000-0000-0000-000000000002', true, false, 0, 2, 1, 2
),
(
  'a0000000-0000-0000-0000-000000000008',
  'Studio Apartment in Koramangala',
  'Trendy studio apartment perfect for singles. Modern interiors with all essential amenities included.',
  18000, 2000, 54000, 'rent', 'residential', '1RK', 'furnished',
  450, 400, 500,
  '["https://images.pexels.com/photos/1428348/pexels-photo-1428348.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2029661/pexels-photo-2029661.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Koramangala', 'Bangalore', '5th Block, Koramangala, Bangalore 560095',
  '3', '6', 'east', 'ready', 2,
  '["Power Backup","24x7 Security","Lift","Water Purifier"]'::jsonb,
  '00000000-0000-0000-0000-000000000001', NULL, true, false, 1, 1, 1, 0
),
(
  'a0000000-0000-0000-0000-000000000009',
  'Premium 2 BHK in Greater Noida',
  'Affordable 2 BHK in upcoming Greater Noida location. Great investment opportunity with excellent connectivity.',
  4500000, 3000, NULL, 'buy', 'residential', '2BHK', 'unfurnished',
  1050, 900, 1200,
  '["https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Sector 1', 'Greater Noida', 'Alpha 1, Greater Noida, UP 201310',
  '7', '14', 'north-west', 'ready', 4,
  '["Swimming Pool","Gym","Power Backup","24x7 Security","Garden","Clubhouse"]'::jsonb,
  NULL, '00000000-0000-0000-0000-000000000002', true, false, 2, 2, 1, 1
),
(
  'a0000000-0000-0000-0000-000000000010',
  'Luxury Penthouse in Bandra',
  'Exclusive penthouse with panoramic sea views. Features private terrace, infinity pool, and ultra-luxury finishes.',
  200000000, 75000, NULL, 'buy', 'residential', '5+BHK', 'furnished',
  8000, 7500, 9000,
  '["https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/3288103/pexels-photo-3288103.png?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  'Bandra West', 'Mumbai', 'Carter Road, Bandra West, Mumbai 400050',
  '35', '35', 'west', 'ready', 0,
  '["Private Pool","Home Theater","Wine Cellar","Private Lift","Smart Home","Helipad Access","Concierge"]'::jsonb,
  '00000000-0000-0000-0000-000000000001', NULL, true, true, 6, 7, 2, 6
)
ON CONFLICT (id) DO NOTHING;
