"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, RotateCcw } from "lucide-react";
import { useUserAuth } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import TypingDots from "@/components/ui/animations/TypingDots";
import { Portal } from "@/components/ui/primitives/Portal";
import LiveBeacon from "@/components/ui/primitives/LiveBeacon";
import { AnimatedChat, AnimatedDumbbell, AnimatedFlame, AnimatedSparkles } from "@/components/ui/icons";

type ChatMessage = {
  role: "user" | "model";
  text: string;
  isError?: boolean;
  retryText?: string;
};

const SUGGESTIONS = {
  en: [
    { icon: AnimatedDumbbell, text: "Best workout routine for fat loss?" },
    { icon: AnimatedFlame, text: "Vegetarian high-protein foods?" },
    { icon: AnimatedSparkles, text: "How to build lean muscle mass?" },
  ],
  hi: [
    { icon: AnimatedDumbbell, text: "Muscle badhane ki best exercises?" },
    { icon: AnimatedFlame, text: "Veg protein diet sources kya hain?" },
    { icon: AnimatedSparkles, text: "Fat loss ke liye daily routine?" },
  ],
};

export default function TacticalChatbot() {
  const { isLoggedIn, remainingCredits, refreshCredits, accessToken, setShowLoginModal } =
    useUserAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const scrollRef = useRef<HTMLDivElement>(null);

  const modalProps = useModalDismiss(() => setIsOpen(false), isOpen);

  useEffect(() => {
    const handleNavToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsNavOpen(customEvent.detail?.isOpen ?? false);
    };

    window.addEventListener("brofit-nav-toggle", handleNavToggle);
    return () => window.removeEventListener("brofit-nav-toggle", handleNavToggle);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("brofit_chat_lang");
    if (saved === "en" || saved === "hi") {
      setLanguage(saved);
    }
  }, []);

  const handleLanguageChange = (newLang: "en" | "hi") => {
    setLanguage(newLang);
    localStorage.setItem("brofit_chat_lang", newLang);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      refreshCredits();
    }
  }, [isOpen, isLoggedIn, refreshCredits]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (remainingCredits <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            language === "hi"
              ? "Aapke aaj ke AI credits poore ho gaye hain. Kal subah 5:30 baje dobara milenge!"
              : `You've used all ${MAX_DAILY_CREDITS} daily AI credits. Credits reset at 5:30 AM IST.`,
          isError: true,
        },
      ]);
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
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          context: { language },
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setShowLoginModal(true);
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              text:
                language === "hi"
                  ? "Kripya chat karne ke liye pehle login karein."
                  : "Please sign in to continue chatting with AI.",
              isError: true,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              text:
                data.error ||
                (language === "hi"
                  ? "Maaf kijiye, koi error aa gaya."
                  : "Sorry, I encountered an error. Please try again."),
              isError: true,
              retryText: text,
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text:
              data.response ||
              (language === "hi" ? "Koi jawab prapt nahi hua." : "No response received."),
          },
        ]);
        await refreshCredits();
      }
    } catch (error: unknown) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            language === "hi"
              ? "Server se connect nahi ho paya."
              : "Unable to connect to AI assistant. Please check your internet connection.",
          isError: true,
          retryText: text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Red Circular Chatbot Button (Hidden when hamburger nav is open) */}
      {!isOpen && !isNavOpen && (
        <button
          id="tactical-chatbot-button"
          className="fixed bottom-5 sm:bottom-6 right-5 sm:right-6 z-[120] w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-2xl shadow-accent/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group relative"
          onClick={() => setIsOpen(true)}
          aria-label="Open Brother's Fitness AI Assistant"
          title="Ask BroFit AI Coach"
        >
          <AnimatedChat size={26} className="text-white group-hover:scale-110" />
          <LiveBeacon status="active" size="xs" className="absolute top-1.5 right-1.5 pointer-events-none" />
        </button>
      )}

      {/* Tactical AI Chatbot Modal */}
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-screen z-[200] flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-sm modal-overlay-in">
            <div
              {...modalProps}
              aria-label="Brother's Fitness AI Assistant"
              className="relative w-full max-w-[440px] h-[85dvh] max-h-[640px] my-auto surface-modal rounded-3xl border border-surface-border shadow-2xl flex flex-col overflow-hidden modal-panel-in"
            >
              {/* iOS Header */}
              <div className="p-4 bg-surface-card border-b border-surface-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <AnimatedChat size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-hi">Fitness AI Assistant</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-mid">
                      <LiveBeacon status="active" size="xs" />
                      <span>Brother&apos;s Fitness Coach</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language Toggle */}
                  <div className="flex bg-surface-elevated rounded-full p-0.5 border border-surface-border">
                    <button
                      onClick={() => handleLanguageChange("en")}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        language === "en"
                          ? "bg-accent text-white shadow-xs"
                          : "text-mid hover:text-hi"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleLanguageChange("hi")}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                        language === "hi"
                          ? "bg-accent text-white shadow-xs"
                          : "text-mid hover:text-hi"
                      }`}
                    >
                      HI
                    </button>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full text-mid hover:text-hi hover:bg-surface-elevated transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Daily Credits Tracker Badge */}
                {isLoggedIn && (
                  <div className="p-2.5 rounded-2xl bg-surface-card border border-surface-border text-center space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-mid font-medium">Daily AI Credits</span>
                      <span className="font-bold text-accent">
                        {remainingCredits} / {MAX_DAILY_CREDITS}
                      </span>
                    </div>
                    <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${(remainingCredits / MAX_DAILY_CREDITS) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Initial Welcome Bubble if no messages */}
                {messages.length === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <AnimatedChat size={16} />
                      </div>
                      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-xs p-3.5 text-xs text-hi leading-relaxed shadow-xs space-y-2">
                        <p className="font-semibold text-hi">
                          {language === "hi"
                            ? "Namaste! Main Brother's Fitness ka AI Coach hoon."
                            : "Hello! I am Brother's Fitness AI Coach."}
                        </p>
                        <p className="text-mid">
                          {language === "hi"
                            ? "Aap mujhse workout splits, fat loss, muscle building ya diet se jude sawal pooch sakte hain."
                            : "Ask me anything about workout routines, nutrition, gym batch timings, or strength goals."}
                        </p>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] font-semibold text-mid uppercase tracking-wider pl-1">
                        {language === "hi" ? "Kuch sujhav:" : "Suggested topics:"}
                      </p>
                      <div className="space-y-1.5">
                        {SUGGESTIONS[language].map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(s.text)}
                            className="w-full p-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-surface-border text-left text-xs text-hi flex items-center gap-2 transition-colors cursor-pointer group"
                          >
                            <s.icon className="w-3.5 h-3.5 text-accent shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate">{s.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message List */}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-accent text-white rounded-br-xs shadow-xs"
                          : msg.isError
                          ? "bg-status-danger/10 text-status-danger border border-status-danger/30 rounded-bl-xs"
                          : "bg-surface-card border border-surface-border text-hi rounded-bl-xs shadow-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {msg.retryText && (
                      <button
                        onClick={() => handleSend(msg.retryText!)}
                        className="flex items-center gap-1 text-[11px] text-accent hover:underline mt-1 font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-start">
                    <div className="bg-surface-card border border-surface-border rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input & Bottom Bar */}
              <div className="p-3 bg-surface-card border-t border-surface-border shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="flex items-center gap-2 bg-surface-canvas rounded-full border border-surface-border px-4 py-2 focus-within:border-accent transition-colors"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      language === "hi"
                        ? "Apna sawal yahan likhein..."
                        : "Type your fitness question..."
                    }
                    className="flex-1 bg-transparent text-xs text-hi placeholder:text-low focus:outline-none font-medium"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors shrink-0 shadow-xs"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
