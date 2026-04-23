-- Fix phone OTP signup: email/name were NOT NULL but are absent for phone-only users.

-- 1. Relax NOT NULL constraints so phone-only users can be created without email/name.
ALTER TABLE public.users_profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.users_profiles ALTER COLUMN name DROP NOT NULL;

-- 2. Replace the trigger to handle phone-only signup (NEW.email and NEW.phone may both be set
--    or only one of them, depending on auth method).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Derive a display name: prefer metadata name, fall back to email prefix, then phone.
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    NEW.phone
  );

  INSERT INTO public.users_profiles (user_id, email, phone, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    v_name,
    'buyer'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
