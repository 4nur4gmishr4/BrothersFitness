"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedProfileProps {
  className?: string;
  size?: number;
  active?: boolean;
}

export default function AnimatedProfile({
  className,
  size = 20,
  active = false,
}: AnimatedProfileProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("group/icon shrink-0 transition-transform duration-200", className)}
    >
      {/* Outer Kinetic Ring */}
      <circle
        cx="12"
        cy="12"
        r="10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="66"
        strokeDashoffset={active ? "0" : "16"}
        className="opacity-30 group-hover/icon:opacity-100 group-hover/icon:stroke-accent transition-all duration-300"
      />
      {/* Head Avatar */}
      <circle
        cx="12"
        cy="8.5"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        className="group-hover/icon:scale-105 transition-transform duration-200 origin-center"
      />
      {/* Torso Arc */}
      <path
        d="M6 18.5C6 15.5 8.5 13.5 12 13.5C15.5 13.5 18 15.5 18 18.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="group-hover/icon:stroke-accent transition-colors duration-200"
      />
    </svg>
  );
}

export { AnimatedProfile };
