"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
  texts: string[];
  rotationInterval?: number;
  className?: string;
}

export default function RotatingText({
  texts,
  rotationInterval = 2800,
  className = "",
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(timer);
  }, [texts.length, rotationInterval]);

  return (
    <span className={`inline-block relative overflow-hidden h-[1.3em] align-top ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={texts[index]}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block whitespace-nowrap text-accent font-semibold"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
