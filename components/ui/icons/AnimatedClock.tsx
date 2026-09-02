"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedClockProps {
  className?: string;
  size?: number;
  ticking?: boolean;
}

export default function AnimatedClock({
  className,
  size = 20,
  ticking = true,
}: AnimatedClockProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("group/clock shrink-0 transition-transform duration-200", className)}
    >
      {/* Clock Dial Rim */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        className="group-hover/clock:stroke-accent transition-colors duration-200"
      />
      {/* Hour Hand */}
      <path
        d="M12 12L12 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Minute Hand with Optional Micro-Rotation */}
      <path
        d="M12 12L15.5 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className={cn(ticking && "animate-clock-tick")}
      />
      {/* Center Pivot Point */}
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

export { AnimatedClock };
