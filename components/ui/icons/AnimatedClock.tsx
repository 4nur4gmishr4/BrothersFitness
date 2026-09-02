"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedClockProps {
  className?: string;
  size?: number;
  ticking?: boolean;
}

/**
 * Apple SF Symbols (`clock`) & Google Material (`schedule`) standard vector.
 */
export default function AnimatedClock({
  className,
  size = 20,
}: AnimatedClockProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200 group-hover:scale-105", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 6.5V12L15.75 14.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { AnimatedClock };
