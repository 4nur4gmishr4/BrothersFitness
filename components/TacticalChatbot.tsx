"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, X, Send, Dumbbell, Utensils, Zap, Languages } from "lucide-react";
import { useUserAuth } from "@/lib/user-auth-context";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Lazy load LoginModal to avoid SSR issues
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });

type ChatMessage = {
    role: "user" | "model";
    text: string;
    isError?: boolean;
    retryText?: string;
};

const SUGGESTIONS = {
    en: [
        { icon: Dumbbell, text: "Best muscle building workout?" },
        { icon: Utensils, text: "Indian vegetarian protein?" },
        { icon: Zap, text: "How to reduce belly fat?" },
    ],
    hi: [
        { icon: Dumbbell, text: "Muscle badhane ki exercise?" },
        { icon: Utensils, text: "Veg protein foods kya hain?" },
        { icon: Zap, text: "Pet ki charbi kaise kam karein?" },
    ]
};

export default function TacticalChatbot() {
    const { isLoggedIn, remainingCredits, refreshCredits, showWelcome, setShowWelcome } = useUserAuth();

    // Simplified positioning - Fixed Bottom Right
    // Removing complex drag/storage logic to ensure visibility
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<"en" | "hi" | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Load language from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("brofit_chat_lang");
        if (saved === "en" || saved === "hi") {
            setLanguage(saved);
        }
    }, []);

    // Save language to localStorage when changed
    const handleLanguageChange = (newLang: "en" | "hi") => {
        setLanguage(newLang);
        localStorage.setItem("brofit_chat_lang", newLang);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, language]);

    // Note: fetchRateLimit removed - now using user credits from useUserAuth

    useEffect(() => {
        if (isOpen && isLoggedIn) {
            refreshCredits();
        }
    }, [isOpen, isLoggedIn, refreshCredits]);

    // Welcome Popup for new users
    useEffect(() => {
        if (showWelcome) {
            // Show a temporary message
            setMessages(prev => [...prev, {
                role: "model",
                text: `Welcome to BroFit AI! You have ${MAX_DAILY_CREDITS} FREE AI credits for today. Credits reset daily at midnight.`,
                isError: false
            }]);

            // Clear the flag after handling
            const timer = setTimeout(() => setShowWelcome(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showWelcome, setShowWelcome]);

    // Calculate stroke dash for credit ring
    // 5 credits = 100%, 0 credits = 0%
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const progress = remainingCredits / MAX_DAILY_CREDITS;
    const strokeDashoffset = circumference - (progress * circumference);

    // Google colors for the ring
    const getRingColor = () => {
        if (remainingCredits === MAX_DAILY_CREDITS) return "#0F9D58"; // Green
        if (remainingCredits >= 2) return "#4285F4"; // Blue
        if (remainingCredits === 1) return "#F4B400"; // Yellow
        return "#DB4437"; // Red
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // Check if user is logged in
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        // Check if user has credits
        if (remainingCredits <= 0) {
            setMessages((prev) => [...prev, {
                role: "model",
                text: language === "hi"
                    ? "Aapke aaj ke AI credits khatam ho gaye. Kal phir koshish karein!"
                    : `You've used all ${MAX_DAILY_CREDITS} daily AI credits. Credits reset at midnight!`,
                isError: true
            }]);
            return;
        }

        const userMsg: ChatMessage = { role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const userId = localStorage.getItem('brofit_user_id') || 'unknown';
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-brofit-user-id": userId
                },
                body: JSON.stringify({
                    message: text,
                    context: {
                        source: "floating_chat",
                        language: language || "en",
                        developer: "Anurag Mishra",
                        contact: "+91 91311 79343",
                        owner: "Anurag Mishra",
                        gym_name: "Brother's Fitness"
                    }
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                // Add error message with retry capability
                setMessages((prev) => [...prev, {
                    role: "model",
                    text: data.error || (language === "hi" ? "Sampark toot gaya." : "Connection Severed."),
                    isError: true,
                    retryText: text
                }]);
            } else {
                setMessages((prev) => [...prev, { role: "model", text: data.response || (language === "hi" ? "Sampark toot gaya." : "Connection Severed.") }]);
                // Credit deduction is now handled by backend, but we refresh local state
                await refreshCredits();
            }
        } catch {
            setMessages((prev) => [...prev, {
                role: "model",
                text: language === "hi" ? "System offline hai." : "Error: System Offline.",
                isError: true,
                retryText: text
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Force visibility everywhere for debugging/reliability
    // if (pathname !== "/") return null;

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        id="tactical-chatbot-button"
                        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gym-red rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(215,25,33,0.5)] border-2 border-transparent cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        aria-label="Open BroFit AI chat"
                    >
                        <Cpu className="w-6 h-6 text-white animate-pulse relative z-10" />

                        {/* Google Colored Credit Ring */}
                        {isLoggedIn && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
                                <circle
                                    cx="24"
                                    cy="24"
                                    r={radius}
                                    fill="none"
                                    stroke="#333"
                                    strokeWidth="3"
                                    opacity="0.3"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r={radius}
                                    fill="none"
                                    stroke={getRingColor()}
                                    strokeWidth="3"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-6 right-6 z-[99999] w-[95vw] sm:w-[380px] h-[500px] sm:h-[600px] bg-black border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        {/* Header */}
                        <div className="bg-gym-red p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-white" />
                                <span className="font-black uppercase tracking-widest text-sm text-white">BroFit AI</span>
                                {isLoggedIn ? (
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                                        {remainingCredits}/{MAX_DAILY_CREDITS}
                                    </span>
                                ) : (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                                        Login
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-black transition-colors p-1 rounded-full hover:bg-white/20"
                                aria-label="Close chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Language Selection Mode */}
                        {!language ? (
                            <div className="flex-1 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 text-center">
                                <Languages className="w-12 h-12 text-gym-red" />
                                <div>
                                    <h3 className="text-white font-bold text-lg">Select Language</h3>
                                    <p className="text-gray-400 text-xs">Bhasha chunein</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => handleLanguageChange("en")}
                                        className="bg-white/10 border border-white/20 p-4 rounded-xl hover:bg-gym-red hover:border-gym-red transition-all group"
                                    >
                                        <span className="block text-xl font-black text-white group-hover:text-white">EN</span>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-white/80">English</span>
                                    </button>
                                    <button
                                        onClick={() => handleLanguageChange("hi")}
                                        className="bg-white/10 border border-white/20 p-4 rounded-xl hover:bg-gym-red hover:border-gym-red transition-all group"
                                    >
                                        <span className="block text-xl font-black text-white group-hover:text-white">HI</span>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-white/80">Hindi</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Chat Interface */
                            <>
                                <div
                                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/95 relative cursor-auto"
                                    ref={scrollRef}
                                    onPointerDownCapture={(e) => e.stopPropagation()}
                                >
                                    {messages.length === 0 && (
                                        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 space-y-4 opacity-70 pointer-events-none">
                                            <Cpu className="w-12 h-12 text-white/10" />
                                            <div className="grid gap-2 w-full pointer-events-auto">
                                                {SUGGESTIONS[language].map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSend(s.text)}
                                                        className="flex items-center gap-3 p-3 border border-white/10 hover:bg-white/10 hover:border-gym-red/50 text-left transition-colors rounded-xl backdrop-blur-sm bg-black/50"
                                                    >
                                                        <s.icon className="w-4 h-4 text-gym-red shrink-0" />
                                                        <span className="text-xs font-bold text-gray-200">{s.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[85%] ${msg.role === "user"
                                                ? ""
                                                : "space-y-2"
                                                }`}>
                                                <div className={`p-3 text-sm rounded-2xl shadow-sm ${msg.role === "user"
                                                    ? "bg-gym-red text-white font-medium rounded-tr-none"
                                                    : `${msg.isError ? "bg-red-900/20 border-red-500/30" : "bg-white/10"} text-gray-100 border border-white/10 rounded-tl-none`
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                                {msg.isError && msg.retryText && (
                                                    <button
                                                        onClick={() => handleSend(msg.retryText!)}
                                                        className="text-xs text-gym-red hover:text-white border border-gym-red/30 hover:border-gym-red px-3 py-1 rounded-full transition-colors"
                                                        aria-label="Retry failed message"
                                                    >
                                                        Retry
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                                                <div className="flex gap-1">
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-gym-red rounded-full" />
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gym-red rounded-full" />
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gym-red rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                                    className="p-3 border-t border-white/10 bg-black flex gap-2 cursor-auto"
                                    onPointerDownCapture={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setLanguage(null)}
                                        className="p-2 text-gray-500 hover:text-white transition-colors"
                                        title="Change Language"
                                        aria-label="Change language"
                                    >
                                        <Languages className="w-5 h-5" />
                                    </button>
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={language === "hi" ? "Poochhein..." : "Ask BroFit..."}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gym-red transition-colors placeholder:text-gray-600"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        className="bg-gym-red p-2 rounded-xl text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Send message"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={() => setShowLoginModal(false)}
            />
        </>
    );
}
