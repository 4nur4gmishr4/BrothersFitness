"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
    deductCredit: (remainingCount?: number) => Promise<boolean>;
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
     * Guaranteed to ALWAYS populate the user even if DB row is delayed or RLS is strict.
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

        const today = istToday();

        // 1. Read cached local preferences if available
        let localPrefs: Record<string, unknown> = {};
        try {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(`brofit_user_preferences_${authId}`);
                if (stored) localPrefs = JSON.parse(stored);
            }
        } catch {
            // ignore
        }

        // 2. Set user immediately with session data + cached local preferences (0ms instant paint)
        const initialUser: UserProfile = {
            id: authId,
            email: session.user.email || null,
            full_name: (localPrefs.full_name as string) || metadataName,
            photo_url: metadataPhoto,
            phone: (metadata.phone as string) || (localPrefs.phone as string) || null,
            date_of_birth: (metadata.date_of_birth as string) || (localPrefs.date_of_birth as string) || null,
            height_cm: typeof metadata.height_cm === 'number' ? metadata.height_cm : (typeof localPrefs.height_cm === 'number' ? localPrefs.height_cm : null),
            weight_kg: typeof metadata.weight_kg === 'number' ? metadata.weight_kg : (typeof localPrefs.weight_kg === 'number' ? localPrefs.weight_kg : null),
            gender: (metadata.gender as string) || (localPrefs.gender as string) || "Male",
            fitness_goal: (metadata.fitness_goal as string) || (localPrefs.fitness_goal as string) || "Muscle Gain",
            diet_preference: (metadata.diet_preference as string) || (localPrefs.diet_preference as string) || "Vegetarian",
            daily_credits: MAX_DAILY_CREDITS,
            last_credit_reset: today,
        };
        setUser(initialUser);
        setIsLoading(false);

        // 3. Asynchronously fetch / create the public `users` database table row
        try {
            const { data: row } = await supabase
                .from('users')
                .select('*')
                .eq('id', authId)
                .single();

            if (row) {
                const rowCredits = typeof row.daily_credits === 'number' ? row.daily_credits : MAX_DAILY_CREDITS;
                const rowReset = row.last_credit_reset || today;
                setUser(prev => prev ? {
                    ...prev,
                    full_name: row.full_name || prev.full_name,
                    photo_url: row.photo_url || prev.photo_url,
                    phone: row.phone || prev.phone,
                    date_of_birth: row.date_of_birth || prev.date_of_birth,
                    height_cm: typeof row.height_cm === 'number' ? row.height_cm : prev.height_cm,
                    weight_kg: typeof row.weight_kg === 'number' ? row.weight_kg : prev.weight_kg,
                    gender: row.gender || prev.gender,
                    daily_credits: rowReset === today ? rowCredits : MAX_DAILY_CREDITS,
                    last_credit_reset: today,
                } : null);
            } else {
                // First-time sign in: create initial user record in background
                const { data: inserted } = await supabase
                    .from('users')
                    .insert({
                        id: authId,
                        email: session.user.email || null,
                        full_name: metadataName,
                        photo_url: metadataPhoto,
                        mobile: (metadata.phone as string) || (localPrefs.phone as string) || '',
                        daily_credits: MAX_DAILY_CREDITS,
                        last_credit_reset: today,
                    })
                    .select('*')
                    .single();

                if (inserted) {
                    setUser(prev => prev ? {
                        ...prev,
                        daily_credits: inserted.daily_credits ?? MAX_DAILY_CREDITS,
                        last_credit_reset: inserted.last_credit_reset ?? today,
                    } : null);
                }
            }
        } catch {
            // non-blocking fallback
        }
    }, []);

    // Listen to Supabase auth state & handle OAuth code callbacks
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                // 1. Check if current URL contains an OAuth code or auth error
                if (typeof window !== 'undefined') {
                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get('code');
                    const authError = urlParams.get('auth_error');

                    if (authError) {
                        toast.error(`Auth Error: ${decodeURIComponent(authError)}`);
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else if (code) {
                        try {
                            const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
                            if (!exchangeErr && exchangeData?.session && isMounted) {
                                await loadUserFromSession(exchangeData.session);
                                toast.success("Signed in with Google successfully!");
                            }
                        } catch (err) {
                            console.warn("Client code exchange notice:", err);
                        } finally {
                            window.history.replaceState({}, document.title, window.location.pathname);
                        }
                    }
                }

                // 2. Fetch existing session from Supabase client
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
            } else if (event === 'SIGNED_OUT' && isMounted) {
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

    const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const redirectUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/`
                : undefined;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    }
                }
            });

            if (error) {
                toast.error(`Login Error: ${error.message}`);
                return { success: false, error: error.message };
            }

            // Explicitly navigate the browser to the returned Google OAuth URL
            if (data?.url && typeof window !== 'undefined') {
                window.location.href = data.url;
            }

            return { success: true };
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to sign in with Google";
            toast.error(msg);
            return { success: false, error: msg };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            setUser(null);
            setAccessToken(null);
            if (typeof window !== 'undefined') {
                Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith('brofit_') || k.startsWith('sb-')) {
                        localStorage.removeItem(k);
                    }
                });
            }
            await supabase.auth.signOut({ scope: 'local' });
            toast.success("Signed out successfully");
        } catch (error) {
            console.error('Logout error:', error);
            setUser(null);
            setAccessToken(null);
            toast.success("Signed out successfully");
        }
    }, []);

    const updateProfile = useCallback(async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
        let timeoutId: NodeJS.Timeout | ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Update timed out after 7 seconds')), 7000);
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
            if (data.phone !== undefined) updatePayload.mobile = data.phone;
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
        } finally {
            clearTimeout(timeoutId!);
        }
    }, [user]);

    const checkCredit = useCallback(async (): Promise<boolean> => {
        if (!user) return false;
        return (user.daily_credits ?? 0) > 0;
    }, [user]);

    const deductCredit = useCallback(async (remainingCount?: number): Promise<boolean> => {
        setUser(prev => {
            if (!prev) return null;
            const newCredits = typeof remainingCount === 'number'
                ? Math.max(0, remainingCount)
                : Math.max(0, (prev.daily_credits ?? MAX_DAILY_CREDITS) - 1);
            return { ...prev, daily_credits: newCredits };
        });
        return true;
    }, []);

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

    const contextValue = useMemo(() => ({
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
    }), [
        user,
        accessToken,
        isLoading,
        showWelcome,
        showLoginModal,
        signInWithGoogle,
        logout,
        updateProfile,
        checkCredit,
        deductCredit,
        refreshCredits
    ]);

    return (
        <UserAuthContext.Provider value={contextValue}>
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
