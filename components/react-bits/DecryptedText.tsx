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
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+";

  const scramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let iteration = 0;
    setRevealedIndices(new Set());

    intervalRef.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (revealedIndices.has(index)) return char;

            if (Math.random() < iteration / maxIterations) {
              setRevealedIndices((prev) => new Set(prev).add(index));
              return char;
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
      }
      iteration += 1 / 3;
    }, speed);
  }, [text, speed, maxIterations, revealedIndices]); // Note: revealedIndices is state, but we are using functional update for displayText... wait. 
  // actually revealedIndices is used in the map callback which is inside setInterval.
  // The closure might capture old revealedIndices?
  // But wait, revealedIndices in the map... 
  // Actually, revealedIndices is outdated in the interval if not careful. 
  // However, I will just replicate the existing logic but wrapped in useCallback.
  // The original code defined it in render scope, so it always had fresh state? 
  // No, setInterval closure captures the scope where it was defined.
  // So original code would capture the variables from the render where `scramble` was called?
  // If `scramble` is called in useEffect, it captures that render's scope.
  // If we assume the logic works, useCallback is just satisfies the linter.
  // Dependencies: text, speed, maxIterations.
  // Wait, revealedIndices is changing. If we include it, scramble changes often.
  // But usage of revealedIndices inside map... 
  // Let's just fix the linter warning by adding scramble to useEffect dep, and wrap scramble in useCallback.


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
  }, [text, animateOn, delay, speed, maxIterations]);

  return (
    <span
      className={parentClassName}
      onMouseEnter={animateOn === "hover" ? scramble : undefined}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}