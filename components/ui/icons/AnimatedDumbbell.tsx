"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedDumbbellProps {
  className?: string;
  size?: number;
}

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
      className={cn("group/dumbbell shrink-0 transition-transform duration-200", className)}
    >
      {/* Central Handle */}
      <path
        d="M7 12H17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="group-hover/dumbbell:stroke-accent transition-colors duration-200"
      />
      {/* Left Plates */}
      <rect
        x="5"
        y="7"
        width="2"
        height="10"
        rx="1"
        fill="currentColor"
        className="group-hover/dumbbell:-translate-x-0.5 transition-transform duration-200"
      />
      <rect
        x="2"
        y="9"
        width="2"
        height="6"
        rx="1"
        fill="currentColor"
        className="group-hover/dumbbell:-translate-x-1 transition-transform duration-200 opacity-80"
      />
      {/* Right Plates */}
      <rect
        x="17"
        y="7"
        width="2"
        height="10"
        rx="1"
        fill="currentColor"
        className="group-hover/dumbbell:translate-x-0.5 transition-transform duration-200"
      />
      <rect
        x="20"
        y="9"
        width="2"
        height="6"
        rx="1"
        fill="currentColor"
        className="group-hover/dumbbell:translate-x-1 transition-transform duration-200 opacity-80"
      />
    </svg>
  );
}

export { AnimatedDumbbell };
