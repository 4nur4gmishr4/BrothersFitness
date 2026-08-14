"use client";
import { useState, useEffect } from "react";

const QUOTES = [
  "PAIN IS TEMPORARY. PRIDE IS FOREVER.",
  "WE DON'T STOP WHEN TIRED. WE STOP WHEN DONE.",
  "NO SHORTCUTS. JUST HEAVY LIFTING.",
  "DISCIPLINE EQUALS FREEDOM. EXECUTE.",
  "YOUR ONLY COMPETITION IS THE MIRROR."
];

export default function QuoteCycler() {
  const [text, setText] = useState("");
  const [loopNum, setLoopNum] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  // Typing Logic
  useEffect(() => {
    const i = loopNum % QUOTES.length;
    const fullText = QUOTES[i];

    if (text === fullText) {
      setIsWaiting(true);
      const timer = setTimeout(() => {
        setText("");
        setLoopNum((prev) => prev + 1);
        setIsWaiting(false);
      }, 5000);
      return () => clearTimeout(timer);
    }

    if (!isWaiting) {
      const timer = setTimeout(() => {
        setText(fullText.substring(0, text.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [text, loopNum, isWaiting]);

  return (
    <div className="surface-card flex items-center justify-center p-8 md:p-12 relative overflow-hidden group">
      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <h2 className="heading-display text-2xl md:text-3xl text-center leading-relaxed relative z-10 text-hi max-w-4xl mx-auto min-h-[80px] md:min-h-[100px] flex items-center justify-center">
        <span>&quot;{text}<span className="animate-pulse text-accent">_</span>&quot;</span>
      </h2>
    </div>
  );
}

