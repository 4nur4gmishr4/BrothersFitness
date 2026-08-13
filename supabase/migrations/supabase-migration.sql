-- Migration: Add Google Sign-In columns to users table
-- Run this in Supabase SQL Editor

-- Add email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE public.users ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Column email added successfully';
    ELSE
        RAISE NOTICE 'Column email already exists';
    END IF;
END $$;

-- Add photo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='photo_url') THEN
        ALTER TABLE public.users ADD COLUMN photo_url TEXT;
        RAISE NOTICE 'Column photo_url added successfully';
    ELSE
        RAISE NOTICE 'Column photo_url already exists';
    END IF;
END $$;

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

SELECT 'Google Sign-In migration completed successfully!' as status;
