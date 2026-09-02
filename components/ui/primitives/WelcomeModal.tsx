"use client";

import { X, Zap, ShieldCheck } from "lucide-react";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { Portal } from "./Portal";

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    const modalProps = useModalDismiss(onClose, isOpen);

    if (!isOpen) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 h-[100dvh] w-full z-[250] flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto overscroll-contain scrollbar-hide bg-black/80 backdrop-blur-sm modal-overlay-in"
                onClick={onClose}
            >
                <div
                    {...modalProps}
                    aria-label="Welcome"
                    className="relative w-full max-w-md my-auto surface-modal border border-surface-border rounded-3xl overflow-hidden modal-panel-in shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Accent stripe */}
                    <div className="h-1 bg-accent" />

                    <button
                        onClick={onClose}
                        aria-label="Close welcome message"
                        className="absolute top-4 right-4 p-2 text-faint hover:text-hi transition-colors rounded-full hover:bg-surface-elevated"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <ShieldCheck className="w-5 h-5 text-accent" />
                            </div>
                            <h2 className="text-xl heading-display text-hi">
                                Welcome to Brother&apos;s Fitness
                            </h2>
                        </div>

                        <div className="space-y-4 text-mid text-sm leading-relaxed">
                            <p>
                                You&apos;ve been credited with:
                            </p>

                            <div className="surface-card rounded-2xl border border-surface-border p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                    <Zap className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <span className="text-2xl font-bold text-hi">5 Credits</span>
                                    <p className="text-xs text-mid">For AI workout and meal generation</p>
                                </div>
                            </div>

                            <p className="text-xs text-faint uppercase tracking-wider pt-2 font-medium">
                                Credits refresh every morning at 5:30 AM
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="btn-primary w-full mt-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                            Continue
                        </button>
                    </div>

                    {/* Subtle dot grid background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }}
                    />
                </div>
            </div>
        </Portal>
    );
}
