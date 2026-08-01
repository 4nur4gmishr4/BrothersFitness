-- Admin tables migration (gym_members, contact_submissions, admin_activity_logs)
-- These were previously created manually without a migration, meaning RLS was
-- off and the public anon key could read them directly. This migration creates
-- them with RLS enabled and NO anon grants. Only the service-role key (which
-- bypasses RLS) can access them, so an RLS policy is deliberately not needed.
--
-- Contact submissions are INSERTED from the public contact form, so that one
-- table keeps an anon INSERT policy (name/email/phone/message only).

-- 1. gym_members ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gym_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    height_cm INTEGER CHECK (height_cm >= 50 AND height_cm <= 300),
    weight_kg INTEGER CHECK (weight_kg >= 10 AND weight_kg <= 500),
    photo_url TEXT,
    membership_type VARCHAR(20) NOT NULL DEFAULT 'Monthly',
    membership_start DATE,
    membership_end DATE,
    emergency_contact VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_members_mobile ON public.gym_members(mobile);
CREATE INDEX IF NOT EXISTS idx_gym_members_membership_end ON public.gym_members(membership_end);

ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gym_members FROM anon;

-- 2. contact_submissions -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON public.contact_submissions(created_at DESC);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public visitors may submit but never read other submissions.
CREATE POLICY "contact_submissions_insert_public" ON public.contact_submissions
    FOR INSERT
    WITH CHECK (true);

REVOKE ALL ON public.contact_submissions FROM anon;
REVOKE ALL ON public.contact_submissions FROM authenticated;
GRANT INSERT ON public.contact_submissions TO anon;

-- 3. admin_activity_logs -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(20) NOT NULL,
    member_id UUID,
    member_name VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON public.admin_activity_logs(created_at DESC);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_activity_logs FROM anon;
REVOKE ALL ON public.admin_activity_logs FROM authenticated;
