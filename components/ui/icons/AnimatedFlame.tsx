"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedFlameProps {
  className?: string;
  size?: number;
}

/**
 * Apple Activity (`flame.fill`) & Google Fit standard vector.
 */
export default function AnimatedFlame({
  className,
  size = 20,
}: AnimatedFlameProps) {
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
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12C11 10.62 10.5 10 10 9C8.928 6.857 9.776 4.946 12 3C12.5 5.5 14 7.9 16 9.5C18 11.1 19 13 19 15C19 18.866 15.866 22 12 22C8.134 22 5 18.866 5 15C5 13.847 5.433 12.706 6 12C6 12 6.5 14.5 8.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { AnimatedFlame };
