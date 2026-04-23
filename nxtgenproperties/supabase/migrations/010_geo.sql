-- ============================================================
-- Migration 010: Geo support for the map view
-- ============================================================
-- Approach: add optional lat/lng to properties (filled in as
-- users post with a location picker) AND seed a city-centroid
-- table so existing rows without coords still place a pin on
-- their city centre. The map UI joins through this table.
-- ============================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Partial index so only geo-tagged rows are indexed (most existing rows are null).
CREATE INDEX IF NOT EXISTS idx_properties_geo
  ON public.properties (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.city_centroids (
  city      TEXT PRIMARY KEY,
  latitude  DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

ALTER TABLE public.city_centroids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read city centroids" ON public.city_centroids;
CREATE POLICY "Anyone can read city centroids" ON public.city_centroids
  FOR SELECT USING (true);

INSERT INTO public.city_centroids (city, latitude, longitude) VALUES
  ('Mumbai',      19.0760, 72.8777),
  ('Delhi',       28.6139, 77.2090),
  ('New Delhi',   28.6139, 77.2090),
  ('Bengaluru',   12.9716, 77.5946),
  ('Bangalore',   12.9716, 77.5946),
  ('Hyderabad',   17.3850, 78.4867),
  ('Chennai',     13.0827, 80.2707),
  ('Kolkata',     22.5726, 88.3639),
  ('Pune',        18.5204, 73.8567),
  ('Ahmedabad',   23.0225, 72.5714),
  ('Jaipur',      26.9124, 75.7873),
  ('Lucknow',     26.8467, 80.9462),
  ('Surat',       21.1702, 72.8311),
  ('Kanpur',      26.4499, 80.3319),
  ('Nagpur',      21.1458, 79.0882),
  ('Indore',      22.7196, 75.8577),
  ('Bhopal',      23.2599, 77.4126),
  ('Patna',       25.5941, 85.1376),
  ('Chandigarh',  30.7333, 76.7794),
  ('Gurgaon',     28.4595, 77.0266),
  ('Gurugram',    28.4595, 77.0266),
  ('Noida',       28.5355, 77.3910),
  ('Kochi',       9.9312,  76.2673),
  ('Coimbatore',  11.0168, 76.9558),
  ('Vadodara',    22.3072, 73.1812),
  ('Visakhapatnam', 17.6868, 83.2185),
  ('New York',    40.7128, -74.0060)
ON CONFLICT (city) DO UPDATE
  SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;
