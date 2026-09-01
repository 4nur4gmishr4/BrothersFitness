"use client";

import React from "react";

interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  color?: string;
  speed?: string;
}

export default function StarBorder({
  children,
  className = "",
  color = "rgba(225, 29, 72, 0.8)",
  speed = "5s",
  ...rest
}: StarBorderProps) {
  return (
    <div
      className={`relative inline-block overflow-hidden rounded-xl p-[1.5px] ${className}`}
      {...rest}
    >
      {/* Orbiting Border Glow Top */}
      <div
        className="pointer-events-none absolute -left-[100%] -top-[100%] h-[300%] w-[300%] opacity-70"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 40%)`,
          animation: `star-movement-top ${speed} linear infinite alternate`,
        }}
      />
      {/* Orbiting Border Glow Bottom */}
      <div
        className="pointer-events-none absolute -bottom-[100%] -right-[100%] h-[300%] w-[300%] opacity-70"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 40%)`,
          animation: `star-movement-bottom ${speed} linear infinite alternate`,
        }}
      />
      {/* Inner Content */}
      <div className="relative z-10 w-full h-full rounded-[10px] bg-surface-card overflow-hidden">
        {children}
      </div>
    </div>
  );
}
