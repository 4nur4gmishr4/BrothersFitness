import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auoljtzkmfnmwzfbwdwq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2xqdHprbWZubXd6ZmJ3ZHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODc2MTUsImV4cCI6MjA4MzI2MzYxNX0.riibLa8mhOm2-R-Clqoksegn95wEGWNs4TE2UL-4tnc';

// Safe client instance for production resilience
let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (!supabaseClient) {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
};

/**
 * Safe proxy for Supabase client
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
    },
});

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
