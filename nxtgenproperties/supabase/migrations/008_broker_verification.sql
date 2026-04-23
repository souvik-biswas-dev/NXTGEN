-- ============================================================
-- Migration 008: Broker verification requests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.broker_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  rera_id TEXT NOT NULL,
  agency_name TEXT,
  years_experience INTEGER,
  id_document_url TEXT NOT NULL,
  rera_document_url TEXT NOT NULL,
  agency_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broker_verif_status ON public.broker_verifications(status);
CREATE INDEX IF NOT EXISTS idx_broker_verif_submitted ON public.broker_verifications(submitted_at DESC);

ALTER TABLE public.broker_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User reads own verification" ON public.broker_verifications;
CREATE POLICY "User reads own verification" ON public.broker_verifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "User submits own verification" ON public.broker_verifications;
CREATE POLICY "User submits own verification" ON public.broker_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- A user can resubmit (update their own) only while still pending/rejected,
-- never while approved. Admins can update any row.
DROP POLICY IF EXISTS "User updates own pending verification" ON public.broker_verifications;
CREATE POLICY "User updates own pending verification" ON public.broker_verifications
  FOR UPDATE USING (
    (auth.uid() = user_id AND status IN ('pending', 'rejected'))
    OR public.is_admin()
  );

DROP TRIGGER IF EXISTS broker_verif_updated_at ON public.broker_verifications;
CREATE TRIGGER broker_verif_updated_at BEFORE UPDATE ON public.broker_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-flip users_profiles.verified_broker when admin approves / revokes.
CREATE OR REPLACE FUNCTION public.sync_broker_verified_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.users_profiles SET verified_broker = TRUE, role = 'broker'
      WHERE user_id = NEW.user_id;
    NEW.reviewed_at := NOW();
  ELSIF NEW.status <> 'approved' AND OLD.status = 'approved' THEN
    UPDATE public.users_profiles SET verified_broker = FALSE
      WHERE user_id = NEW.user_id;
    NEW.reviewed_at := NOW();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_broker_verified ON public.broker_verifications;
CREATE TRIGGER sync_broker_verified
  BEFORE UPDATE ON public.broker_verifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_broker_verified_flag();

-- Private bucket for sensitive identity documents.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'broker-documents',
    'broker-documents',
    false,
    10485760, -- 10 MB (larger for PDF scans)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Owner-only read, owner-only upload under <auth.uid>/... path. Admin can read via service role.
DROP POLICY IF EXISTS "Broker docs: owner read" ON storage.objects;
CREATE POLICY "Broker docs: owner read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'broker-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Broker docs: owner upload" ON storage.objects;
CREATE POLICY "Broker docs: owner upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'broker-documents'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Broker docs: owner update" ON storage.objects;
CREATE POLICY "Broker docs: owner update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'broker-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Broker docs: owner delete" ON storage.objects;
CREATE POLICY "Broker docs: owner delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'broker-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
