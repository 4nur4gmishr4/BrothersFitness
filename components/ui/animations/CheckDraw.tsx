"use client";

import React from "react";

export default function CheckDraw({ size = 24, className = "text-status-success" }: { size?: number; className?: string }) {
  return (
    <svg
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" className="opacity-25" />
      <path d="M7.5 12.5L10.5 15.5L16.5 9.5" />
    </svg>
  );
}
