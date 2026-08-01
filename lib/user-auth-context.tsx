"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, getSupabase } from '@/lib/supabase';

export type UserProfile = {
    id: string;
    firebase_uid?: string;
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
import { MAX_DAILY_CREDITS } from '@/lib/config';

export function UserAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Listen to Supabase auth state
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    setUser({
                        id: session.user.id,
                        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
                        email: session.user.email || null,
                        daily_credits: MAX_DAILY_CREDITS,
                        last_credit_reset: new Date().toISOString().split('T')[0]
                    });
                }
            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user && isMounted) {
                setUser({
                    id: session.user.id,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Member',
                    email: session.user.email || null,
                    daily_credits: MAX_DAILY_CREDITS,
                    last_credit_reset: new Date().toISOString().split('T')[0]
                });
            } else if (isMounted) {
                setUser(null);
            }
            if (isMounted) setIsLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const toastId = toast.loading("Redirecting to Google...", { duration: 5000 });
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`
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
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
        console.log('Profile Sync: Update initiated...', data);

        // Timeout promise
        const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) => {
            setTimeout(() => reject(new Error('Update timed out after 7 seconds')), 7000);
        });

        const updateOperation = async () => {
            if (!user) {
                console.warn('Profile Sync: No user in state.');
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
                console.error('Profile Sync: Supabase error:', sbError);
                return { success: false, error: sbError.message };
            }

            // Update local state
            console.log('Profile Sync: Updating local state.');
            setUser(prev => prev ? { ...prev, ...data } : null);

            return { success: true };
        };

        try {
            return await Promise.race([updateOperation(), timeoutPromise]) as { success: boolean; error?: string };
        } catch (error: unknown) {
            console.error('Profile Sync: Critical error or timeout:', error);
            const message = error instanceof Error ? error.message : 'Update failed';
            return { success: false, error: message };
        }
    };

    // Check if user has enough credits without deducting
    const checkCredit = useCallback(async (): Promise<boolean> => {
        if (!user) return false;

        const today = new Date().toISOString().split('T')[0];
        let credits = user.daily_credits;

        if (user.last_credit_reset !== today) {
            credits = MAX_DAILY_CREDITS;
        }

        return credits > 0;
    }, [user]);

    const useCredit = useCallback(async (): Promise<boolean> => {
        if (!user) return false;

        try {
            const today = new Date().toISOString().split('T')[0];
            let credits = user.daily_credits;

            if (user.last_credit_reset !== today) {
                credits = MAX_DAILY_CREDITS;
            }

            if (credits <= 0) return false;

            const newCredits = credits - 1;

            try {
                await supabase
                    .from('users')
                    .update({ daily_credits: newCredits, last_credit_reset: today })
                    .eq('id', user.id);
            } catch (err) {
                console.error('Supabase credit deduction error:', err);
            }

            setUser(prev => prev ? { ...prev, daily_credits: newCredits, last_credit_reset: today } : null);
            return true;
        } catch {
            const newCredits = Math.max(0, user.daily_credits - 1);
            setUser(prev => prev ? { ...prev, daily_credits: newCredits } : null);
            return true;
        }
    }, [user]);

    const refreshCredits = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            const { data } = await supabase
                .from('users')
                .select('daily_credits, last_credit_reset')
                .eq('id', user.id)
                .single();

            if (data) {
                let credits = data.daily_credits;
                let resetNeeded = false;

                if (data.last_credit_reset !== today) {
                    credits = MAX_DAILY_CREDITS;
                    resetNeeded = true;
                } else if (data.daily_credits > MAX_DAILY_CREDITS) {
                    // Strict Cap for current day
                    credits = MAX_DAILY_CREDITS;
                    resetNeeded = true;
                }

                if (resetNeeded) {
                    await supabase
                        .from('users')
                        .update({ daily_credits: credits, last_credit_reset: today })
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
