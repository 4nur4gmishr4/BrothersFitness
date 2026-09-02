import React from "react";

interface AnimatedSvgIconProps {
  src?: string;
  className?: string;
  alt?: string;
  themeColor?: "default" | "accent" | "text-hi";
}

export default function AnimatedSvgIcon({
  className = "",
  themeColor = "default",
}: AnimatedSvgIconProps) {
  const strokeColor = themeColor === "accent" ? "currentColor" : "currentColor";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-accent" stroke={strokeColor} strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeDasharray="30 10" className="animate-spin" />
      </svg>
    </div>
  );
}
