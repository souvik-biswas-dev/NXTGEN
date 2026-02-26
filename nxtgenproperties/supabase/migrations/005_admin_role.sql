-- ============================================================
-- Migration: Add Admin Role
-- Description: Adds 'admin' role to users_profiles and creates
--              admin-specific RLS policies. Run this in Supabase
--              SQL Editor before using the admin panel.
-- ============================================================

-- Step 1: Drop the existing role constraint
ALTER TABLE public.users_profiles
  DROP CONSTRAINT IF EXISTS users_profiles_role_check;

-- Step 2: Add new constraint that includes 'admin'
ALTER TABLE public.users_profiles 
  ADD CONSTRAINT users_profiles_role_check
  CHECK (role IN ('buyer', 'owner', 'broker', 'admin'));

-- Step 3: Drop any old admin policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.users_profiles;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins can view all favorites" ON public.favorites;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

-- NOTE: The service role key used in the admin panel BYPASSES RLS entirely.
-- These policies below are for if you ever use the anon key with admin role.

-- Step 4: Admin policies for users_profiles
CREATE POLICY "Admins can view all profiles" ON public.users_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.users_profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles" ON public.users_profiles
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

-- Step 5: Admin policies for properties
CREATE POLICY "Admins can update all properties" ON public.properties
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all properties" ON public.properties
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

-- Step 6: Admin policies for subscriptions
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

-- Step 7: Admin policies for inquiries
CREATE POLICY "Admins can view all inquiries" ON public.inquiries
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

-- Step 8: Locality reviews - allow admins to manage
DROP POLICY IF EXISTS "Admins can manage locality reviews" ON public.locality_reviews;
CREATE POLICY "Admins can insert locality reviews" ON public.locality_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );
CREATE POLICY "Admins can update locality reviews" ON public.locality_reviews
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );
CREATE POLICY "Admins can delete locality reviews" ON public.locality_reviews
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM public.users_profiles WHERE role = 'admin'
    )
  );

-- ============================================================
-- AFTER running this migration, create your first admin user:
--
-- Option A: Via Supabase Dashboard (Recommended)
--   1. Go to Authentication > Users > Invite User
--   2. Enter admin email and send invite
--   3. After they sign up, run this SQL:
--      UPDATE public.users_profiles
--        SET role = 'admin'
--        WHERE email = 'your-admin@example.com';
--
-- Option B: Via SQL (if you have the user_id)
--   UPDATE public.users_profiles
--     SET role = 'admin'
--     WHERE user_id = 'paste-user-uuid-here';
-- ============================================================
