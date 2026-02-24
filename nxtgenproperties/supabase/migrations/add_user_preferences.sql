-- Add user_preferences table (new feature for city-based feed)
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

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);

-- Drop existing policies for user_preferences if they exist
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

-- User Preferences Policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

-- Create or replace the function (safe to do multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_preferences
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.user_preferences IS 'Stores user search preferences and history for feed personalization';
