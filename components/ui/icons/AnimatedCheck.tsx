"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedCheckProps {
  className?: string;
  size?: number;
}

export default function AnimatedCheck({
  className,
  size = 20,
}: AnimatedCheckProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("group/check shrink-0 transition-transform duration-200", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        className="group-hover/check:stroke-status-success transition-colors duration-200"
      />
      <path
        d="M8 12.5L10.5 15L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/check:stroke-status-success transition-colors duration-200"
      />
    </svg>
  );
}

export { AnimatedCheck };
