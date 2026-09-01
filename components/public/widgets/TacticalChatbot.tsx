"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Dumbbell, Utensils, Zap, Send, RotateCcw } from "lucide-react";
import { useUserAuth } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import TypingDots from "@/components/ui/animations/TypingDots";

type ChatMessage = {
  role: "user" | "model";
  text: string;
  isError?: boolean;
  retryText?: string;
};

const SUGGESTIONS = {
  en: [
    { icon: Dumbbell, text: "Best workout routine for fat loss?" },
    { icon: Utensils, text: "Vegetarian high-protein foods?" },
    { icon: Zap, text: "How to build lean muscle mass?" },
  ],
  hi: [
    { icon: Dumbbell, text: "Muscle badhane ki best exercises?" },
    { icon: Utensils, text: "Veg protein diet sources kya hain?" },
    { icon: Zap, text: "Fat loss ke liye daily routine?" },
  ],
};

export default function TacticalChatbot() {
  const { isLoggedIn, remainingCredits, refreshCredits, accessToken, setShowLoginModal } =
    useUserAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const scrollRef = useRef<HTMLDivElement>(null);

  const modalProps = useModalDismiss(() => setIsOpen(false));

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
          Authorization: `Bearer ${accessToken ?? ""}`,
        },
        body: JSON.stringify({
          message: text,
          context: {
            source: "floating_chat",
            language: language || "en",
            gym_name: "Brother's Fitness",
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text:
              data.error ||
              (language === "hi"
                ? "Connection mein samasya aayi. Kripya dobara prayas karein."
                : "Unable to complete request. Please try again."),
            isError: true,
            retryText: text,
          },
        ]);
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
      {/* iOS Assistant Floating Pill / Circle */}
      {!isOpen && (
        <button
          id="tactical-chatbot-button"
          className="fixed bottom-6 right-6 z-[105] w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/25 hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={() => setIsOpen(true)}
          aria-label="Open Brother's Fitness AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* iOS Modal View */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop with iOS Blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div
            {...modalProps}
            aria-label="Brother's Fitness AI Assistant"
            className="relative w-full sm:max-w-[420px] h-[85vh] sm:h-[620px] bg-surface-canvas rounded-t-[28px] sm:rounded-[28px] border border-surface-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
          >
            {/* iOS Header */}
            <div className="p-4 bg-surface-card border-b border-surface-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-hi">Fitness AI Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-mid">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                    <span>Brother&apos;s Fitness Coach</span>
                  </div>
                </div>
              </div>

              {/* Header Right: Language Switcher & Close */}
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 bg-surface-soft rounded-lg border border-surface-border text-xs">
                  <button
                    onClick={() => handleLanguageChange("en")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      language === "en"
                        ? "bg-surface-card text-hi shadow-xs"
                        : "text-mid hover:text-hi"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => handleLanguageChange("hi")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      language === "hi"
                        ? "bg-surface-card text-hi shadow-xs"
                        : "text-mid hover:text-hi"
                    }`}
                  >
                    HI
                  </button>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-surface-soft hover:bg-surface-elevated text-mid hover:text-hi flex items-center justify-center transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Credit Info Bar */}
            <div className="px-4 py-1.5 bg-surface-soft/80 border-b border-surface-border flex items-center justify-between text-xs text-mid">
              <span>Daily AI Credits</span>
              {isLoggedIn ? (
                <span className="font-semibold text-hi tabular-nums">
                  {remainingCredits} / {MAX_DAILY_CREDITS} remaining
                </span>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-accent font-semibold hover:underline"
                >
                  Sign in to use
                </button>
              )}
            </div>

            {/* Chat Bubble Stream (iMessage Style) */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-canvas"
              ref={scrollRef}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-end pb-2 space-y-4">
                  <div className="text-center space-y-1.5 my-auto px-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-accent shadow-xs">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-semibold text-hi">
                      {language === "hi" ? "Kaise madad kar sakta hoon?" : "How can I help you today?"}
                    </h4>
                    <p className="text-xs text-mid max-w-xs mx-auto">
                      {language === "hi"
                        ? "Workout plans, diet questions, ya fitness guidance ke baare mein poochiye."
                        : "Ask questions about workout routines, nutrition advice, or gym training."}
                    </p>
                  </div>

                  {/* iOS Prompt Chips */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-mid block">
                      Suggested Questions
                    </span>
                    {SUGGESTIONS[language].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s.text)}
                        className="w-full text-left p-3 rounded-2xl bg-surface-card hover:bg-surface-elevated border border-surface-border transition-all flex items-center gap-3 group text-xs text-hi font-medium shadow-xs"
                      >
                        <s.icon className="w-4 h-4 text-accent shrink-0" />
                        <span className="flex-1 truncate">{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] text-sm px-4 py-2.5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-xs ${
                        m.role === "user"
                          ? "bg-[#007AFF] text-white rounded-br-xs"
                          : m.isError
                          ? "bg-red-500/10 border border-red-500/20 text-red-500 rounded-bl-xs"
                          : "bg-surface-card border border-surface-border text-hi rounded-bl-xs"
                      }`}
                    >
                      {m.text}
                    </div>

                    {m.retryText && (
                      <button
                        onClick={() => handleSend(m.retryText!)}
                        className="mt-1 flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-start">
                  <div className="bg-surface-card border border-surface-border rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* iOS Input Composer Bar */}
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
      )}
    </>
  );
}
