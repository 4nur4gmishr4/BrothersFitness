"use client";
import { useEffect, useState } from "react";

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
                />
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
