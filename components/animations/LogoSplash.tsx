/** req #4/#18 — logo_build: brand reveal on first load. Replaces the
 *  old WebM intro. Strokes draw in sequence, then fill fades. */

import { Dumbbell } from "lucide-react";

export default function LogoSplash({ fading = false }: { fading?: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center bg-surface-canvas grid place-items-center ${
        fading ? "animate-fade-out" : ""
      }`}
      aria-label="BroFit loading"
    >
      <svg
        width="160"
        height="180"
        viewBox="0 0 120 140"
        fill="none"
        aria-hidden="true"
      >
        {/* Shield / badge outline */}
        <path
          d="M60 12 108 28v42c0 28-20 48-48 60C32 118 12 98 12 70V28Z"
          stroke="var(--accent-color, #D71921)"
          strokeWidth="2"
          className="stroke-draw"
          style={{ "--dash": "420", animationDuration: "1.2s" } as React.CSSProperties}
        />
        {/* Dumbbell motif inside badge */}
        <g opacity="0.35" stroke="var(--accent-color, #D71921)" strokeWidth="1.5">
          <rect x="34" y="38" width="10" height="6" rx="1" className="logo-fade-in" style={{ animationDelay: "700ms" } as React.CSSProperties} />
          <rect x="76" y="38" width="10" height="6" rx="1" className="logo-fade-in" style={{ animationDelay: "700ms" } as React.CSSProperties} />
          <rect x="48" y="37" width="24" height="8" rx="2" className="logo-fade-in" style={{ animationDelay: "700ms" } as React.CSSProperties} />
        </g>
        {/* BF monogram */}
        <text
          x="60"
          y="72"
          textAnchor="middle"
          fill="var(--accent-color, #D71921)"
          className="logo-fade-in"
          style={{
            fontFamily: "var(--font-display), Anton, Impact, sans-serif",
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            animationDelay: "850ms",
          } as React.CSSProperties}
        >
          BF
        </text>
        {/* Tagline */}
        <text
          x="60"
          y="92"
          textAnchor="middle"
          fill="rgb(var(--text-hi))"
          className="logo-fade-in"
          style={{
            fontFamily: "var(--font-mono), JetBrains Mono, monospace",
            fontSize: 9,
            letterSpacing: "0.28em",
            animationDelay: "1100ms",
          } as React.CSSProperties}
        >
          BROTHERS FITNESS
        </text>
      </svg>

      <p
        className="mt-4 font-mono text-[10px] uppercase tracking-widest text-low logo-fade-in flex items-center gap-2"
        style={{ animationDelay: "1300ms" } as React.CSSProperties}
      >
        <Dumbbell className="w-3 h-3 text-accent" />
        Shut Up &amp; Train
      </p>
    </div>
  );
}
