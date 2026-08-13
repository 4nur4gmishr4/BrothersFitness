"use client";

/** req #13 — slider_bounce: range slider thumb that bounces on commit
 *  (mouseup / touchend). Invisible native range handles accessibility
 *  and keyboard; a styled thumb div bounces only on value commit,
 *  not during drag. */

import { useRef, useState } from "react";

export default function SliderThumb({
  value,
  min,
  max,
  onChange,
  label,
  step = 1,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label?: string;
  step?: number;
}) {
  const lastCommitted = useRef(value);
  const [bounceKey, setBounceKey] = useState(0);

  const pct = ((value - min) / (max - min)) * 100;

  const handleCommit = () => {
    if (lastCommitted.current !== value) {
      lastCommitted.current = value;
      setBounceKey((k) => k + 1);
    }
  };

  return (
    <div className="select-none">
      {label && (
        <label className="label-text text-mid block mb-2">{label}</label>
      )}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 surface-elevated hairline" />
        {/* Filled portion */}
        <div
          className="absolute left-0 h-1 bg-accent"
          style={{ width: `${pct}%` }}
        />
        {/* Invisible native range for a11y */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
          aria-label={label}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
        {/* Visible thumb — remount on commit to trigger bounce */}
        <div
          key={bounceKey}
          className={`absolute w-4 h-4 rounded-full bg-accent border-2 border-surface-canvas pointer-events-none ${
            bounceKey > 0 ? "thumb-bounce" : ""
          }`}
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between mt-1 font-mono text-[10px] text-faint">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
