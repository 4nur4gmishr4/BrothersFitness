"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedShieldProps {
  className?: string;
  size?: number;
}

/**
 * Apple Privacy (`shield.fill`) & Google Security standard vector.
 */
export default function AnimatedShield({
  className,
  size = 20,
}: AnimatedShieldProps) {
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
        d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { AnimatedShield };
