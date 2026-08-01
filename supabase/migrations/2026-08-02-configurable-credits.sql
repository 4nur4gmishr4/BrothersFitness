-- Idempotent Migration: make the daily AI credit cap configurable instead of
-- hardcoded to 5.
--
-- The app already passes p_max into spend_user_credit(), so the *spend* path
-- is config-driven. This migration removes the remaining DB-side assumptions:
--   * the users.daily_credits CHECK bound was capped at 5,
--   * the nightly reset_daily_credits() cron set a literal 5.
--
-- After applying, bump MAX_DAILY_CREDITS in the app env AND update
-- app_settings.max_daily_credits to the same value.

-- 1. Relax the column CHECK so a larger env-configured cap is valid.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_daily_credits_check;
ALTER TABLE public.users ADD CONSTRAINT users_daily_credits_check
    CHECK (daily_credits >= 0 AND daily_credits <= 100);

-- 2. Settings table the batch reset reads the cap from. RLS on with no
-- policies = locked to the table owner, so only SECURITY DEFINER functions
-- (reset_daily_credits) and the service role can touch it.
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value INTEGER NOT NULL
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value)
VALUES ('max_daily_credits', 5)
ON CONFLICT (key) DO NOTHING;

-- 3. Nightly reset honors the configured cap instead of a literal 5.
-- SECURITY DEFINER (matches spend_user_credit) so it can read app_settings
-- and update users regardless of the caller's RLS context.
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
DECLARE
    v_max INTEGER := COALESCE(
        (SELECT value FROM public.app_settings WHERE key = 'max_daily_credits'),
        5
    );
BEGIN
    UPDATE public.users
    SET daily_credits = v_max,
        last_credit_reset = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
    WHERE last_credit_reset < (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
       OR last_credit_reset IS NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;
