"use client";
import React, { useState, useEffect, useRef } from "react";

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

  const scramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let iteration = 0;
    setRevealedIndices(new Set());

    intervalRef.current = setInterval(() => {
      setDisplayText((prevText) =>
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
  };

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
  }, [text, animateOn, delay]);

  return (
    <span 
        className={parentClassName}
        onMouseEnter={animateOn === "hover" ? scramble : undefined}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}