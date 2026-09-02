"use client";

import React from "react";

export default function PageSpinner({ label = "LOADING" }: { label?: string }) {
  return (
    <div className="min-h-[100svh] bg-surface-canvas flex flex-col items-center justify-center gap-4 text-hi select-none">
      <div className="relative w-12 h-12">
        <svg className="w-full h-full animate-spin text-accent" viewBox="0 0 50 50">
          <circle
            className="opacity-20"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <circle
            className="opacity-90"
            cx="25"
            cy="25"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80"
            strokeDashoffset="60"
            fill="none"
          />
        </svg>
      </div>
      <p className="text-xs uppercase tracking-widest text-mid font-semibold animate-pulse">
        {label}
      </p>
    </div>
  );
}
