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

/**
 * For backward compatibility.
 * WARNING: This will throw at runtime if Supabase env vars are not set.
 * Prefer using getSupabase() for explicit error handling.
 */
export const supabase: SupabaseClient = (() => {
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a proxy that throws on any property access
        return new Proxy({} as SupabaseClient, {
            get() {
                throw new Error(
                    'Supabase client not initialized: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
                );
            },
        });
    }
    return createClient(supabaseUrl, supabaseAnonKey);
})();

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
