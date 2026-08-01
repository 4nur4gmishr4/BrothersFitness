import { cn } from "@/lib/utils";
import React from "react";

export interface ScalesProps {
  orientation?: "horizontal" | "vertical" | "diagonal";
  size?: number;
  className?: string;
  color?: string;
}

const gradientAngles: Record<NonNullable<ScalesProps["orientation"]>, string> = {
  horizontal: "0deg",
  vertical: "90deg",
  diagonal: "315deg",
};

/**
 * Ruler-like repeating-line pattern used to frame an image or panel.
 * Pattern color/scale are driven by CSS custom properties so the same
 * primitive can be rethemed at the call site without extra markup.
 */
export const Scales = ({
  orientation = "diagonal",
  size = 10,
  className,
  color,
}: ScalesProps) => {
  return (
    <div
      className={cn("absolute inset-0 h-full w-full overflow-hidden", className)}
      style={
        {
          "--scales-size": `${size}px`,
          "--scales-angle": gradientAngles[orientation],
          "--pattern-scales": color ?? "rgba(255, 255, 255, 0.1)",
        } as React.CSSProperties
      }
    >
      <div
        className="h-full w-full bg-[repeating-linear-gradient(var(--scales-angle),var(--pattern-scales)_0,var(--pattern-scales)_1px,transparent_0,transparent_50%)]"
        style={{
          backgroundSize: "var(--scales-size) var(--scales-size)",
        }}
      />
    </div>
  );
};
