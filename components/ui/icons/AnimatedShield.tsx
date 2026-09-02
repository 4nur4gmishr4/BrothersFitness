"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedShieldProps {
  className?: string;
  size?: number;
}

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
      className={cn("group/shield shrink-0 transition-transform duration-200", className)}
    >
      {/* Precision Shield Outline */}
      <path
        d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22.5C16.5 21 20 16.5 20 11.5V5.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/shield:stroke-accent transition-colors duration-200"
      />
      {/* Verified Check Path */}
      <path
        d="M9 12L11 14L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/shield:scale-110 origin-center transition-transform duration-200"
      />
    </svg>
  );
}

export { AnimatedShield };
