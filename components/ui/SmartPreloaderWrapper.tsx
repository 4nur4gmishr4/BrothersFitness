"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
} from "framer-motion";

/* ─── SmartPreloader (Native) ─────────────────────────────────────
 *  Exact replica of the Framer SmartPreloader with BroFit branding.
 *  Colors: overlay #0A0A0A, progress #D71921, counter #FFFFFF
 *  Text:   Brand mark top-left, tagline bottom-left, counter bottom-right
 *  Fully responsive for mobile & desktop.
 * ────────────────────────────────────────────────────────────────── */

// ── Config ──────────────────────────────────────────────────────
const OVERLAY_COLOR = "#0A0A0A";
const PROGRESS_COLOR = "#D71921";
const COUNTER_COLOR = "#FFFFFF";
const DIRECTION: "bottom-to-top" | "top-to-bottom" | "left-to-right" | "right-to-left" = "bottom-to-top";
const START_DELAY_MS = 200;
const TOTAL_REVEAL_MS = 1600;
const FADE_MS = 800;
const COUNTER_PADDING = 40;
const SLOW_STEP_1 = 27;
const SLOW_STEP_2 = 82;

// ── Cubic-bezier evaluator ──────────────────────────────────────
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const sampleCurveX = (t: number) =>
    ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t;
  const sampleCurveY = (t: number) =>
    ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
  return (x: number) => {
    let lo = 0, hi = 1, mid: number;
    for (let i = 0; i < 20; i++) {
      mid = (lo + hi) / 2;
      const sx = sampleCurveX(mid);
      if (Math.abs(sx - x) < 1e-6) return sampleCurveY(mid);
      if (sx < x) lo = mid; else hi = mid;
    }
    return sampleCurveY((lo + hi) / 2);
  };
}

const EASING_FN = cubicBezier(0.83, 0, 0.17, 1);

// ── Slow-warp ───────────────────────────────────────────────────
function createSlowWarp(slowSteps: number[]) {
  const windowPct = 16;
  const slowFactor = 0.12;
  const half = windowPct / 2;
  const N = 200;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const bump = (d: number) => {
    const ad = Math.abs(d);
    if (ad >= half) return 0;
    return 0.5 * (1 + Math.cos((Math.PI * ad) / half));
  };

  const speedAt = (pct: number) => {
    if (pct >= 100) return 1;
    if (!slowSteps.length) return 1;
    let influence = 0;
    for (const s of slowSteps) influence = Math.max(influence, bump(pct - s));
    return 1 - (1 - slowFactor) * clamp01(influence);
  };

  const timeAtPct = new Array(N + 1);
  timeAtPct[0] = 0;
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const p0 = ((i - 1) / N) * 100;
    const p1 = (i / N) * 100;
    const mid = (p0 + p1) / 2;
    const sp = Math.max(1e-4, speedAt(mid));
    acc += (p1 - p0) / sp;
    timeAtPct[i] = acc;
  }
  const total = acc;

  return (tNorm: number) => {
    const t = Math.max(0, Math.min(1, tNorm));
    const target = t * total;
    let lo = 0, hi = N;
    while (lo < hi) {
      const m = Math.floor((lo + hi) / 2);
      if (timeAtPct[m] < target) lo = m + 1;
      else hi = m;
    }
    const i = Math.max(1, lo);
    const t0 = timeAtPct[i - 1];
    const t1 = timeAtPct[i];
    const alpha = t1 > t0 ? (target - t0) / (t1 - t0) : 0;
    return (i - 1 + alpha) / N;
  };
}

const slowWarp = createSlowWarp([SLOW_STEP_1, SLOW_STEP_2]);

// ── Helpers ─────────────────────────────────────────────────────
function getExitTranslate(val: number, dir: string) {
  if (dir === "left-to-right") return `translate3d(${val}%, 0%, 0)`;
  if (dir === "right-to-left") return `translate3d(${-val}%, 0%, 0)`;
  if (dir === "top-to-bottom") return `translate3d(0%, ${val}%, 0)`;
  return `translate3d(0%, ${-val}%, 0)`;
}

function getProgressOrigin(dir: string) {
  if (dir === "left-to-right") return "0% 50%";
  if (dir === "right-to-left") return "100% 50%";
  if (dir === "top-to-bottom") return "50% 0%";
  return "50% 100%";
}

function getExitClipPath(val: number, dir: string) {
  const v = Math.max(0, Math.min(100, val));
  if (dir === "left-to-right") return `inset(0% 0% 0% ${v}%)`;
  if (dir === "right-to-left") return `inset(0% ${v}% 0% 0%)`;
  if (dir === "top-to-bottom") return `inset(${v}% 0% 0% 0%)`;
  return `inset(0% 0% ${v}% 0%)`;
}

// ══════════════════════════════════════════════════════════════════
export default function SmartPreloaderWrapper() {
  const [phase, setPhase] = useState<
    "idle" | "revealing" | "exiting" | "done"
  >("idle");
  const [visible, setVisible] = useState(true);
  const counterRef = useRef<HTMLSpanElement>(null);
  const finalizedRef = useRef(false);
  const counterOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Motion values
  const tNorm = useMotionValue(0);
  const exitMV = useMotionValue(0);

  // Derived
  const revealProgress = useTransform(tNorm, (t) => slowWarp(t));
  const revealPercent = useTransform(revealProgress, (p) => p * 100);
  const exitEasedPct = useTransform(exitMV, (t) => EASING_FN(t) * 100);

  // Overlay slide-out
  const overlayTransform = useTransform(exitEasedPct, (val) => {
    if (phase !== "exiting") return "translate3d(0%, 0%, 0)";
    return getExitTranslate(val, DIRECTION);
  });

  // Counter clip-path during exit
  const counterClipPath = useTransform(exitEasedPct, (val) => {
    if (phase !== "exiting") return "inset(0% 0% 0% 0%)";
    return getExitClipPath(val, DIRECTION);
  });

  // Progress bar scale
  const isHorizontal = DIRECTION === "left-to-right" || DIRECTION === "right-to-left";
  const scaleX = useTransform(revealProgress, (p) => (isHorizontal ? p : 1));
  const scaleY = useTransform(revealProgress, (p) => (isHorizontal ? 1 : p));

  // ── Finalize ──────────────────────────────────────────────────
  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    setPhase("exiting");
    window.setTimeout(() => {
      setPhase("done");
      setVisible(false);
    }, Math.max(0, FADE_MS));
  }, []);

  // ── Start after delay ─────────────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(
      () => setPhase("revealing"),
      Math.max(0, START_DELAY_MS)
    );
    return () => window.clearTimeout(timer);
  }, []);

  // ── Reveal animation ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "revealing") return;
    tNorm.set(0);
    const controls = animate(tNorm, 1, {
      duration: Math.max(0.001, TOTAL_REVEAL_MS / 1000),
      ease: (t: number) => t,
    });
    controls.then(() => {
      if (counterOutTimerRef.current != null) return;
      counterOutTimerRef.current = setTimeout(() => {
        counterOutTimerRef.current = null;
        finalize();
      }, 100);
    });
    return () => controls.stop();
  }, [phase, tNorm, finalize]);

  // ── Exit animation ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "exiting") {
      exitMV.set(0);
      return;
    }
    exitMV.set(0);
    const controls = animate(exitMV, 1, {
      duration: Math.max(0.001, FADE_MS / 1000),
      ease: (t: number) => t,
    });
    return () => controls.stop();
  }, [phase, exitMV]);

  // ── Counter text (direct DOM, synced mode) ────────────────────
  useEffect(() => {
    if (!visible || !counterRef.current) return;
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    const unsub = revealPercent.on("change", (pct) => {
      const isDone = phase === "exiting" || phase === "done";
      const rawPct = isDone ? 100 : clamp(pct);
      const t = rawPct / 100;
      const synced = EASING_FN(t) * 100;
      const syncedClamped = clamp(synced);
      const p = t >= 0.995 ? 100 : Math.floor(syncedClamped);
      if (counterRef.current) counterRef.current.textContent = `${p}%`;
    });
    return () => unsub();
  }, [visible, phase, revealPercent]);

  // ── Scroll-lock ───────────────────────────────────────────────
  useEffect(() => {
    if (!visible || phase === "done") return;
    const el = document.documentElement;
    const prevOverflow = el.style.overflow;
    const prevTouchAction = el.style.touchAction;
    el.style.overflow = "hidden";
    el.style.touchAction = "none";

    const preventDefault = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      const keys = ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
      if (keys.includes(e.code)) e.preventDefault();
    };

    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("keydown", preventKeys, { passive: false });

    return () => {
      el.style.overflow = prevOverflow;
      el.style.touchAction = prevTouchAction;
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [visible, phase]);

  // ── Memoised ──────────────────────────────────────────────────
  const origin = useMemo(() => getProgressOrigin(DIRECTION), []);
  const pad = `${COUNTER_PADDING}px`;
  const padMobile = `${Math.round(COUNTER_PADDING * 0.5)}px`;

  if (!visible || phase === "done") return null;

  const displayPhase = phase;

  return (
    <>
      {/* Responsive styles */}
      <style jsx global>{`
        .preloader-container {
          position: fixed;
          inset: 0;
          z-index: 99999;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* ── Brand mark — top-left ───────────────────────────── */
        .preloader-brand {
          position: absolute;
          top: ${pad};
          left: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .preloader-brand-name {
          color: ${COUNTER_COLOR};
          font-family: var(--font-display), 'Anton', sans-serif;
          font-size: 20px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          line-height: 1;
          white-space: nowrap;
        }
        .preloader-brand-name .accent {
          color: ${PROGRESS_COLOR};
        }
        .preloader-brand-sub {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0.35;
          line-height: 1;
        }

        /* ── Tagline — bottom-left ───────────────────────────── */
        .preloader-tagline {
          position: absolute;
          bottom: ${pad};
          left: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .preloader-tagline-text {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.4;
          line-height: 1.4;
        }
        .preloader-tagline-line {
          width: 32px;
          height: 1px;
          background: ${PROGRESS_COLOR};
          opacity: 0.6;
        }

        /* ── Counter — bottom-right ──────────────────────────── */
        .preloader-counter {
          position: absolute;
          bottom: ${pad};
          right: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .preloader-counter-value {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 56px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1em;
        }

        /* ── Status dot — next to counter ────────────────────── */
        .preloader-status {
          position: absolute;
          bottom: calc(${pad} + 72px);
          right: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .preloader-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${PROGRESS_COLOR};
          animation: preloaderPulse 1.2s ease-in-out infinite;
        }
        .preloader-status-text {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.4;
        }

        @keyframes preloaderPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── Progress line indicator — thin horizontal line ──── */
        .preloader-progress-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          z-index: 5;
          pointer-events: none;
          background: transparent;
        }
        .preloader-progress-line-fill {
          height: 100%;
          background: ${PROGRESS_COLOR};
          transform-origin: 0% 50%;
          will-change: transform;
        }

        /* ── Mobile responsive ───────────────────────────────── */
        @media (max-width: 640px) {
          .preloader-brand {
            top: ${padMobile};
            left: ${padMobile};
            gap: 6px;
          }
          .preloader-brand-name {
            font-size: 16px;
            letter-spacing: 0.1em;
          }
          .preloader-brand-sub {
            font-size: 8px;
            letter-spacing: 0.2em;
          }
          .preloader-tagline {
            bottom: ${padMobile};
            left: ${padMobile};
            max-width: 55%;
          }
          .preloader-tagline-text {
            font-size: 9px;
            letter-spacing: 0.15em;
          }
          .preloader-tagline-line {
            width: 24px;
          }
          .preloader-counter {
            bottom: ${padMobile};
            right: ${padMobile};
          }
          .preloader-counter-value {
            font-size: 36px;
          }
          .preloader-status {
            bottom: calc(${padMobile} + 50px);
            right: ${padMobile};
          }
          .preloader-status-dot {
            width: 5px;
            height: 5px;
          }
          .preloader-status-text {
            font-size: 8px;
          }
        }

        /* ── Tablet ──────────────────────────────────────────── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .preloader-brand-name {
            font-size: 18px;
          }
          .preloader-counter-value {
            font-size: 48px;
          }
        }
      `}</style>

      <div
        className="preloader-container"
        style={{
          pointerEvents: displayPhase === "exiting" ? "none" : "auto",
          touchAction: displayPhase !== "exiting" ? "none" : "auto",
        }}
        aria-label="Preloader"
        aria-hidden="false"
      >
        {/* ── Text layer (clips during exit) ───────────────────── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 3,
            willChange: displayPhase === "exiting" ? "clip-path" : undefined,
            clipPath: counterClipPath,
          }}
        >
          {/* Brand mark — top-left */}
          <div className="preloader-brand">
            <div className="preloader-brand-name">
              BROTHER&apos;S<span className="accent">_</span>FITNESS
            </div>
            <div className="preloader-brand-sub">
              EST. 2024 &bull; PREMIUM GYM
            </div>
          </div>

          {/* Status indicator — above counter */}
          <div className="preloader-status">
            <div className="preloader-status-dot" />
            <div className="preloader-status-text">INITIALIZING</div>
          </div>

          {/* Counter — bottom-right */}
          <div className="preloader-counter">
            <span className="preloader-counter-value" ref={counterRef}>
              0%
            </span>
          </div>

          {/* Tagline — bottom-left */}
          <div className="preloader-tagline">
            <div className="preloader-tagline-line" />
            <div className="preloader-tagline-text">
              PAIN IS TEMPORARY.
              <br />
              PRIDE IS FOREVER.
            </div>
          </div>
        </motion.div>

        {/* ── Overlay panel (slides out on exit) ───────────────── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: OVERLAY_COLOR,
            zIndex: 1,
            willChange: "transform",
            transform: overlayTransform,
          }}
        >
          {/* Progress bar fill — full opacity, no transparency */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: PROGRESS_COLOR,
              willChange: "transform",
              transformOrigin: origin,
              scaleX,
              scaleY,
            }}
          />
        </motion.div>

        {/* ── Thin progress line at bottom (always visible above overlay) */}
        <div className="preloader-progress-line" style={{ zIndex: 6 }}>
          <motion.div
            className="preloader-progress-line-fill"
            style={{
              scaleX: revealProgress,
            }}
          />
        </div>
      </div>
    </>
  );
}
