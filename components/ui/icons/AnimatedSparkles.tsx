"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedSparklesProps {
  className?: string;
  size?: number;
}

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
      className={cn("group/sparkle shrink-0 transition-transform duration-200", className)}
    >
      {/* Primary 4-Point Star */}
      <path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="currentColor"
        className="group-hover/sparkle:scale-110 origin-center transition-transform duration-300"
      />
      {/* Accent Satellite Star */}
      <path
        d="M19 2L20 5L23 6L20 7L19 10L18 7L15 6L18 5L19 2Z"
        fill="currentColor"
        className="opacity-75 group-hover/sparkle:rotate-45 origin-center transition-transform duration-300"
      />
    </svg>
  );
}

export { AnimatedSparkles };
