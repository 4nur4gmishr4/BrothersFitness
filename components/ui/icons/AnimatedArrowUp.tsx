"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedArrowUpProps {
  className?: string;
  size?: number;
}

/**
 * Apple (`arrow.up`) & Google Material (`arrow_upward`) standard vector.
 */
export default function AnimatedArrowUp({
  className,
  size = 20,
}: AnimatedArrowUpProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5", className)}
    >
      <path
        d="M12 19V5M12 5L5 12M12 5L19 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { AnimatedArrowUp };
