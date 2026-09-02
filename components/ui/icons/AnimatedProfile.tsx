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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "group/icon shrink-0 transition-transform duration-200 group-hover/icon:scale-105 origin-center",
        active && "text-accent",
        className
      )}
      aria-hidden="true"
    >
      {/* Standard Apple / Google Account Silhouette */}
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10Zm0 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-7 11.233A8.002 8.002 0 0 1 12 14c2.89 0 5.372 1.53 6.999 3.233A7.962 7.962 0 0 1 12 20a7.962 7.962 0 0 1-7-2.767Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export { AnimatedProfile };
