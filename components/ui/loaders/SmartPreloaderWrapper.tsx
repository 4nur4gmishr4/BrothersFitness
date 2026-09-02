"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Cinematic Easing from the Framer LoadScreen component
const customEase: [number, number, number, number] = [1, 0, 0.56, 1];

export default function SmartPreloaderWrapper() {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("brofit_preloader_seen");
      return !seen;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("brofit_preloader_seen");
      if (seen) {
        setIsVisible(false);
        return;
      }
      sessionStorage.setItem("brofit_preloader_seen", "1");
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
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
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
    <aside
      aria-hidden="true"
      className="fixed inset-0 z-[99999] flex w-full h-full pointer-events-none select-none bg-transparent"
    >
      {[0, 1, 2, 3, 4].map((colIndex) => (
        <motion.div
          key={colIndex}
          className="relative flex-1 h-full bg-[#D71921]"
          initial={{ height: "100%" }}
          animate={{ height: getHeight(colIndex) }}
          transition={{
            duration: 0.6,
            ease: customEase,
          }}
          style={{ originY: 0 }}
        />
      ))}
    </aside>
  );
}
