"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedDumbbellProps {
  className?: string;
  size?: number;
}

/**
 * Apple Fitness & Google Material (`fitness_center`) standard vector.
 */
export default function AnimatedDumbbell({
  className,
  size = 20,
}: AnimatedDumbbellProps) {
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
        d="M6.5 6.5L17.5 17.5M21 21L20 20M3 3L4 4M18 22L22 18M2 6L6 2M3 10L10 3M14 21L21 14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { AnimatedDumbbell };
