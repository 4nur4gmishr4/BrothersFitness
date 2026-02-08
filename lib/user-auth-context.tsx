/**
 * User Authentication Context for BroFit customers
 * Uses Firebase Google Sign-In for authentication
 * Supabase for user profile and daily credits
 */
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
    getFirebaseAuth,
    getGoogleProvider,
    getFirestoreDb,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    type FirebaseUser
} from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getSupabase } from '@/lib/supabase';

export type UserProfile = {
    id: string;
    firebase_uid: string;
    email: string | null;
    full_name: string | null;
    photo_url: string | null;
    date_of_birth: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    gender: string | null;
    daily_credits: number;
    last_credit_reset: string | null;
};

type UserAuthContextType = {
    user: UserProfile | null;
    firebaseUser: FirebaseUser | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    remainingCredits: number;
    showWelcome: boolean;
    setShowWelcome: (show: boolean) => void;
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

import { MAX_DAILY_CREDITS } from '@/lib/config';

const getAuthErrorMessage = (error: unknown): string => {
    const code = typeof error === 'object' && error && 'code' in error
        ? String((error as { code?: string }).code)
        : '';

    if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        console.error(`FirebaseAuth Error: Domain '${domain}' is not authorized.`);
        return `Google Sign-In is not enabled for '${domain}'. Add it in Firebase Console > Authentication > Settings > Authorized domains.`;
    }
    if (code === 'auth/popup-blocked') {
        return 'Popup blocked by the browser. Please allow popups or try again.';
    }
    if (code === 'auth/popup-closed-by-user') {
        return 'Popup closed before completing sign-in.';
    }
    return error instanceof Error ? error.message : 'Sign-in failed';
};

export function UserAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);

    // Listen to Firebase auth state
    useEffect(() => {
        const auth = getFirebaseAuth();

        getRedirectResult(auth).catch((error) => {
            console.error('Google Sign-In redirect error:', error);
        });

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // Persist UID for API headers immediately
                localStorage.setItem('brofit_user_id', fbUser.uid);
                // User is signed in, fetch or create user profile
                await loadUserProfile(fbUser);
            } else {
                localStorage.removeItem('brofit_user_id');
                setUser(null);
                setIsLoading(false); // Only set to false here if no user
            }
        });

        return () => unsubscribe();
    }, []);

    const loadUserProfile = async (fbUser: FirebaseUser) => {
        console.log('Auth Transition: UID detected. Starting profile load...');
        const supabase = getSupabase();
        const db = getFirestoreDb();
        const today = new Date().toISOString().split('T')[0];

        try {
            console.log('Auth Step 1: Querying Supabase...');
            const { data: supabaseUser, error: supabaseError } = await supabase
                .from('users')
                .select('*')
                .eq('firebase_uid', fbUser.uid)
                .single();

            if (!supabaseError && supabaseUser) {
                console.log('Auth Success: Supabase profile found.');
                // Determine if reset is needed
                const updates: Record<string, unknown> = {};

                if (supabaseUser.last_credit_reset !== today) {
                    updates.daily_credits = MAX_DAILY_CREDITS;
                    updates.last_credit_reset = today;
                }

                // Sync basic info if missing
                if (!supabaseUser.photo_url && fbUser.photoURL) updates.photo_url = fbUser.photoURL;
                if (!supabaseUser.email && fbUser.email) updates.email = fbUser.email;
                if (!supabaseUser.full_name && fbUser.displayName) updates.full_name = fbUser.displayName;

                const finalUser = { ...supabaseUser, ...updates };
                console.log('Auth Update: Setting user and clearing loading state.');
                setUser(finalUser as UserProfile);
                setIsLoading(false); // UI is now ready

                // Secondary: Async Background Sync to Firestore & Supabase Updates
                console.log('Auth Sync: Triggering background sync...');
                (async () => {
                    try {
                        if (Object.keys(updates).length > 0) {
                            await supabase.from('users').update(updates).eq('firebase_uid', fbUser.uid);
                        }
                        const { id: _id, ...firestorePayload } = finalUser;
                        await setDoc(doc(db, 'users', fbUser.uid), {
                            ...firestorePayload,
                            updated_at: serverTimestamp()
                        }, { merge: true });
                    } catch (fsError) {
                        console.log('Background sync skipped/failed:', fsError);
                    }
                })();

                return; // Exit early
            }

            // 2. Fallback: Try Firestore if Supabase fails or user not found
            console.log('Auth Fallback: Checking Firestore...');
            let firestoreUser: Record<string, unknown> | null = null;
            try {
                const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                if (userDoc.exists()) {
                    console.log('Auth Success: Firestore profile found.');
                    firestoreUser = userDoc.data();
                }
            } catch (fsError) {
                console.log('Initial Firestore fallback failed:', fsError);
            }

            if (firestoreUser) {
                // Map Firestore back to UserProfile structure
                const fsData = firestoreUser as Record<string, unknown>;
                const mappedUser: UserProfile = {
                    id: fbUser.uid,
                    firebase_uid: fbUser.uid,
                    email: (fsData.email as string | null) || fbUser.email,
                    full_name: (fsData.full_name as string | null) || fbUser.displayName,
                    photo_url: (fsData.photo_url as string | null) || fbUser.photoURL,
                    date_of_birth: (fsData.date_of_birth as string | null) || null,
                    height_cm: (fsData.height_cm as number | null) || null,
                    weight_kg: (fsData.weight_kg as number | null) || null,
                    gender: (fsData.gender as string | null) || null,
                    daily_credits: (fsData.daily_credits as number) ?? MAX_DAILY_CREDITS,
                    last_credit_reset: (fsData.last_credit_reset as string | null) || today
                };

                // Apply reset logic to fallback
                if (mappedUser.last_credit_reset !== today) {
                    mappedUser.daily_credits = MAX_DAILY_CREDITS;
                    mappedUser.last_credit_reset = today;
                }

                setUser(mappedUser);
                setIsLoading(false);

                // Background: Create in Supabase since it was missing
                (async () => {
                    try {
                        await supabase.from('users').insert({
                            ...mappedUser,
                            mobile: ""
                        });
                    } catch (sbError) { console.log('Background Supabase creation failed:', sbError); }
                })();
                return;
            }

            // 3. New User: Create in both
            console.log('Auth Flow: No profile found. Initializing new user sequence...');
            const newUserPayload = {
                firebase_uid: fbUser.uid,
                email: fbUser.email || null,
                full_name: fbUser.displayName || null,
                photo_url: fbUser.photoURL || null,
                daily_credits: MAX_DAILY_CREDITS,
                last_credit_reset: today,
                mobile: ""
            };

            console.log('Auth Progress: Creating Supabase record...');
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert(newUserPayload)
                .select()
                .single();

            if (newUser && !insertError) {
                console.log('Auth Success: New Supabase user created.');
                setUser(newUser);
                setShowWelcome(true);
            } else {
                console.warn('Auth Warning: Supabase creation failed, using fallback.');
                // Extreme fallback
                setUser({
                    id: fbUser.uid,
                    ...newUserPayload,
                    date_of_birth: null,
                    height_cm: null,
                    weight_kg: null,
                    gender: null
                });
                setShowWelcome(true);
            }
            setIsLoading(false);

            console.log('Auth Sync: Scheduling Firestore creation...');
            setDoc(doc(db, 'users', fbUser.uid), {
                ...newUserPayload,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            }).catch(() => { });

        } catch (err) {
            console.error('Fatal error loading user profile:', err);
            setUser({
                id: fbUser.uid,
                firebase_uid: fbUser.uid,
                email: fbUser.email,
                full_name: fbUser.displayName,
                photo_url: fbUser.photoURL,
                date_of_birth: null,
                height_cm: null,
                weight_kg: null,
                gender: null,
                daily_credits: MAX_DAILY_CREDITS,
                last_credit_reset: today
            });
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const auth = getFirebaseAuth();
            const provider = getGoogleProvider();

            const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                await signInWithRedirect(auth, provider);
            } else {
                try {
                    await signInWithPopup(auth, provider);
                } catch (error) {
                    const code = typeof error === 'object' && error && 'code' in error
                        ? String((error as { code?: string }).code)
                        : '';
                    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
                        await signInWithRedirect(auth, provider);
                    } else {
                        throw error;
                    }
                }
            }
            return { success: true };
        } catch (error) {
            console.error('Google Sign-In error:', error);
            const errorMessage = getAuthErrorMessage(error);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            const auth = getFirebaseAuth();
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateProfile = async (data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> => {
        console.log('Profile Sync: Update initiated...', data);
        try {
            if (!user) {
                console.warn('Profile Sync: No user in state.');
                return { success: false, error: 'Not authenticated' };
            }

            const supabase = getSupabase();
            const db = getFirestoreDb();
            const uid = user.firebase_uid || user.id;

            if (!uid) {
                console.error('Profile Sync: No UID found for update.');
                return { success: false, error: 'User identifier identification failed' };
            }

            console.log(`Profile Sync: Target UID ${uid}`);

            // 1. Update Supabase
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
                .eq('firebase_uid', uid);

            if (sbError) {
                console.error('Profile Sync: Supabase error:', sbError);
                // We continue to Firestore even if Supabase fails to maintain best-effort sync
            } else {
                console.log('Profile Sync: Supabase update successful.');
            }

            // 2. Update Firestore
            try {
                await updateDoc(doc(db, 'users', uid), {
                    ...data,
                    updated_at: serverTimestamp()
                });
                console.log('Profile Sync: Firestore update successful.');
            } catch (fsError) {
                console.error('Profile Sync: Firestore error:', fsError);
                // If both fail, we return error
                if (sbError) return { success: false, error: 'Database sync failed' };
            }

            // Update local state
            console.log('Profile Sync: Updating local state.');
            setUser(prev => prev ? { ...prev, ...data } : null);

            return { success: true };
        } catch (error) {
            console.error('Profile Sync: Critical error:', error);
            return { success: false, error: 'Update failed' };
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
        if (!user || !firebaseUser) return false;

        try {
            const supabase = getSupabase();
            const db = getFirestoreDb();
            const today = new Date().toISOString().split('T')[0];

            let credits = user.daily_credits;

            if (user.last_credit_reset !== today) {
                credits = MAX_DAILY_CREDITS;
            }

            if (credits <= 0) return false;

            const newCredits = credits - 1;

            // Update Supabase (don't fail if this fails)
            try {
                await supabase
                    .from('users')
                    .update({ daily_credits: newCredits, last_credit_reset: today })
                    .eq('firebase_uid', user.firebase_uid);
            } catch (err) {
                console.error('Supabase credit deduction error:', err);
            }

            // Update Firestore
            try {
                await updateDoc(doc(db, 'users', user.firebase_uid), {
                    daily_credits: newCredits,
                    last_credit_reset: today,
                    updated_at: serverTimestamp()
                });
            } catch (fsError) {
                console.error('Firestore credit deduction error:', fsError);
            }

            // Always update local state
            setUser(prev => prev ? { ...prev, daily_credits: newCredits, last_credit_reset: today } : null);
            return true;
        } catch {
            // Even if DB update fails, allow the credit to be used locally
            const newCredits = Math.max(0, user.daily_credits - 1);
            setUser(prev => prev ? { ...prev, daily_credits: newCredits } : null);
            return true;
        }
    }, [user, firebaseUser]);

    const refreshCredits = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            const supabase = getSupabase();
            const db = getFirestoreDb();
            const today = new Date().toISOString().split('T')[0];

            const { data } = await supabase
                .from('users')
                .select('daily_credits, last_credit_reset')
                .eq('firebase_uid', user.firebase_uid)
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
                    // Update Supabase
                    await supabase
                        .from('users')
                        .update({ daily_credits: credits, last_credit_reset: today })
                        .eq('firebase_uid', user.firebase_uid);

                    // Update Firestore
                    try {
                        await updateDoc(doc(db, 'users', user.firebase_uid), {
                            daily_credits: credits,
                            last_credit_reset: today,
                            updated_at: serverTimestamp()
                        });
                    } catch (fsError) {
                        console.error('Firestore credit reset error:', fsError);
                    }
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
            firebaseUser,
            isLoading,
            isLoggedIn: !!user && !!firebaseUser,
            remainingCredits: user?.daily_credits ?? MAX_DAILY_CREDITS,
            showWelcome,
            setShowWelcome,
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
