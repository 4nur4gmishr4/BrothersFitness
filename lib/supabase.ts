import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy initialization to prevent build-time errors when env vars are not set
let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (!supabaseClient) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase environment variables are not configured');
        }
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
};

// For backward compatibility - will throw at runtime if env vars not set
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as SupabaseClient);

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
