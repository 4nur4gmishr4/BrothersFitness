"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { MAX_DAILY_CREDITS, istToday } from '@/lib/config';

export type UserProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    photo_url?: string | null;
    phone?: string | null;
    date_of_birth?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    gender?: string | null;
    fitness_goal?: string | null;
    diet_preference?: string | null;
    daily_credits: number;
    last_credit_reset: string | null;
};

export type ProfileUpdateData = {
    full_name?: string;
    phone?: string;
    date_of_birth?: string;
    height_cm?: number;
    weight_kg?: number;
    gender?: string;
    fitness_goal?: string;
    diet_preference?: string;
    photo_url?: string;
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

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    /**
     * Load the user's `users` row and populate local state with Google metadata fallbacks.
     */
    const loadUserFromSession = useCallback(async (session: {
        user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
        access_token: string;
    }) => {
        const authId = session.user.id;
        setAccessToken(session.access_token);

        const metadata = session.user.user_metadata || {};
        const metadataPhoto =
            (metadata.avatar_url as string) ||
            (metadata.picture as string) ||
            (metadata.photo_url as string) ||
            null;
        const metadataName =
            (metadata.full_name as string) ||
            (metadata.name as string) ||
            session.user.email?.split('@')[0] ||
            'Member';

        let { data: row } = await supabase
            .from('users')
            .select('*')
            .eq('id', authId)
            .single();

        // First sign-in: create the row. RLS INSERT policy requires id == auth.uid().
        if (!row) {
            const { data: inserted } = await supabase
                .from('users')
                .insert({
                    id: authId,
                    email: session.user.email || null,
                    full_name: metadataName,
                    photo_url: metadataPhoto,
                    daily_credits: MAX_DAILY_CREDITS,
                    last_credit_reset: istToday(),
                })
                .select('*')
                .single();
            row = inserted;
        } else if (!row.photo_url && metadataPhoto) {
            // Update row with Google OAuth picture if row didn't have one
            try {
                await supabase
                    .from('users')
                    .update({ photo_url: metadataPhoto })
                    .eq('id', authId);
            } catch {
                // non-blocking
            }
        }

        const effectivePhoto = row?.photo_url || metadataPhoto;
        const today = istToday();

        // Load cached local preferences if available
        let localPrefs: Record<string, unknown> = {};
        try {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(`brofit_user_preferences_${authId}`);
                if (stored) localPrefs = JSON.parse(stored);
            }
        } catch {
            // ignore
        }

        setUser({
            id: row?.id || authId,
            email: row?.email || session.user.email || null,
            full_name: row?.full_name || (localPrefs.full_name as string) || metadataName,
            photo_url: effectivePhoto,
            phone: row?.phone || (metadata.phone as string) || (localPrefs.phone as string) || null,
            date_of_birth: row?.date_of_birth || (metadata.date_of_birth as string) || (localPrefs.date_of_birth as string) || null,
            height_cm: row?.height_cm ?? (metadata.height_cm as number) ?? (localPrefs.height_cm as number) ?? null,
            weight_kg: row?.weight_kg ?? (metadata.weight_kg as number) ?? (localPrefs.weight_kg as number) ?? null,
            gender: row?.gender || (metadata.gender as string) || (localPrefs.gender as string) || "Male",
            fitness_goal: (metadata.fitness_goal as string) || (localPrefs.fitness_goal as string) || "Muscle Gain",
            diet_preference: (metadata.diet_preference as string) || (localPrefs.diet_preference as string) || "Vegetarian",
            daily_credits: row?.last_credit_reset === today ? row.daily_credits : MAX_DAILY_CREDITS,
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
            toast.success("Signed out successfully");
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
        const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) => {
            setTimeout(() => reject(new Error('Update timed out after 7 seconds')), 7000);
        });

        const updateOperation = async () => {
            if (!user) {
                return { success: false, error: 'Not authenticated' };
            }

            // 1. Update Supabase users row (safe update)
            const updatePayload: Record<string, unknown> = {
                updated_at: new Date().toISOString()
            };
            if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
            if (data.phone !== undefined) updatePayload.phone = data.phone;
            if (data.date_of_birth !== undefined) updatePayload.date_of_birth = data.date_of_birth;
            if (data.height_cm !== undefined) updatePayload.height_cm = data.height_cm;
            if (data.weight_kg !== undefined) updatePayload.weight_kg = data.weight_kg;
            if (data.gender !== undefined) updatePayload.gender = data.gender;
            if (data.photo_url !== undefined) updatePayload.photo_url = data.photo_url;

            try {
                await supabase
                    .from('users')
                    .update(updatePayload)
                    .eq('id', user.id);
            } catch (err) {
                console.warn("DB users table partial update note:", err);
            }

            // 2. Update Supabase Auth User Metadata (persists in cloud user record)
            try {
                await supabase.auth.updateUser({
                    data: {
                        full_name: data.full_name ?? user.full_name,
                        phone: data.phone ?? user.phone,
                        date_of_birth: data.date_of_birth ?? user.date_of_birth,
                        height_cm: data.height_cm ?? user.height_cm,
                        weight_kg: data.weight_kg ?? user.weight_kg,
                        gender: data.gender ?? user.gender,
                        fitness_goal: data.fitness_goal ?? user.fitness_goal,
                        diet_preference: data.diet_preference ?? user.diet_preference,
                        photo_url: data.photo_url ?? user.photo_url,
                    }
                });
            } catch (err) {
                console.warn("Auth user metadata update note:", err);
            }

            // 3. Cache in local storage for instant offline loading
            try {
                if (typeof window !== 'undefined') {
                    const cacheKey = `brofit_user_preferences_${user.id}`;
                    const currentCached = localStorage.getItem(cacheKey);
                    const parsed = currentCached ? JSON.parse(currentCached) : {};
                    localStorage.setItem(cacheKey, JSON.stringify({ ...parsed, ...data }));
                }
            } catch {
                // ignore
            }

            // 4. Update React state
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

    const checkCredit = useCallback(async (): Promise<boolean> => {
        if (!user) return false;
        return (user.daily_credits ?? 0) > 0;
    }, [user]);

    const deductCredit = useCallback(async (): Promise<boolean> => {
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
                    credits = MAX_DAILY_CREDITS;
                    await supabase
                        .from('users')
                        .update({ daily_credits: credits, last_credit_reset: today })
                        .eq('id', user.id);
                }

                setUser(prev => prev ? {
                    ...prev,
                    daily_credits: credits,
                    last_credit_reset: today
                } : null);
            }
        } catch (err) {
            console.error("Credit refresh error:", err);
        }
    }, [user]);

    return (
        <UserAuthContext.Provider
            value={{
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
                deductCredit,
                refreshCredits
            }}
        >
            {children}
        </UserAuthContext.Provider>
    );
}

export function useUserAuth() {
    const context = useContext(UserAuthContext);
    if (!context) {
        throw new Error('useUserAuth must be used within a UserAuthProvider');
    }
    return context;
}
