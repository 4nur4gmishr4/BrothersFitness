"use client";

import React from "react";

export default function MealPlate({ active = true, size = 64 }: { active?: boolean; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center ${active ? "opacity-100" : "opacity-50"}`}
    >
      {/* Outer Rotating Kinetic Ring */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full animate-spin [animation-duration:8s]"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="18 12"
          className="text-accent/40"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeDasharray="40 180"
          className="text-accent"
          strokeLinecap="round"
        />
      </svg>

      {/* Inner Plate & Cutlery SVG */}
      <svg
        viewBox="0 0 64 64"
        className="w-3/4 h-3/4 text-accent"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Plate Rim */}
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2.5" className="opacity-90" />
        {/* Inner Plate Dish */}
        <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-60" />
        
        {/* Fork (Left) */}
        <path d="M25 22V32M23 22V27C23 28 25 29 25 29M27 22V27C27 28 25 29 25 29M25 32V42" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        
        {/* Knife (Right) */}
        <path d="M39 22C39 22 41 24 41 29C41 33 39 34 39 34V42M39 22V34" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        
        {/* Healthy Leaf Accent */}
        <path d="M32 26C32 26 34 29 32 32C30 29 32 26 32 26Z" fill="currentColor" className="text-status-success animate-pulse" />
      </svg>
    </div>
  );
}

