"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { useUserAuth } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import Image from "next/image";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const { signInWithGoogle, isLoggedIn } = useUserAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // C1 fix: move parent setState out of render into an effect.
    // Calling onSuccess/onClose during render triggers React's
    // "Cannot update a component while rendering another" warning
    // and can cause inconsistent UI in strict mode.
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
            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(result.error || "Sign-in failed. Please try again.");
            }
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [signInWithGoogle, onSuccess, onClose]);

    // M33: call unconditionally (hooks order) before the early return.
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
        <div
            {...modalProps}
            aria-label="Sign in"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 modal-overlay-in"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="relative w-full max-w-sm surface-modal hairline overflow-hidden modal-panel-in"
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
                    {/* Logo */}
                    <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                        <Image
                            src="/assets/favicon.png"
                            alt="BroFit"
                            width={48}
                            height={48}
                            className="object-contain"
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-hi mb-2">Welcome to BroFit</h2>
                        <p className="text-mid text-sm">
                            Sign in to access AI features and track your fitness journey
                        </p>
                    </div>

                    {error && (
                        <div className="w-full p-3 bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
                            {error}
                        </div>
                    )}

                    {/* Google Sign-In Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 px-6 hover:bg-surface-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Fetching Profile...</span>
                            </div>
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
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
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
                        By signing in, you agree to our Terms of Service
                    </p>
                </div>
            </div>
        </div>
    );
}
