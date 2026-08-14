"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Cinematic Easing from the Framer LoadScreen component
const customEase = [1, 0, 0.56, 1];

export default function SmartPreloaderWrapper() {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Prevent scrolling while preloader is active
    if (typeof window !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    // Exact timings extracted from Framer source code
    // Stage 1 (Center column) delay: 150ms
    const t1 = setTimeout(() => setStage(1), 150);
    
    // Stage 2 (Columns 1 & 3) delay: 100ms after stage 1 (250ms)
    const t2 = setTimeout(() => setStage(2), 250);
    
    // Stage 3 (Columns 0 & 4) delay: 100ms after stage 2 (350ms)
    const t3 = setTimeout(() => setStage(3), 350);
    
    // Total animation ends at 950ms (350ms + 600ms duration). 
    // Unmount safely after animation finishes.
    const t4 = setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  if (!isVisible) return null;

  const getHeight = (i: number) => {
    // Variants cascade outwards from the center
    if (i === 2 && stage >= 1) return "0%";
    if ((i === 1 || i === 3) && stage >= 2) return "0%";
    if ((i === 0 || i === 4) && stage >= 3) return "0%";
    return "100%";
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-start pointer-events-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ height: "100%" }}
          animate={{ height: getHeight(i) }}
          transition={{ duration: 0.6, ease: customEase }}
          className="flex-1 bg-accent border-l border-surface-border/50 first:border-l-0"
        />
      ))}
    </div>
  );
}
