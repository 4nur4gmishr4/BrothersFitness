"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover";
  delay?: number;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 15,
  className = "",
  parentClassName = "",
  animateOn = "view",
  delay = 0,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Tracks which characters have been revealed. Kept in a ref so the interval
  // callback always reads the latest set without re-creating scramble (and
  // re-running the effect) on every reveal.
  const revealedRef = useRef<Set<number>>(new Set());

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+";

  const scramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    revealedRef.current = new Set();

    let iteration = 0;
    intervalRef.current = setInterval(() => {
      iteration += 1 / 3;
      const next = new Set(revealedRef.current);
      const updated = text
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          if (next.has(index)) return char;

          if (Math.random() < iteration / maxIterations) {
            next.add(index);
            return char;
          }
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");

      revealedRef.current = next;
      setDisplayText(updated);

      if (iteration >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        revealedRef.current = new Set(Array.from({ length: text.length }, (_, i) => i));
      }
    }, speed);
  }, [text, speed, maxIterations]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (animateOn === "view") {
      timeoutId = setTimeout(() => {
        scramble();
      }, delay);
    }
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, animateOn, delay, speed, maxIterations, scramble]);

  return (
    <span
      className={parentClassName}
      onMouseEnter={animateOn === "hover" ? scramble : undefined}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}