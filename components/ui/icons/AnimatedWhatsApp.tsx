"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedWhatsAppProps {
  className?: string;
  size?: number;
}

export default function AnimatedWhatsApp({
  className,
  size = 20,
}: AnimatedWhatsAppProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("group/wa shrink-0 transition-transform duration-200", className)}
    >
      <path
        d="M17.5 14.4C17.2 14.2 15.7 13.5 15.5 13.4C15.2 13.3 15 13.3 14.8 13.6C14.6 13.9 14 14.6 13.8 14.8C13.6 15 13.5 15 13.2 14.8C12.9 14.7 12 14.4 10.8 13.3C9.9 12.5 9.3 11.6 9.1 11.3C8.9 11 9.1 10.8 9.2 10.7C9.3 10.6 9.5 10.4 9.6 10.2C9.7 10 9.8 9.9 9.9 9.7C10 9.5 10 9.3 9.9 9.2C9.8 9 9.2 7.6 9 7C8.8 6.4 8.5 6.5 8.3 6.5C8.1 6.5 7.9 6.5 7.7 6.5C7.5 6.5 7.2 6.6 6.9 6.9C6.6 7.2 5.9 7.9 5.9 9.3C5.9 10.7 7 12.1 7.1 12.3C7.3 12.5 9.2 15.5 12.2 16.8C12.9 17.1 13.5 17.3 13.9 17.4C14.6 17.6 15.3 17.6 15.8 17.5C16.4 17.4 17.6 16.8 17.8 16.1C18.1 15.4 18.1 14.8 18 14.7C17.9 14.6 17.7 14.5 17.5 14.4Z"
        fill="currentColor"
        className="group-hover/wa:scale-105 origin-center transition-transform duration-200"
      />
      <path
        d="M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 17L2 22L7.2 20.6C8.6 21.5 10.3 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20.2C10.5 20.2 9 19.8 7.7 19L7.4 18.8L4.3 19.6L5.1 16.6L4.9 16.3C4 15 3.5 13.5 3.5 12C3.5 7.3 7.3 3.5 12 3.5C16.7 3.5 20.5 7.3 20.5 12C20.5 16.7 16.7 20.2 12 20.2Z"
        fill="currentColor"
        className="group-hover/wa:opacity-90 transition-opacity duration-200"
      />
    </svg>
  );
}

export { AnimatedWhatsApp };
