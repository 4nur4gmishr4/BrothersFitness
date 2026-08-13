"use client";

import { useState, useRef, useEffect } from "react";
import { Cpu, X, Dumbbell, Utensils, Zap, Languages } from "lucide-react";
import { useUserAuth } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/components/hooks/useModalDismiss";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import TypingDots from "@/components/animations/TypingDots";
import SendArrow from "@/components/animations/SendArrow";
import DecryptedText from "@/components/react-bits/DecryptedText";
import dynamic from "next/dynamic";

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
    const { isLoggedIn, remainingCredits, refreshCredits, accessToken } = useUserAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<"en" | "hi" | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [sentFlash, setSentFlash] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    // L24: track the flash timer so it can't fire after unmount.
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    }, []);

    // M33: Escape dismisses the chat overlay (matches backdrop click).
    const modalProps = useModalDismiss(() => setIsOpen(false));

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
                    ? "Aapke aaj ke AI credits khatam ho gaye. Kal subah 5:30 baje phir milenge!"
                    : `You've used all ${MAX_DAILY_CREDITS} daily AI credits. Credits reset at 5:30 AM IST!`,
                isError: true
            }]);
            return;
        }

        const userMsg: ChatMessage = { role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken ?? ''}`
                },
                body: JSON.stringify({
                    message: text,
                    context: {
                        source: "floating_chat",
                        language: language || "en",
                        gym_name: "Brother's Fitness"
                    }
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                // Add error message with retry capability
                setMessages((prev) => [...prev, {
                    role: "model",
                    // L22: the hi branch was identical English â€” give both
                    // languages a real fallback.
                    text: data.error || (language === "hi"
                        ? "Connection fail ho gaya."
                        : "Connection failed."),
                    isError: true,
                    retryText: text
                }]);
            } else {
                setMessages((prev) => [...prev, {
                    role: "model",
                    text: data.response || (language === "hi"
                        ? "Koi jawab nahi mila."
                        : "No response received.")
                }]);
                await refreshCredits();
            }
        } catch (error: unknown) {
            console.error("Chat Error:", error);
            const message = error instanceof Error ? error.message : "System offline.";
            setMessages((prev) => [...prev, {
                role: "model",
                text: language === "hi" ? "System offline hai." : `Error: ${message}`,
                isError: true,
                retryText: text
            }]);
        } finally {
            setLoading(false);
            // Flash the send arrow for 700ms after a response
            setSentFlash(true);
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            flashTimerRef.current = setTimeout(() => setSentFlash(false), 700);
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    id="tactical-chatbot-button"
                    className="fixed bottom-6 right-6 z-[105] w-14 h-14 bg-accent text-white border border-accent-hover flex items-center justify-center cursor-pointer hover:bg-accent-hover transition-colors duration-fast"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open BroFit AI chat"
                >
                    <Cpu className="w-6 h-6" />
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 modal-overlay-in"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        {...modalProps}
                        aria-label="BroFit AI chat"
                        className="relative w-full max-w-[420px] h-full max-h-[85vh] sm:max-h-[650px] surface-modal hairline overflow-hidden flex flex-col modal-panel-in"
                    >
                        {/* Header */}
                        <div className="surface-elevated hairline-b p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 surface-canvas hairline">
                                    <Cpu className="w-5 h-5 text-accent" />
                                </div>
                                <span className="heading-section text-sm text-hi uppercase tracking-widest">
                                    <DecryptedText text="BROFIT AI" speed={40} />
                                </span>
                                {isLoggedIn ? (
                                    <span className="label-text text-xs surface-canvas hairline px-2 py-0.5 text-hi font-bold">
                                        {remainingCredits}/{MAX_DAILY_CREDITS}
                                    </span>
                                ) : (
                                    <span className="label-text text-xs surface-canvas hairline px-2 py-0.5 text-accent font-bold">
                                        Login
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-low hover:text-hi p-1 hover:bg-surface-canvas transition-colors duration-fast"
                                aria-label="Close chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Language Selection Mode */}
                        {!language ? (
                            <div className="flex-1 surface-canvas flex flex-col items-center justify-center p-6 space-y-6 text-center">
                                <Languages className="w-12 h-12 text-accent" />
                                <div>
                                    <h3 className="heading-section text-lg text-hi">Select Language</h3>
                                    <p className="text-low text-xs">Bhasha chunein</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => handleLanguageChange("en")}
                                        className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast group"
                                    >
                                        <span className="block text-xl font-black text-hi group-hover:text-accent">EN</span>
                                        <span className="label-text text-[10px] uppercase tracking-widest text-low group-hover:text-mid">English</span>
                                    </button>
                                    <button
                                        onClick={() => handleLanguageChange("hi")}
                                        className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast group"
                                    >
                                        <span className="block text-xl font-black text-hi group-hover:text-accent">HI</span>
                                        <span className="label-text text-[10px] uppercase tracking-widest text-low group-hover:text-mid">Hindi</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Chat Interface */
                            <>
                                <div
                                    className="flex-1 overflow-y-auto p-4 space-y-4 surface-canvas relative cursor-auto"
                                    ref={scrollRef}
                                >
                                    {messages.length === 0 && (
                                        <div className="absolute inset-0 flex flex-col justify-center items-center p-6 space-y-4 opacity-70 pointer-events-none">
                                            <Cpu className="w-12 h-12 text-faint/20" />
                                            <div className="grid gap-2 w-full pointer-events-auto">
                                                {SUGGESTIONS[language].map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSend(s.text)}
                                                        className="flex items-center gap-3 p-3 surface-card hairline hover:border-accent text-left transition-colors duration-fast"
                                                    >
                                                        <s.icon className="w-4 h-4 text-accent shrink-0" />
                                                        <span className="text-xs font-bold text-mid">{s.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[85%] ${msg.role === "user" ? "" : "space-y-2"}`}>
                                                <div className={`p-3 text-sm ${msg.role === "user"
                                                    ? "bg-accent text-white font-medium"
                                                    : `${msg.isError ? "border-status-danger/30 bg-status-danger/10 text-status-danger" : "surface-elevated hairline"} text-hi`
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                                {msg.isError && msg.retryText && (
                                                    <button
                                                        onClick={() => handleSend(msg.retryText!)}
                                                        className="text-xs text-status-danger hover:text-hi border border-status-danger/30 hover:border-status-danger px-3 py-1 transition-colors duration-fast"
                                                        aria-label="Retry failed message"
                                                    >
                                                        Retry
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="surface-elevated hairline p-3">
                                                <TypingDots active={loading} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                                    className="p-3 hairline-t surface-modal flex gap-2 cursor-auto"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setLanguage(null)}
                                        className="p-2 text-faint hover:text-hi transition-colors duration-fast"
                                        title="Change Language"
                                        aria-label="Change language"
                                    >
                                        <Languages className="w-5 h-5" />
                                    </button>
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={language === "hi" ? "Poochhein..." : "Ask BroFit..."}
                                        className="input-field flex-1"
                                        disabled={isLoggedIn && remainingCredits <= 0}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !input.trim() || (isLoggedIn && remainingCredits <= 0)}
                                        className="bg-accent text-white p-2 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast"
                                        aria-label="Send message"
                                    >
                                        <SendArrow sending={sentFlash} />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

        </>
    );
}

