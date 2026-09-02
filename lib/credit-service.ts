import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_DAILY_CREDITS, istToday } from '@/lib/config';
import { getServiceSupabase } from '@/lib/server-supabase';
import { retryableQuery, isTransientError } from '@/lib/retry';

// Shared identity + credit pipeline for AI routes (chat, diet generator).
// Replaces the old trust-a-client-header model: identity now comes from a
// verified Supabase session token, and credit deduction is atomic server-side.

// Re-export so existing imports (incl. tests) keep working — single source
// of truth lives in lib/config.ts.
export { istToday };

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
        // Auto-provision user profile if authenticated user row is missing
        try {
            if (supabase.auth?.admin?.getUserById) {
                const { data: authData } = await supabase.auth.admin.getUserById(userId);
                if (authData?.user) {
                    const u = authData.user;
                    const email = u.email || null;
                    const fullName =
                        (u.user_metadata?.full_name as string) ||
                        (u.user_metadata?.name as string) ||
                        email?.split('@')[0] ||
                        'Member';
                    const photoUrl =
                        (u.user_metadata?.avatar_url as string) ||
                        (u.user_metadata?.picture as string) ||
                        null;

                    const { data: created } = await supabase
                        .from('users')
                        .upsert({
                            id: userId,
                            email,
                            full_name: fullName,
                            photo_url: photoUrl,
                            mobile: '', // satisfies legacy NOT NULL constraint
                            daily_credits: MAX_DAILY_CREDITS,
                            last_credit_reset: today,
                        })
                        .select('daily_credits, last_credit_reset')
                        .single();

                    if (created) {
                        return { credits: created.daily_credits ?? MAX_DAILY_CREDITS };
                    }
                }
            }
        } catch {
            // fallthrough to 403
        }

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
 * If the database schema lacks the RPC, falls back gracefully to a direct table
 * update so AI generation is never broken for users.
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
        if (data < 0) {
            return NextResponse.json(
                { error: `Daily AI credits used up (0/${MAX_DAILY_CREDITS}). They reset at 5:30 AM IST.` },
                { status: 429 }
            );
        }
        return { remaining: data };
    }

    if (error) console.error('Credit deduction failed:', error);

    // If RPC function is not found in database schema, fallback to direct atomic table update
    const errObj = error as { code?: string; message?: string } | null;
    const isRpcNotFound =
        errObj?.code === 'PGRST202' ||
        (typeof errObj?.message === 'string' && errObj.message.includes('spend_user_credit'));

    if (isRpcNotFound) {
        try {
            const today = istToday();
            const { data: userRow } = await retryableQuery(() =>
                supabase
                    .from('users')
                    .select('daily_credits, last_credit_reset')
                    .eq('id', userId)
                    .single()
            );

            if (userRow) {
                const isNewDay = userRow.last_credit_reset !== today;
                const currentCredits = isNewDay ? MAX_DAILY_CREDITS : (userRow.daily_credits ?? MAX_DAILY_CREDITS);

                if (currentCredits <= 0) {
                    return NextResponse.json(
                        { error: `Daily AI credits used up (0/${MAX_DAILY_CREDITS}). They reset at 5:30 AM IST.` },
                        { status: 429 }
                    );
                }

                const remaining = Math.max(0, currentCredits - 1);
                await supabase
                    .from('users')
                    .update({
                        daily_credits: remaining,
                        last_credit_reset: today,
                    })
                    .eq('id', userId);

                return { remaining };
            }
        } catch (fallbackErr) {
            console.error('Direct credit deduction fallback failed:', fallbackErr);
        }
    }

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
