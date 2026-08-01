-- Fixed Migration Script
-- Run this in Supabase SQL Editor

-- 1. Create table if it doesn't exist (Base structure)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns safely (using IF NOT EXISTS)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_credits INTEGER DEFAULT 5;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_credit_reset DATE;

-- 3. Add other personal columns safely
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weight_kg INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- 4. Create Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);

-- 5. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Create policies (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Allow public insert" ON public.users;
CREATE POLICY "Allow public insert" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.users;
CREATE POLICY "Allow public select" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update" ON public.users;
CREATE POLICY "Allow public update" ON public.users FOR UPDATE USING (true);

SELECT 'Migration completed successfully!' as status;
