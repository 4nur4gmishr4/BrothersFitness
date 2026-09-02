"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Cinematic Easing for vertical curtain reveal
const customEase: [number, number, number, number] = [0.76, 0, 0.24, 1];

export default function SmartPreloaderWrapper() {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Stage 1 (Center column 2) collapses upwards at 120ms
    const t1 = setTimeout(() => setStage(1), 120);
    
    // Stage 2 (Columns 1 & 3) collapse upwards at 220ms
    const t2 = setTimeout(() => setStage(2), 220);
    
    // Stage 3 (Outer columns 0 & 4) collapse upwards at 320ms
    const t3 = setTimeout(() => setStage(3), 320);
    
    // Safely unmount after all curtain columns finish sliding up (320ms + 600ms = 920ms)
    const t4 = setTimeout(() => {
      setIsVisible(false);
    }, 980);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!isVisible) return null;

  const getScaleY = (i: number) => {
    if (i === 2 && stage >= 1) return 0;
    if ((i === 1 || i === 3) && stage >= 2) return 0;
    if ((i === 0 || i === 4) && stage >= 3) return 0;
    return 1;
  };

  return (
    <aside
      aria-hidden="true"
      className="fixed inset-0 z-[99999] flex w-full h-full pointer-events-none select-none overflow-hidden"
    >
      {[0, 1, 2, 3, 4].map((colIndex) => (
        <motion.div
          key={colIndex}
          className="relative flex-1 h-full bg-[#D71921] -mr-[1px] last:mr-0"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: getScaleY(colIndex) }}
          transition={{
            duration: 0.6,
            ease: customEase,
          }}
          style={{ transformOrigin: "top" }}
        />
      ))}
    </aside>
  );
}
