"use client";

import React from "react";

interface ShinyTextProps {
  text?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export default function ShinyText({
  text,
  children,
  disabled = false,
  speed = 3,
  className = "",
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;
  const content = text || children;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${
        disabled ? "text-hi" : ""
      } ${className}`}
      style={{
        backgroundImage: disabled
          ? "none"
          : "linear-gradient(120deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.6) 35%, #ffffff 50%, rgba(255, 255, 255, 0.6) 65%, rgba(255, 255, 255, 0.6) 100%)",
        backgroundSize: "200% 100%",
        animation: disabled ? "none" : `shine ${animationDuration} linear infinite`,
      }}
    >
      {content}
    </span>
  );
}
