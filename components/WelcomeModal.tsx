"use client";

import { X, Zap, ShieldCheck } from "lucide-react";
import { useModalDismiss } from "@/components/hooks/useModalDismiss";

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    // M33: call unconditionally before the early return.
    const modalProps = useModalDismiss(onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/80 modal-overlay-in"
            />

            <div
                {...modalProps}
                aria-label="Welcome"
                className="relative w-full max-w-md surface-modal hairline overflow-hidden modal-panel-in"
            >
                {/* Accent stripe */}
                <div className="h-1 bg-accent" />

                <button
                    onClick={onClose}
                    aria-label="Close welcome message"
                    className="absolute top-4 right-4 p-2 text-faint hover:text-hi transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-accent/10">
                            <ShieldCheck className="w-6 h-6 text-accent" />
                        </div>
                        <h2 className="text-xl heading-display text-hi">
                            Welcome to BroFit
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-mid leading-relaxed font-medium">
                            Welcome back to <span className="text-hi font-bold">BroFit</span>.
                        </p>

                        <div className="surface-elevated hairline p-4 flex gap-4">
                            <Zap className="w-6 h-6 text-accent shrink-0 mt-1" />
                            <p className="text-sm text-low">
                                Your <span className="text-hi font-bold">3 daily credits</span> are now available. Use them across both the <span className="text-accent font-bold">AI Chatbot</span> and <span className="text-accent font-bold">Diet Generation</span> services.
                            </p>
                        </div>

                        <p className="text-xs text-faint font-mono uppercase tracking-widest pt-2">
                            {"// Credits reset daily at 5:30 AM IST"}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="btn-primary w-full mt-8 py-4 text-xs"
                    >
                        Get Started
                    </button>
                </div>

                {/* Subtle dot grid background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }}
                />
            </div>
        </div>
    );
}
