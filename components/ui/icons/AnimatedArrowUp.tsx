"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedArrowUpProps {
  className?: string;
  size?: number;
}

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
      className={cn("group/arrow shrink-0 transition-transform duration-200", className)}
    >
      <path
        d="M7 17L17 7M17 7H8M17 7V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5 transition-transform duration-200"
      />
    </svg>
  );
}

export { AnimatedArrowUp };
