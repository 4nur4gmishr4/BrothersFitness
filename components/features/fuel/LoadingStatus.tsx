"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Calculating daily energy targets & macros...",
  "Estimating local Lakhnadon food options & pricing...",
  "Formatting bilingual Hindi and English instructions...",
  "Balancing micronutrients and protein sources...",
  "Finalizing your personalized nutrition protocol...",
];

export default function LoadingStatus() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-xs text-mid min-h-[1.5em] font-medium transition-opacity animate-fade-in">
      {MESSAGES[index]}
    </p>
  );
}

export { LoadingStatus };
