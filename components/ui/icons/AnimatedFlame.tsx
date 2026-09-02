"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedFlameProps {
  className?: string;
  size?: number;
}

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
      className={cn("group/flame shrink-0 transition-transform duration-200", className)}
    >
      {/* Outer Flame Curve */}
      <path
        d="M12 2C9.5 6 6 9 6 14C6 17.5 8.7 20.5 12 20.5C15.3 20.5 18 17.5 18 14C18 9 14.5 6 12 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/flame:stroke-accent transition-colors duration-200"
      />
      {/* Inner Emissive Core */}
      <path
        d="M12 11C10.5 13 10 14.5 10 16C10 17.1 10.9 18 12 18C13.1 18 14 17.1 14 16C14 14.5 13.5 13 12 11Z"
        fill="currentColor"
        className="opacity-40 group-hover/flame:opacity-100 group-hover/flame:scale-110 origin-bottom transition-all duration-300 text-accent"
      />
    </svg>
  );
}

export { AnimatedFlame };
