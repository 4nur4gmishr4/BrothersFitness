import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type GymMember = {
    id: string;
    full_name: string;
    email: string | null;
    mobile: string;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    photo_url: string | null;
    membership_type: string | null;
    membership_start: string | null;
    membership_end: string | null;
    emergency_contact: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type NewGymMember = Omit<GymMember, 'id' | 'created_at' | 'updated_at'>;
