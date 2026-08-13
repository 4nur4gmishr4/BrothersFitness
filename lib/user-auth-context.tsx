"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type UserProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    photo_url?: string | null;
    date_of_birth?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    gender?: string | null;
    daily_credits: number;
    last_credit_reset: string | null;
};

type UserAuthContextType = {
    user: UserProfile | null;
    /** Supabase access token for server-side session verification (Authorization header). */
    accessToken: string | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    remainingCredits: number;
    showWelcome: boolean;
    setShowWelcome: (show: boolean) => void;
    showLoginModal: boolean;
    setShowLoginModal: (show: boolean) => void;
    // Auth actions
    signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
    // Credit actions
    checkCredit: () => Promise<boolean>;
    deductCredit: () => Promise<boolean>;
    refreshCredits: () => Promise<void>;
};

export type ProfileUpdateData = {
    full_name?: string;
    date_of_birth?: string;
    height_cm?: number;
    weight_kg?: number;
    gender?: string;
    photo_url?: string;
};

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

import { toast } from "sonner";
import { MAX_DAILY_CREDITS, istToday } from '@/lib/config';

export function UserAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    /**
     * Load the user's `users` row (or create it the first time) and populate
     * local state. users.id == auth uid so ownership RLS allows the upsert.
     */
    const loadUserFromSession = useCallback(async (session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }; access_token: string }) => {
        const authId = session.user.id;
        setAccessToken(session.access_token);

        let { data: row } = await supabase
            .from('users')
            .select('*')
            .eq('id', authId)
            .single();

        // First sign-in: create the row. RLS INSERT policy requires id == auth.uid().
        if (!row) {
            const fallbackName =
                (session.user.user_metadata?.full_name as string) ||
                session.user.email?.split('@')[0] ||
                'Member';
            const { data: inserted } = await supabase
                .from('users')
                .insert({
                    id: authId,
                    email: session.user.email || null,
                    full_name: fallbackName,
                    daily_credits: MAX_DAILY_CREDITS,
                    last_credit_reset: istToday(),
                })
                .select('*')
                .single();
            row = inserted;
        }

        if (!row) return;

        const today = istToday();
        setUser({
            id: row.id,
            email: row.email || session.user.email || null,
            full_name: row.full_name || (session.user.user_metadata?.full_name as string) || 'Member',
            photo_url: row.photo_url ?? null,
            date_of_birth: row.date_of_birth ?? null,
            height_cm: row.height_cm ?? null,
            weight_kg: row.weight_kg ?? null,
            gender: row.gender ?? null,
            daily_credits: row.last_credit_reset === today ? row.daily_credits : MAX_DAILY_CREDITS,
            last_credit_reset: today,
        });
    }, []);

    // Listen to Supabase auth state
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    await loadUserFromSession(session);
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user && isMounted) {
                await loadUserFromSession(session);
            } else if (isMounted) {
                setUser(null);
                setAccessToken(null);
            }
            if (isMounted) setIsLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [loadUserFromSession]);

    const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const toastId = toast.loading("Redirecting to Google...", { duration: 5000 });
            const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });

            if (error) {
                toast.dismiss(toastId);
                toast.error(`Login Error: ${error.message}`);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to sign in with Google";
            toast.error(msg);
            return { success: false, error: msg };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setAccessToken(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
        // Timeout promise
        const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) => {
            setTimeout(() => reject(new Error('Update timed out after 7 seconds')), 7000);
        });

        const updateOperation = async () => {
            if (!user) {
                return { success: false, error: 'Not authenticated' };
            }

            const { error: sbError } = await supabase
                .from('users')
                .update({
                    full_name: data.full_name ?? user.full_name,
                    date_of_birth: data.date_of_birth ?? user.date_of_birth,
                    height_cm: data.height_cm ?? user.height_cm,
                    weight_kg: data.weight_kg ?? user.weight_kg,
                    gender: data.gender ?? user.gender,
                    photo_url: data.photo_url ?? user.photo_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (sbError) {
                return { success: false, error: sbError.message };
            }

            // Update local state
            setUser(prev => prev ? { ...prev, ...data } : null);

            return { success: true };
        };

        try {
            return await Promise.race([updateOperation(), timeoutPromise]) as { success: boolean; error?: string };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Update failed';
            return { success: false, error: message };
        }
    };

    // Check if user has enough credits without deducting (client is optimistic;
    // the server enforces the real, atomic deduction).
    const checkCredit = useCallback(async (): Promise<boolean> => {
        if (!user) return false;
        return (user.daily_credits ?? 0) > 0;
    }, [user]);

    // Local-only optimistic deduction. The server is the source of truth and
    // deducts atomically; we never write credits from the client (this also
    // removes the old double-deduct where client AND server both decremented).
    const useCredit = useCallback(async (): Promise<boolean> => {
        if (!user || user.daily_credits <= 0) return false;
        setUser(prev => prev ? { ...prev, daily_credits: prev.daily_credits - 1 } : null);
        return true;
    }, [user]);

    const refreshCredits = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            const today = istToday();

            const { data } = await supabase
                .from('users')
                .select('daily_credits, last_credit_reset')
                .eq('id', user.id)
                .single();

            if (data) {
                let credits = data.daily_credits;

                if (data.last_credit_reset !== today) {
                    // New IST day: grant a fresh quota.
                    credits = MAX_DAILY_CREDITS;
                    await supabase
                        .from('users')
                        .update({ daily_credits: credits, last_credit_reset: today })
                        .eq('id', user.id);
                } else if (data.daily_credits > MAX_DAILY_CREDITS) {
                    // Strict cap for the current day
                    credits = MAX_DAILY_CREDITS;
                    await supabase
                        .from('users')
                        .update({ daily_credits: credits })
                        .eq('id', user.id);
                }

                setUser(prev => prev ? { ...prev, daily_credits: credits, last_credit_reset: today } : null);
            }
        } catch {
            console.error('Failed to refresh credits');
        }
    }, [user]);

    return (
        <UserAuthContext.Provider value={{
            user,
            accessToken,
            isLoading,
            isLoggedIn: !!user,
            remainingCredits: user?.daily_credits ?? MAX_DAILY_CREDITS,
            showWelcome,
            setShowWelcome,
            showLoginModal,
            setShowLoginModal,
            signInWithGoogle,
            logout,
            updateProfile,
            checkCredit,
            deductCredit: useCredit,
            refreshCredits
        }}>
            {children}
        </UserAuthContext.Provider>
    );
}

export function useUserAuth() {
    const context = useContext(UserAuthContext);
    if (context === undefined) {
        throw new Error('useUserAuth must be used within a UserAuthProvider');
    }
    return context;
}
