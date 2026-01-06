# Supabase Database Setup for Brother's Fitness

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your **Project URL** and **anon key** from Settings > API

## Step 2: Run SQL Schema
Go to SQL Editor in your Supabase dashboard and run:

```sql
-- Create gym_members table
CREATE TABLE gym_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  mobile TEXT NOT NULL,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  photo_url TEXT,
  membership_type TEXT,
  membership_start DATE,
  membership_end DATE,
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we use server-side auth)
CREATE POLICY "Allow all operations" ON gym_members FOR ALL USING (true);
```

## Step 3: Create Storage Bucket
1. Go to Storage in Supabase dashboard
2. Click "New Bucket"
3. Name: `member-photos`
4. Set to **Public** (for photo access)

## Step 4: Update Environment Variables
Add to your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_PASSWORD=YourSecurePassword123
```

## Step 5: Access Admin Panel
1. Go to `/admin/login`
2. Enter the admin password (default: `BroFit@Admin2024`)
3. You'll see "Manage Members" in the navbar when logged in
