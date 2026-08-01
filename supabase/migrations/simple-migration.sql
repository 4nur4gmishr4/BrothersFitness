-- Idempotent Migration Script (safe to run repeatedly)
-- Run this in Supabase SQL Editor.
--
-- Repairs the users table to the owner-only RLS model:
--   * users.id = auth.uid()
--   * anon key can no longer read/update every row (C1)
--   * credit spending goes through the atomic spend_user_credit() RPC

-- 1. Create table if it doesn't exist (Base structure)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns safely (using IF NOT EXISTS)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_credits INTEGER DEFAULT 5 CHECK (daily_credits >= 0 AND daily_credits <= 5);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_credit_reset DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height_cm INTEGER CHECK (height_cm >= 50 AND height_cm <= 300);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weight_kg INTEGER CHECK (weight_kg >= 10 AND weight_kg <= 500);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- 3. Create Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);

-- 4. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Replace any legacy open policies with owner-only policies
DROP POLICY IF EXISTS "Allow public insert" ON public.users;
DROP POLICY IF EXISTS "Allow public select" ON public.users;
DROP POLICY IF EXISTS "Allow public update" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

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

-- 6. Revoke anon access entirely
REVOKE ALL ON public.users FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- 7. Atomic credit spend RPC (IST-aware, transaction-safe)
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

SELECT 'Migration completed successfully!' as status;
