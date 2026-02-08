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
        const supabase = getSupabase();
        const db = getFirestoreDb();
        const today = new Date().toISOString().split('T')[0];

        let supabaseUser: UserProfile | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let firestoreUser: any = null;

        try {
            // 1. Try fetching from Supabase
            const { data: existingUser, error: supabaseError } = await supabase
                .from('users')
                .select('*')
                .eq('firebase_uid', fbUser.uid)
                .single();

            if (!supabaseError && existingUser) {
                supabaseUser = existingUser;
            }

            // 2. Try fetching from Firestore (Secondary/Fallback)
            try {
                const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                if (userDoc.exists()) {
                    firestoreUser = userDoc.data();
                }
            } catch (fsError) {
                console.error('Firestore read error:', fsError);
            }

            // 3. Logic for existing user (found in either or both)
            if (supabaseUser || firestoreUser) {
                // Use Supabase as primary, Firestore as fallback for missing fields
                const mergedUser = {
                    ...(firestoreUser || {}),
                    ...(supabaseUser || {}),
                    firebase_uid: fbUser.uid // Ensure UID is correct
                };

                const updates: Record<string, unknown> = {};

                // Check and reset daily credits if needed
                if (mergedUser.last_credit_reset !== today) {
                    updates.daily_credits = MAX_DAILY_CREDITS;
                    updates.last_credit_reset = today;
                } else if (mergedUser.daily_credits > MAX_DAILY_CREDITS) {
                    updates.daily_credits = MAX_DAILY_CREDITS;
                }

                // Sync missing data from Google
                if (!mergedUser.photo_url && fbUser.photoURL) updates.photo_url = fbUser.photoURL;
                if (!mergedUser.email && fbUser.email) updates.email = fbUser.email;
                if (!mergedUser.full_name && fbUser.displayName) updates.full_name = fbUser.displayName;

                const finalUser = { ...mergedUser, ...updates };

                // 4. Synchronize back to both if needed
                if (supabaseUser) {
                    if (Object.keys(updates).length > 0) {
                        await supabase.from('users').update(updates).eq('firebase_uid', fbUser.uid);
                    }
                } else {
                    // Create in Supabase if it was only in Firestore
                    // Filter fields to match Supabase schema
                    const supabasePayload = {
                        firebase_uid: fbUser.uid,
                        email: finalUser.email || null,
                        full_name: finalUser.full_name || null,
                        photo_url: finalUser.photo_url || null,
                        date_of_birth: finalUser.date_of_birth || null,
                        height_cm: finalUser.height_cm || null,
                        weight_kg: finalUser.weight_kg || null,
                        gender: finalUser.gender || null,
                        daily_credits: finalUser.daily_credits ?? MAX_DAILY_CREDITS,
                        last_credit_reset: finalUser.last_credit_reset || today,
                        mobile: finalUser.mobile || ""
                    };
                    await supabase.from('users').insert(supabasePayload);
                }

                // Always sync to Firestore to ensure it's up to date
                try {
                    // Filter out any complex Supabase objects if they exist
                    const { id: _, ...firestorePayload } = finalUser;
                    await setDoc(doc(db, 'users', fbUser.uid), {
                        ...firestorePayload,
                        updated_at: serverTimestamp()
                    }, { merge: true });
                } catch (fsError) {
                    console.error('Firestore sync error:', fsError);
                }

                setUser(finalUser as UserProfile);
            } else {
                // 5. Create new user in both
                const newUserPayload = {
                    firebase_uid: fbUser.uid,
                    email: fbUser.email || null,
                    full_name: fbUser.displayName || null,
                    photo_url: fbUser.photoURL || null,
                    daily_credits: MAX_DAILY_CREDITS,
                    last_credit_reset: today,
                    mobile: ""
                };

                // Create in Supabase
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert(newUserPayload)
                    .select()
                    .single();

                // Create in Firestore
                try {
                    await setDoc(doc(db, 'users', fbUser.uid), {
                        ...newUserPayload,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp()
                    });
                } catch (fsError) {
                    console.error('Firestore creation error:', fsError);
                }

                if (newUser && !insertError) {
                    setUser(newUser);
                    setShowWelcome(true);
                } else {
                    // Minimal fallback
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
            }
        } catch (err) {
            console.error('Error loading user profile:', err);
            // Minimal fallback from Firebase
            setUser({
                id: fbUser.uid, // Use UID as standardized local ID
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
        } finally {
            setIsLoading(false); // Ensure loading state is cleared regardless of success or failure
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
        try {
            if (!user) {
                return { success: false, error: 'Not authenticated' };
            }

            const supabase = getSupabase();
            const db = getFirestoreDb();

            // 1. Update Supabase
            const { error } = await supabase
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
                .eq('firebase_uid', user.firebase_uid);

            if (error) {
                console.error('Supabase profile update error:', error);
            }

            // 2. Update Firestore
            try {
                await updateDoc(doc(db, 'users', user.firebase_uid), {
                    ...data,
                    updated_at: serverTimestamp()
                });
            } catch (fsError) {
                console.error('Firestore profile update error:', fsError);
            }

            // Update local state
            setUser(prev => prev ? { ...prev, ...data } : null);

            return { success: true };
        } catch (error) {
            console.error('Update profile error:', error);
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
