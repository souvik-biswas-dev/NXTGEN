-- ============================================================
-- Migration 007: Rate limiting + admin audit log
-- ============================================================

-- 1. RATE-LIMIT COUNTERS --------------------------------------
-- Keyed per (user_id, action). Each row is a fixed window:
-- count how many calls in window_start..window_start+window_seconds.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id       UUID        NOT NULL,
  action        TEXT        NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON public.rate_limits (window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Only SECURITY DEFINER functions touch this; no direct access.
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Try to consume one "token". Returns TRUE if allowed.
-- Rolls to a new window automatically. Fixed-window counter
-- (simple and good enough for spam control).
CREATE OR REPLACE FUNCTION public.rl_check(
  p_action   TEXT,
  p_limit    INTEGER,
  p_window_s INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_window TIMESTAMPTZ := date_trunc('second', NOW())
                          - (EXTRACT(EPOCH FROM NOW())::BIGINT % p_window_s) * INTERVAL '1 second';
  v_count  INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limits (user_id, action, window_start, count)
    VALUES (v_user, p_action, v_window, 1)
    ON CONFLICT (user_id, action, window_start)
    DO UPDATE SET count = public.rate_limits.count + 1
    RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rl_check(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rl_check(TEXT, INTEGER, INTEGER) TO authenticated;

-- Opportunistic cleanup of old rows (run from a scheduled job, or ad hoc).
CREATE OR REPLACE FUNCTION public.rl_cleanup(p_older_than INTERVAL DEFAULT INTERVAL '1 day')
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE window_start < NOW() - p_older_than;
$$;
REVOKE EXECUTE ON FUNCTION public.rl_cleanup(INTERVAL) FROM PUBLIC;

-- 2. ENFORCE RATE LIMITS VIA TRIGGERS -------------------------
-- Triggers run in the invoker's security context, so auth.uid() is populated
-- the same way it is for regular client calls.

-- Limit: 10 property posts per 24 hours per user.
CREATE OR REPLACE FUNCTION public.enforce_property_post_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service_role/admin bypass (uid NULL when using service key)
  END IF;
  IF NOT public.rl_check('property_post', 10, 86400) THEN
    RAISE EXCEPTION 'Rate limit exceeded for property posts. Try again later.'
      USING ERRCODE = '42901';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rl_property_post ON public.properties;
CREATE TRIGGER rl_property_post
  BEFORE INSERT ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_post_limit();

-- Limit: 30 inquiries per hour per user.
CREATE OR REPLACE FUNCTION public.enforce_inquiry_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT public.rl_check('inquiry', 30, 3600) THEN
    RAISE EXCEPTION 'Too many inquiries sent. Please wait before sending more.'
      USING ERRCODE = '42901';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rl_inquiry ON public.inquiries;
CREATE TRIGGER rl_inquiry
  BEFORE INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_inquiry_limit();

-- 3. ADMIN AUDIT LOG ------------------------------------------
-- Every privileged mutation an admin performs (verify property,
-- change role, delete user, etc.) writes one row here. Append-only.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID,                 -- admin user_id (null if from service role w/o session)
  actor_email TEXT,                 -- captured at write-time; resilient to later renames
  action      TEXT NOT NULL,        -- e.g. 'property.verify', 'user.role_change'
  subject_type TEXT,                -- 'property' | 'user' | 'subscription' | ...
  subject_id  TEXT,                 -- string form of the target's id
  before      JSONB,                -- state before (optional)
  after       JSONB,                -- state after (optional)
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_subject ON public.admin_audit_log(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log(created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Append-only: no UPDATE/DELETE from any client key.
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
-- Admins can read via RLS.
GRANT SELECT ON public.admin_audit_log TO authenticated;

DROP POLICY IF EXISTS "Admins can read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins can read audit log" ON public.admin_audit_log
  FOR SELECT USING (public.is_admin());

-- Writer function — admin panel (service role) is the only caller.
-- Writes are explicit, not trigger-based, so the admin-panel UI can
-- include a 'before/after' snapshot and human-readable metadata.
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_subject_type TEXT,
  p_subject_id TEXT,
  p_before JSONB DEFAULT NULL,
  p_after  JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
  v_actor UUID := auth.uid();
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
  INSERT INTO public.admin_audit_log
    (actor_id, actor_email, action, subject_type, subject_id, before, after, metadata)
    VALUES (v_actor, v_email, p_action, p_subject_type, p_subject_id, p_before, p_after, p_metadata)
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT, JSONB, JSONB, JSONB) FROM PUBLIC;
