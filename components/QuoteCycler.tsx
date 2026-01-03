"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSound } from "@/components/SoundContext"; // Import hook

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

  const { isEnabled } = useSound(); // Get sound state
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/audio/keytype.mp3");
      audioRef.current.volume = 0.4;
      audioRef.current.loop = true;
    }
  }, []);

  // Control Audio based on isEnabled context
  useEffect(() => {
    if (!audioRef.current) return;

    // Play only if Sound is Enabled AND Not Waiting AND Text is Typing
    if (isEnabled && !isWaiting && text.length > 0) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isWaiting, text, isEnabled]);

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
    <div className="h-[30px] md:h-[40px] flex items-center justify-center overflow-hidden w-full">
      <motion.h3
        className="text-xs md:text-xl font-dot font-bold tracking-[0.15em] text-white uppercase text-center whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="mr-2 text-gym-red">{">"}</span>
        {text}
        <span className="animate-pulse text-gym-red ml-1">_</span>
      </motion.h3>
    </div>
  );
}