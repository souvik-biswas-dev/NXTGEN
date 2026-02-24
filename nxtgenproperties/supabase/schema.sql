
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'owner', 'broker')),
    avatar_url TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    verified_broker BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price BIGINT NOT NULL,
    maintenance BIGINT DEFAULT 0,
    deposit BIGINT DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('buy', 'rent')),
    category TEXT NOT NULL CHECK (category IN ('residential', 'commercial')),
    bhk TEXT NOT NULL CHECK (bhk IN ('1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5+BHK')),
    furnishing TEXT NOT NULL CHECK (furnishing IN ('furnished', 'semi-furnished', 'unfurnished')),
    area_sqft INTEGER NOT NULL,
    carpet_area INTEGER,
    super_built_up INTEGER,
    photos JSONB DEFAULT '[]'::JSONB,
    locality TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    floor TEXT,
    total_floors TEXT,
    facing TEXT CHECK (facing IN ('north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west')),
    possession TEXT NOT NULL CHECK (possession IN ('ready', 'under-construction')),
    age_years INTEGER,
    amenities JSONB DEFAULT '[]'::JSONB,
    owner_id UUID REFERENCES public.users_profiles(user_id) ON DELETE SET NULL,
    broker_id UUID REFERENCES public.users_profiles(user_id) ON DELETE SET NULL,
    verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms INTEGER NOT NULL DEFAULT 0,
    kitchens INTEGER NOT NULL DEFAULT 0,
    parkings INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT properties_owner_or_broker CHECK (owner_id IS NOT NULL OR broker_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.locality_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    locality TEXT NOT NULL,
    city TEXT NOT NULL,
    rating DECIMAL(3, 2) NOT NULL,
    comment_count INTEGER DEFAULT 0,
    avg_price BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(locality, city)
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users_profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
    preferred_cities TEXT[] DEFAULT '{}',
    preferred_types TEXT[] DEFAULT '{}',
    preferred_categories TEXT[] DEFAULT '{}',
    search_history JSONB DEFAULT '[]'::JSONB,
    last_search_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_locality ON public.properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_broker_id ON public.properties(broker_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_from_user ON public.inquiries(from_user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_to_user ON public.inquiries(to_user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON public.favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locality_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users_profiles;
DROP POLICY IF EXISTS "Anyone can view published properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can send inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can update their received inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Anyone can view locality reviews" ON public.locality_reviews;

-- Create User Profiles Policies
CREATE POLICY "Users can view all profiles" ON public.users_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.users_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create Properties Policies
CREATE POLICY "Anyone can view published properties" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Owners can insert own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR auth.uid() = broker_id);

CREATE POLICY "Owners can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = broker_id);

CREATE POLICY "Owners can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid() = owner_id OR auth.uid() = broker_id);

-- Create Inquiries Policies
CREATE POLICY "Users can view their inquiries" ON public.inquiries
    FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received inquiries" ON public.inquiries
    FOR UPDATE USING (auth.uid() = to_user_id);

-- Create Favorites Policies
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Locality Reviews Policies
CREATE POLICY "Anyone can view locality reviews" ON public.locality_reviews
    FOR SELECT USING (true);

-- Drop all existing storage policies
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Create storage policies for property images
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own property images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own property images" ON storage.objects
    FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_profiles_updated_at ON public.users_profiles;
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
DROP TRIGGER IF EXISTS update_locality_reviews_updated_at ON public.locality_reviews;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

-- Create triggers
CREATE TRIGGER update_users_profiles_updated_at BEFORE UPDATE ON public.users_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locality_reviews_updated_at BEFORE UPDATE ON public.locality_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO auth.users (id, email) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'owner1@example.com'),
    ('00000000-0000-0000-0000-000000000002', 'broker1@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.users_profiles (user_id, email, name, role, verified_broker, phone) VALUES
    ('00000000-0000-0000-0000-000000000001', 'owner1@example.com', 'John Doe', 'owner', false, '+919876543210'),
    ('00000000-0000-0000-0000-000000000002', 'broker1@example.com', 'Stella French', 'broker', true, '+919876543211')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.properties (title, description, price, type, category, bhk, furnishing, area_sqft, locality, city, possession, bedrooms, bathrooms, kitchens, parkings, photos, amenities, owner_id, featured) VALUES
('Sky View House', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ultricies mi id faucibus odio lobortis vitae, ante malesuada mauris.', 36000000, 'buy', 'residential', '4BHK', 'furnished', 5000, 'Opera Street', 'New York', 'ready', 6, 4, 2, 3, '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"]'::jsonb, '["Lift", "Parking", "Gym", "Power Backup"]'::jsonb, '00000000-0000-0000-0000-000000000001', true),
('Vraj House', 'Beautiful modern villa with pool and garden. Perfect for luxury living.', 92000000, 'buy', 'residential', '5+BHK', 'furnished', 8000, 'Yogi Street', 'New York', 'ready', 7, 5, 3, 4, '["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"]'::jsonb, '["Swimming Pool", "Gym", "Garden", "Security"]'::jsonb, '00000000-0000-0000-0000-000000000001', true);

COMMENT ON TABLE public.properties IS 'Stores all property listings';
COMMENT ON TABLE public.users_profiles IS 'Extended user profile information';
COMMENT ON TABLE public.inquiries IS 'Property inquiry messages between users';
COMMENT ON TABLE public.favorites IS 'User saved/favorited properties';
