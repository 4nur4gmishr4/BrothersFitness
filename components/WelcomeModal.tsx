"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ShieldCheck } from "lucide-react";

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                    >
                        {/* Header / Accent */}
                        <div className="h-1.5 bg-gym-red" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gym-red/20 rounded-lg">
                                    <ShieldCheck className="w-6 h-6 text-gym-red" />
                                </div>
                                <h2 className="text-xl font-display font-black uppercase tracking-tight text-white">
                                    Access Granted
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <p className="text-gray-300 leading-relaxed font-medium">
                                    Welcome back to <span className="text-white font-bold">BroFit AI</span>.
                                </p>

                                <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex gap-4">
                                    <Zap className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
                                    <p className="text-sm text-gray-400">
                                        Your <span className="text-white font-bold">3 Daily Tactical Credits</span> are now available. You can use them across both the <span className="text-gym-red font-bold underline underline-offset-4">AI Chatbot</span> and <span className="text-gym-red font-bold underline underline-offset-4">Diet Generation</span> services.
                                    </p>
                                </div>

                                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest pt-2">
                                    {"// Credits reset daily at 00:00 IST"}
                                </p>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full mt-8 py-4 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-gym-red hover:text-white transition-all duration-300"
                            >
                                Proceed to Command Center
                            </motion.button>
                        </div>

                        {/* Matrix-like background effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
