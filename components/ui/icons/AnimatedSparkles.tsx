"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedSparklesProps {
  className?: string;
  size?: number;
}

/**
 * Apple Intelligence (`sparkles`) & Google Gemini standard vector constellation.
 */
export default function AnimatedSparkles({
  className,
  size = 20,
}: AnimatedSparklesProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200 group-hover:scale-105", className)}
    >
      <path
        d="M12 3L9.5 9.5L3 12L9.5 14.5L12 21L14.5 14.5L21 12L14.5 9.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 3V6M3.5 4.5H6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19 18V21M17.5 19.5H20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { AnimatedSparkles };
