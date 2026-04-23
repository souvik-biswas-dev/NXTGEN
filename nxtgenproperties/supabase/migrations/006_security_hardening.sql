-- ============================================================
-- Migration 006: Security Hardening
-- ============================================================
-- 1. Column-level GRANTs on users_profiles so email/phone
--    are readable only by the owner (via RPC) or admin.
-- 2. Storage INSERT policies validate that the upload path
--    starts with the uploader's auth.uid (stops path hijacking).
-- 3. Bucket-level MIME + size limits on property-images and
--    profile-avatars.
-- 4. RPCs: get_my_contact(), admin_get_user_contact(uid).
-- ============================================================

-- 1. COLUMN-LEVEL GRANTS ON users_profiles --------------------

REVOKE SELECT ON public.users_profiles FROM anon, authenticated;
REVOKE UPDATE ON public.users_profiles FROM anon, authenticated;
REVOKE INSERT ON public.users_profiles FROM anon, authenticated;

GRANT SELECT (id, user_id, name, role, avatar_url, rating, verified_broker, created_at, updated_at)
  ON public.users_profiles TO anon, authenticated;

GRANT INSERT (user_id, email, phone, name, role, avatar_url)
  ON public.users_profiles TO authenticated;

GRANT UPDATE (name, phone, email, avatar_url, role)
  ON public.users_profiles TO authenticated;

-- RLS still enforces row ownership on INSERT/UPDATE — already defined.
-- For SELECT, permit row visibility; column GRANT hides email/phone.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users_profiles;
CREATE POLICY "Public profile row visibility" ON public.users_profiles
  FOR SELECT USING (true);

-- 2. RPCs FOR PRIVILEGED READ ---------------------------------

CREATE OR REPLACE FUNCTION public.get_my_contact()
RETURNS TABLE(email TEXT, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.phone
  FROM public.users_profiles p
  WHERE p.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_contact(target_user_id UUID)
RETURNS TABLE(email TEXT, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email, p.phone
  FROM public.users_profiles p
  WHERE p.user_id = target_user_id AND public.is_admin();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_contact() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_contact(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_contact() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_contact(UUID) TO authenticated;

-- 3. TIGHTEN STORAGE INSERT POLICIES --------------------------
-- Old "Authenticated users can upload property images" only
-- checked auth.role(), letting one user write into another's
-- folder. Enforce path prefix = auth.uid().

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload property images to own folder" ON storage.objects;
CREATE POLICY "Users can upload property images to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar to own folder" ON storage.objects;
CREATE POLICY "Users can upload own avatar to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. BUCKET SIZE + MIME LIMITS --------------------------------
-- 5 MB max, images only.
UPDATE storage.buckets
  SET file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  WHERE id IN ('property-images', 'profile-avatars');

-- 5. AUTO-CREATE PROFILE ROW ON SIGNUP ------------------------
-- SECURITY DEFINER so the trigger runs as table owner and can
-- INSERT despite the narrowed column GRANTs above. Idempotent.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'buyer'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
