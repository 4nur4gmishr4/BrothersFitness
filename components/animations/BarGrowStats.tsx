"use client";

import { useEffect, useState } from "react";
import AnimatedSvgIcon from "../ui/AnimatedSvgIcon";

/** req #3 — bar_grow: animated stat bars that grow to their data
 *  value once on mount. Staggered by 120ms per item. */

interface StatItem {
  label: string;
  value: number;
  max: number;
  display: string;
  rightLabel?: string;
}

export default function BarGrowStats({ items }: { items: StatItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Slight delay to allow CSS transitions to trigger reliably
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4" role="list" aria-label="Statistics">
      {items.map((item, i) => {
        const widthPercent = Math.min(100, (item.value / item.max) * 100);
        return (
          <div key={item.label} role="listitem">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider mb-1.5">
              <span className="text-low">{item.label}</span>
              <span className="text-hi font-bold text-xs">{item.display}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 surface-elevated hairline overflow-hidden relative">
                <div
                  className="h-full bg-accent relative transition-all duration-1000 ease-out"
                  style={{
                    width: mounted ? `${widthPercent}%` : "0%",
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  {/* Sparking Cracker head */}
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full blur-[2px] transition-opacity duration-300 ${mounted ? 'opacity-0' : 'opacity-100'}`}
                    style={{
                      transitionDelay: `${(i * 150) + 900}ms` // Fade out right at the end of the grow transition
                    }}
                  />
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full transition-opacity duration-300 ${mounted ? 'opacity-0' : 'opacity-100'}`}
                    style={{
                      transitionDelay: `${(i * 150) + 900}ms`
                    }}
                  />
                </div>
                {/* SVG Overlay */}
                <AnimatedSvgIcon src="/animatedsvgs/lottie_bar_grow.svg" className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" themeColor="accent" />
              </div>
              {item.rightLabel && (
                <span className="text-low font-bold text-2xl shrink-0 w-6 text-center leading-none flex items-center justify-center">{item.rightLabel}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
