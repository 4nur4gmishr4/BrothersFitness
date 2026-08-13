-- BroFit User Schema (Supabase Auth version)
-- Run this in your Supabase SQL Editor to create/repair the users table.
--
-- Security model:
--   * users.id = the Supabase auth user id (auth.uid()). The client creates its
--     own row on sign-in, which RLS allows only when id == auth.uid().
--   * All other rows are invisible/uneditable to the public anon key — no more
--     SELECT * FROM users exfiltration.
--   * Credit mutations run through the spend_user_credit() RPC (service-role
--     only), not through direct table grants.

-- Drop existing table if you want to start fresh (uncomment if needed)
-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,                     -- == auth.uid(), set by the client
    email VARCHAR(255),
    mobile VARCHAR(15),
    otp VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    full_name VARCHAR(100),
    photo_url TEXT,
    date_of_birth DATE,
    height_cm INTEGER CHECK (height_cm >= 50 AND height_cm <= 300),
    weight_kg INTEGER CHECK (weight_kg >= 10 AND weight_kg <= 500),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    daily_credits INTEGER DEFAULT 5 CHECK (daily_credits >= 0 AND daily_credits <= 5),
    last_credit_reset DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Owner-only policies: a user can only see/update their own row, and can only
-- create their own row (id must equal the signed-in auth uid).
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- No DELETE policy for authenticated users; only the service-role key deletes.

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Revoke the anonymous grants from the old open schema, then grant only what
-- authenticated users need (row security already restricts *which* rows).
REVOKE ALL ON public.users FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Atomic credit spend (transaction-safe, resets at IST midnight).
-- Returns the remaining credits, or 0 when the user has none left.
CREATE OR REPLACE FUNCTION spend_user_credit(p_uid UUID, p_max INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
    v_credits INTEGER;
BEGIN
    UPDATE public.users
    SET daily_credits = CASE
            WHEN last_credit_reset IS DISTINCT FROM v_today THEN p_max - 1
            ELSE daily_credits - 1
        END,
        last_credit_reset = v_today
    WHERE id = p_uid
      AND (last_credit_reset IS DISTINCT FROM v_today OR daily_credits > 0)
    RETURNING daily_credits INTO v_credits;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    RETURN v_credits;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Batch reset (for cron); IST-aware like spend_user_credit.
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET daily_credits = 5,
        last_credit_reset = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
    WHERE last_credit_reset < (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE
       OR last_credit_reset IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.users IS 'Customer users for BroFit app with daily AI credits, keyed by auth uid';
