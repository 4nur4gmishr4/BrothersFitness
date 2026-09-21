"use client";

import React, { useEffect, useState } from "react";

// Stagger delays (seconds) matching the cinematic curtain sequence:
// Col 2 (center): 0.12s
// Cols 1 & 3 (mid): 0.22s
// Cols 0 & 4 (outer): 0.32s
const COLUMN_DELAYS = [0.32, 0.22, 0.12, 0.22, 0.32];

export default function SmartPreloaderWrapper() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Total animation: max delay (0.32s) + duration (0.6s) = 0.92s
    // Unmount cleanly at 960ms to free GPU compositor layers and memory
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 960);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes preloaderCurtainUp {
          0% {
            transform: scaleY(1);
          }
          100% {
            transform: scaleY(0);
          }
        }
        .preloader-curtain-col {
          transform-origin: top;
          will-change: transform;
          animation-name: preloaderCurtainUp;
          animation-duration: 0.6s;
          animation-timing-function: cubic-bezier(0.76, 0, 0.24, 1);
          animation-fill-mode: forwards;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .preloader-curtain-col {
            animation-duration: 0.05s !important;
            animation-delay: 0s !important;
          }
        }
      `}</style>
      <aside
        aria-hidden="true"
        className="fixed inset-0 z-[99999] flex w-full h-full pointer-events-none select-none overflow-hidden"
      >
        {[0, 1, 2, 3, 4].map((colIndex) => (
          <div
            key={colIndex}
            className="preloader-curtain-col relative flex-1 h-full bg-[#D71921] -mr-[1px] last:mr-0"
            style={{
              animationDelay: `${COLUMN_DELAYS[colIndex]}s`,
            }}
          />
        ))}
      </aside>
    </>
  );
}

