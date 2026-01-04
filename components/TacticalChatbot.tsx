"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Cpu, X, Send, Dumbbell, Utensils, Zap, Languages } from "lucide-react";

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
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<"en" | "hi" | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const controls = useDragControls();

    const [position, setPosition] = useState({ bottom: "100px", right: "24px" });
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize position and load from storage safely
    useEffect(() => {
        setIsLoaded(true);
        const isMobile = window.innerWidth < 768;
        const defaultPos = isMobile ? { bottom: "80px", right: "24px" } : { bottom: "100px", right: "24px" };

        try {
            const saved = localStorage.getItem('brofit_chatbot_pos');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate bounds (simple check) to prevent off-screen button
                const botVal = parseInt(parsed.bottom);
                const rightVal = parseInt(parsed.right);

                // If values are unreasonably large (off-screen) or negative, reset
                if (botVal > window.innerHeight - 50 || botVal < 0 || rightVal > window.innerWidth - 50 || rightVal < 0) {
                    setPosition(defaultPos);
                } else {
                    setPosition(parsed);
                }
            } else {
                setPosition(defaultPos);
            }
        } catch {
            setPosition(defaultPos);
        }
    }, []);

    const updatePosition = (info: any) => {
        if (typeof window !== 'undefined') {
            const newPos = {
                bottom: `${Math.max(20, window.innerHeight - info.point.y - 28)}px`,
                right: `${Math.max(20, window.innerWidth - info.point.x - 28)}px`
            };
            setPosition(newPos);
            localStorage.setItem('brofit_chatbot_pos', JSON.stringify(newPos));
        }
    };

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

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = { role: "user", text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    if (!isLoaded) return null; // Prevent hydration mismatch

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        className="fixed z-[9999] w-12 h-12 min-[350px]:w-14 min-[350px]:h-14 bg-gym-red rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(215,25,33,0.5)] border-2 border-white/20"
                        initial={{ scale: 0, opacity: 0, ...position }}
                        animate={{ scale: 1, opacity: 1, ...position }}
                        exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}

                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        drag
                        dragMomentum={false}
                        onDragStart={() => { isDragging.current = true; }}
                        onDragEnd={(_, info) => {
                            setTimeout(() => { isDragging.current = false; }, 100);
                            updatePosition(info);
                        }}
                        onClick={() => { if (!isDragging.current) setIsOpen(true); }}
                        whileDrag={{ scale: 1.2, cursor: "grabbing" }}
                        aria-label="Open BroFit AI chat"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setIsOpen(true);
                            }
                        }}
                    >
                        <Cpu className="w-6 h-6 text-white animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed z-[999] w-[90vw] md:w-[380px] h-[550px] bg-black border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
                        initial={{ opacity: 0, scale: 0.95, bottom: "24px", right: "24px" }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        drag
                        dragListener={false}
                        dragControls={controls}
                        dragMomentum={false}
                    >
                        {/* Header - Drag Handle */}
                        <div
                            className="bg-gym-red p-4 flex justify-between items-center cursor-move touch-none"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <div className="flex items-center gap-2 pointer-events-none">
                                <Cpu className="w-5 h-5 text-white" />
                                <span className="font-black uppercase tracking-widest text-sm text-white">BroFit AI</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
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
        </>
    );
}
