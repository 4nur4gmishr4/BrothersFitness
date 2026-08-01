import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_DAILY_CREDITS } from '@/lib/config';
import { getServiceSupabase } from '@/lib/server-supabase';
import { retryableQuery, isTransientError } from '@/lib/retry';

// Shared identity + credit pipeline for AI routes (chat, diet generator).
// Replaces the old trust-a-client-header model: identity now comes from a
// verified Supabase session token, and credit deduction is atomic server-side.

/** "Today" as YYYY-MM-DD in India Standard Time, so credits reset at 5:30 AM IST. */
export function istToday(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

function bearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
}

/**
 * Verify the caller's Supabase session token. Returns the service client +
 * verified user id, or a 401 NextResponse.
 */
export async function verifyUserToken(
    req: Request
): Promise<{ supabase: SupabaseClient; userId: string } | NextResponse> {
    const token = bearerToken(req.headers.get('Authorization'));
    if (!token) {
        return NextResponse.json(
            { error: 'Authentication required. Please login to use this feature.' },
            { status: 401 }
        );
    }

    const supabase = getServiceSupabase();
    // auth.getUser is an idempotent read — safe to retry on transient failures.
    const { data, error } = await retryableQuery(() => supabase.auth.getUser(token));
    if (error || !data?.user) {
        return NextResponse.json(
            { error: 'Session expired. Please login again.' },
            { status: 401 }
        );
    }

    return { supabase, userId: data.user.id };
}

/**
 * Read the user's current credit balance, accounting for the IST daily reset.
 * Returns remaining credits or an error NextResponse (403 no profile, 429 empty).
 */
export async function getUserCreditState(
    supabase: SupabaseClient,
    userId: string
): Promise<{ credits: number } | NextResponse> {
    const today = istToday();

    const { data, error } = await retryableQuery(() =>
        supabase
            .from('users')
            .select('daily_credits, last_credit_reset')
            .eq('id', userId)
            .single()
    );

    if (error || !data) {
        return NextResponse.json(
            { error: 'User profile not found. Please refresh and try again.' },
            { status: 403 }
        );
    }

    const credits = data.last_credit_reset === today ? data.daily_credits : MAX_DAILY_CREDITS;

    if (credits <= 0) {
        return NextResponse.json(
            { error: `Daily AI credits used up (0/${MAX_DAILY_CREDITS}). They reset at 5:30 AM IST.` },
            { status: 429 }
        );
    }

    return { credits };
}

/**
 * Atomically deduct one credit via the spend_user_credit RPC (transaction-safe,
 * no double-spend). Returns remaining credits, or an error NextResponse.
 * The RPC performs the IST reset inside the transaction.
 *
 * The RPC is NOT idempotent (each call decrements), so we never re-fire it on
 * a transient error. Instead we reconcile: if the RPC actually committed before
 * the error, `last_credit_reset` is now today and the balance already dropped —
 * report success. If nothing changed, surface the error for the client to retry
 * explicitly. This prevents double-spending a credit on a lost response.
 */
export async function spendUserCredit(
    supabase: SupabaseClient,
    userId: string
): Promise<{ remaining: number } | NextResponse> {
    const { data, error } = await supabase.rpc('spend_user_credit', {
        p_uid: userId,
        p_max: MAX_DAILY_CREDITS,
    });

    if (!error && typeof data === 'number') {
        if (data <= 0) {
            return NextResponse.json(
                { error: `Daily AI credits used up (0/${MAX_DAILY_CREDITS}). They reset at 5:30 AM IST.` },
                { status: 429 }
            );
        }
        return { remaining: data };
    }

    if (error) console.error('Credit deduction failed:', error);

    // Ambiguous outcome (network error): reconcile instead of retrying the RPC.
    if (isTransientError(error)) {
        const reconciled = await retryableQuery(() =>
            supabase
                .from('users')
                .select('daily_credits, last_credit_reset')
                .eq('id', userId)
                .single()
        );
        if (!reconciled.error && reconciled.data) {
            const committed = reconciled.data.last_credit_reset === istToday();
            if (committed) return { remaining: reconciled.data.daily_credits };
        }
    }

    return NextResponse.json(
        { error: 'Could not update your credits. Please try again.' },
        { status: 500 }
    );
}
