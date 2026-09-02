"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { useUserAuth } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import Image from "next/image";
import { Portal } from "@/components/ui/Portal";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const { signInWithGoogle, isLoggedIn } = useUserAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoggedIn && isOpen) {
            onSuccess?.();
            onClose();
        }
    }, [isLoggedIn, isOpen, onSuccess, onClose]);

    const handleGoogleSignIn = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await signInWithGoogle();
            if (!result.success) {
                setError(result.error || "Sign-in failed. Please try again.");
                setLoading(false);
            }
            // On success, browser will redirect to Google OAuth
        } catch {
            setError("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    }, [signInWithGoogle]);

    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsReady(true), 150);
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        if (isReady) onClose();
    }, [isReady, onClose]);

    const modalProps = useModalDismiss(handleClose);

    if (!isOpen || isLoggedIn) return null;

    return (
        <Portal>
            <div
                {...modalProps}
                aria-label="Sign in"
                className="fixed inset-0 h-[100dvh] w-screen z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain modal-overlay-in"
                onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            >
                <div
                    className="relative w-full max-w-sm my-auto surface-modal border border-surface-border rounded-3xl overflow-hidden modal-panel-in shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-faint hover:text-hi transition-colors p-1 rounded-full hover:bg-surface-elevated z-10"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                        {/* Logo with Black Circle */}
                        <div className="w-20 h-20 rounded-full bg-black border border-white/15 flex items-center justify-center shadow-xl p-3">
                            <Image
                                src="/assets/favicon.png"
                                alt="Brother's Fitness"
                                width={48}
                                height={48}
                                className="object-contain"
                            />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-hi mb-2">Welcome to Brother&apos;s Fitness</h2>
                            <p className="text-mid text-sm">
                                Sign in with your Google account to track workouts, access premium features, and manage your membership.
                            </p>
                        </div>

                        {error && (
                            <div className="w-full p-3 bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700/80 font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>

                        <p className="text-faint text-xs">
                            Safe and secure 1-tap sign in
                        </p>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
