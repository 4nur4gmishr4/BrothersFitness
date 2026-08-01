import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client using the service-role key, which BYPASSES RLS.
// Use this ONLY in API routes / server contexts that authenticate the caller
// themselves (admin HMAC token, verified Supabase session token, cron secret).
// Never import this from a client component ("use client") — it would ship the
// service-role key to the browser.
//
// Fails closed: throws if the key is missing rather than silently falling back
// to the anon client, which would re-open admin data to the public anon key.

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(
            'Supabase service-role configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        );
    }

    if (!serviceClient) {
        serviceClient = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return serviceClient;
}
