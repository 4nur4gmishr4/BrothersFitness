"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedChatProps {
  className?: string;
  size?: number;
}

export default function AnimatedChat({
  className,
  size = 20,
}: AnimatedChatProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("group/chat shrink-0 transition-transform duration-200", className)}
    >
      {/* Speech Bubble Contour */}
      <path
        d="M21 11.5C21 16.1944 16.9706 20 12 20C10.3831 20 8.8647 19.597 7.56843 18.8911L3 20L4.25704 16.0374C3.46828 14.7145 3 13.1672 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover/chat:stroke-accent transition-colors duration-200"
      />
      {/* 3 Harmonic Interactive Dots */}
      <circle cx="8" cy="11.5" r="1.25" fill="currentColor" className="group-hover/chat:animate-bounce" />
      <circle cx="12" cy="11.5" r="1.25" fill="currentColor" className="group-hover/chat:animate-bounce [animation-delay:120ms]" />
      <circle cx="16" cy="11.5" r="1.25" fill="currentColor" className="group-hover/chat:animate-bounce [animation-delay:240ms]" />
    </svg>
  );
}

export { AnimatedChat };
