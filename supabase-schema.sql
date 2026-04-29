-- BroFit User Authentication Schema (Firebase Version)
-- Run this in your Supabase SQL Editor to create the users table

-- Drop existing table if you want to start fresh (uncomment if needed)
-- DROP TABLE IF EXISTS public.users;

-- Create the users table for customer authentication (with Firebase UID)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE,
    mobile VARCHAR(15),
    otp VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    full_name VARCHAR(100),
    date_of_birth DATE,
    height_cm INTEGER CHECK (height_cm >= 50 AND height_cm <= 300),
    weight_kg INTEGER CHECK (weight_kg >= 10 AND weight_kg <= 500),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    daily_credits INTEGER DEFAULT 5 CHECK (daily_credits >= 0 AND daily_credits <= 5),
    last_credit_reset DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts for new users
CREATE POLICY "Allow public insert" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anonymous select
CREATE POLICY "Allow public select" ON public.users
    FOR SELECT
    USING (true);

-- Policy: Allow anonymous update
CREATE POLICY "Allow public update" ON public.users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;

-- Create function to reset daily credits (to be called by cron)
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET daily_credits = 5,
        last_credit_reset = CURRENT_DATE
    WHERE last_credit_reset < CURRENT_DATE OR last_credit_reset IS NULL;
END;
$$ language 'plpgsql';

COMMENT ON TABLE public.users IS 'Customer users for BroFit app with Firebase Phone Auth and daily AI credits';
