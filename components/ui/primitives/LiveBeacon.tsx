"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface LiveBeaconProps {
  status?: "active" | "success" | "idle" | "alert";
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

const SIZE_MAP = {
  xs: { ring: "w-2.5 h-2.5", core: "w-1.5 h-1.5", text: "text-[10px]" },
  sm: { ring: "w-3.5 h-3.5", core: "w-2 h-2", text: "text-[11px]" },
  md: { ring: "w-4.5 h-4.5", core: "w-2.5 h-2.5", text: "text-xs" },
  lg: { ring: "w-6 h-6", core: "w-3.5 h-3.5", text: "text-sm" },
};

const STATUS_MAP = {
  active: {
    core: "bg-status-success",
    ring: "border-status-success/40 bg-status-success/15",
    wave: "bg-status-success/20",
    text: "text-status-success",
    badge: "border-status-success/30 bg-status-success/10 text-status-success",
  },
  success: {
    core: "bg-[#34C759]",
    ring: "border-[#34C759]/40 bg-[#34C759]/15",
    wave: "bg-[#34C759]/20",
    text: "text-[#34C759]",
    badge: "border-[#34C759]/30 bg-[#34C759]/10 text-[#34C759]",
  },
  idle: {
    core: "bg-mid",
    ring: "border-surface-border bg-surface-elevated",
    wave: "bg-surface-border/40",
    text: "text-mid",
    badge: "border-surface-border bg-surface-soft text-mid",
  },
  alert: {
    core: "bg-accent",
    ring: "border-accent/40 bg-accent/15",
    wave: "bg-accent/20",
    text: "text-accent",
    badge: "border-accent/30 bg-accent/10 text-accent",
  },
};

export default function LiveBeacon({
  status = "active",
  label,
  size = "sm",
  className,
  pulse = true,
}: LiveBeaconProps) {
  const currentSize = SIZE_MAP[size];
  const currentStatus = STATUS_MAP[status];

  const indicator = (
    <span className={cn("relative inline-flex items-center justify-center shrink-0", currentSize.ring)}>
      {/* Outer Harmonic Wave */}
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-beacon-wave pointer-events-none",
            currentStatus.wave
          )}
        />
      )}
      {/* Middle Precision Ring */}
      <span
        className={cn(
          "absolute inset-0.5 rounded-full border shadow-xs transition-colors duration-300",
          currentStatus.ring
        )}
      />
      {/* Center Emissive Core */}
      <span
        className={cn(
          "relative rounded-full shadow-sm transition-transform duration-200",
          currentSize.core,
          currentStatus.core
        )}
      />
    </span>
  );

  if (!label) {
    return <span className={cn("inline-flex items-center", className)}>{indicator}</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border transition-all duration-200 shadow-xs",
        currentStatus.badge,
        currentSize.text,
        className
      )}
    >
      {indicator}
      <span className="truncate tracking-wide">{label}</span>
    </span>
  );
}

export { LiveBeacon };
