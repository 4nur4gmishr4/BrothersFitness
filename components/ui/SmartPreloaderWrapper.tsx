"use client";

import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

/* ─── SmartPreloader (Native Audited Implementation) ───────────────
 *  Exact replica of Framer SmartPreloader source code with BroFit styling.
 *  Colors: overlay #0A0A0A, progress #D71921, counter #FFFFFF
 *  All 17 audit items & edge-cases resolved to match original framer source.
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

// Cinematic Easing (Original default preset: 0.16, 1, 0.3, 1)
const EASING_FN = cubicBezier(0.16, 1, 0.3, 1);

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
  const hostRef = useRef<HTMLDivElement>(null);
  const counterTextRef = useRef<HTMLSpanElement>(null);
  const finalizedRef = useRef(false);
  const counterOutTimerRef = useRef<number | null>(null);
  const revealAnimStopRef = useRef<(() => void) | null>(null);
  const exitAnimStopRef = useRef<(() => void) | null>(null);

  const [phase, setPhase] = useState<"idle" | "revealing" | "exiting" | "done">("idle");
  const [isVisible, setIsVisible] = useState(true);

  // Motion values
  const tNormMV = useMotionValue(0);
  const exitMV = useMotionValue(0);

  const overlayVisible = isVisible && phase !== "done";

  // Derived transforms
  const revealProgressMV = useTransform(tNormMV, (t) => slowWarp(t));
  const revealPercentMV = useTransform(revealProgressMV, (p) => p * 100);
  const exitEasedPctMV = useTransform(exitMV, (t) => EASING_FN(t) * 100);

  const overlayTranslateMV = useTransform(exitEasedPctMV, (val) => {
    if (phase !== "exiting") return "translate3d(0%, 0%, 0)";
    return getExitTranslate(val, DIRECTION);
  });

  const counterClipPathMV = useTransform(exitEasedPctMV, (val) => {
    if (phase !== "exiting") return "inset(0% 0% 0% 0%)";
    return getExitClipPath(val, DIRECTION);
  });

  const isHorizontal = DIRECTION === "left-to-right" || DIRECTION === "right-to-left";
  const progressScaleXMV = useTransform(revealProgressMV, (p) => (isHorizontal ? p : 1));
  const progressScaleYMV = useTransform(revealProgressMV, (p) => (isHorizontal ? 1 : p));

  // ── Scroll-lock (Attached scoped to hostRef div per Framer spec) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldLock = overlayVisible && phase !== "done";
    const el = hostRef.current;
    if (shouldLock && el) {
      const preventDefault = (e: Event) => e.preventDefault();
      const preventScrollKeys = (e: KeyboardEvent) => {
        const keys = ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
        if (keys.includes(e.code)) e.preventDefault();
      };
      el.addEventListener("wheel", preventDefault, { passive: false });
      el.addEventListener("touchmove", preventDefault, { passive: false });
      el.addEventListener("keydown", preventScrollKeys, { passive: false });
      return () => {
        el.removeEventListener("wheel", preventDefault);
        el.removeEventListener("touchmove", preventDefault);
        el.removeEventListener("keydown", preventScrollKeys);
      };
    }
  }, [overlayVisible, phase]);

  // ── Finalize function (Wrapped in startTransition) ──────────────
  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    if (typeof window !== "undefined") {
      startTransition(() => setPhase("exiting"));
      window.setTimeout(() => {
        startTransition(() => {
          setPhase("done");
          setIsVisible(false);
        });
      }, Math.max(0, FADE_MS));
    } else {
      startTransition(() => {
        setPhase("done");
        setIsVisible(false);
      });
    }
  }, []);

  // ── Idle reset & Start delay timer ──────────────────────────────
  useEffect(() => {
    if (!isVisible || typeof window === "undefined") return;

    startTransition(() => setPhase("idle"));
    finalizedRef.current = false;
    tNormMV.set(0);
    exitMV.set(0);

    if (counterOutTimerRef.current != null) {
      window.clearTimeout(counterOutTimerRef.current);
      counterOutTimerRef.current = null;
    }
    if (revealAnimStopRef.current) {
      revealAnimStopRef.current();
      revealAnimStopRef.current = null;
    }
    if (exitAnimStopRef.current) {
      exitAnimStopRef.current();
      exitAnimStopRef.current = null;
    }

    const startTimer = window.setTimeout(() => {
      startTransition(() => setPhase("revealing"));
    }, Math.max(0, START_DELAY_MS));

    return () => window.clearTimeout(startTimer);
  }, [isVisible, tNormMV, exitMV]);

  // ── Reveal Animation ───────────────────────────────────────────
  useEffect(() => {
    if (!overlayVisible || phase !== "revealing" || typeof window === "undefined") return;

    if (revealAnimStopRef.current) {
      revealAnimStopRef.current();
      revealAnimStopRef.current = null;
    }

    tNormMV.set(0);
    const controls = animate(tNormMV, 1, {
      duration: Math.max(0.001, TOTAL_REVEAL_MS / 1000),
      ease: (t) => t,
    });

    revealAnimStopRef.current = () => controls.stop();

    controls.finished
      .then(() => {
        if (typeof window === "undefined") return;
        if (counterOutTimerRef.current != null) return;
        counterOutTimerRef.current = window.setTimeout(() => {
          counterOutTimerRef.current = null;
          finalize();
        }, 100);
      })
      .catch(() => {});

    return () => {
      if (revealAnimStopRef.current) {
        revealAnimStopRef.current();
        revealAnimStopRef.current = null;
      }
    };
  }, [finalize, overlayVisible, phase, tNormMV]);

  // ── Exit Animation ─────────────────────────────────────────────
  useEffect(() => {
    if (!overlayVisible || typeof window === "undefined") return;

    if (phase !== "exiting") {
      exitMV.set(0);
      if (exitAnimStopRef.current) {
        exitAnimStopRef.current();
        exitAnimStopRef.current = null;
      }
      return;
    }

    if (exitAnimStopRef.current) {
      exitAnimStopRef.current();
      exitAnimStopRef.current = null;
    }

    exitMV.set(0);
    const controls = animate(exitMV, 1, {
      duration: Math.max(0.001, FADE_MS / 1000),
      ease: (t) => t,
    });

    exitAnimStopRef.current = () => controls.stop();

    return () => {
      if (exitAnimStopRef.current) {
        exitAnimStopRef.current();
        exitAnimStopRef.current = null;
      }
    };
  }, [overlayVisible, phase, exitMV]);

  // ── Counter Text Direct DOM Updater (Synced Easing Mode) ───────
  useEffect(() => {
    if (!overlayVisible || !counterTextRef.current) return;

    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    const unsub = revealPercentMV.on("change", (pct) => {
      const doneNow = phase === "exiting" || phase === "done";
      const rawPct = doneNow ? 100 : clamp(pct);
      const t = rawPct / 100;

      const synced = EASING_FN(t) * 100;
      const syncedClamped = clamp(synced);
      const p = t >= 0.995 ? 100 : Math.floor(syncedClamped);

      if (counterTextRef.current) {
        counterTextRef.current.textContent = `${p}%`;
      }
    });

    return () => unsub();
  }, [overlayVisible, phase, revealPercentMV]);

  // ── Styles & Dimensions ────────────────────────────────────────
  const progressTransformOrigin = useMemo(() => getProgressOrigin(DIRECTION), []);
  const pad = `${COUNTER_PADDING}px`;
  const padMobile = `${Math.round(COUNTER_PADDING * 0.5)}px`;

  if (!isVisible || phase === "done") return null;

  return (
    <>
      {/* App Router Safe CSS Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .brofit-preloader-host {
          position: fixed;
          inset: 0;
          z-index: 99999;
          width: 100%;
          height: 100%;
          min-width: 5px;
          min-height: 5px;
          overflow: hidden;
          touch-action: ${phase === "exiting" ? "auto" : "none"};
          pointer-events: ${phase === "exiting" ? "none" : "auto"};
        }
        .brofit-preloader-brand {
          position: absolute;
          top: ${pad};
          left: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .brofit-preloader-brand-name {
          color: ${COUNTER_COLOR};
          font-family: var(--font-display), 'Anton', sans-serif;
          font-size: 20px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          line-height: 1;
          white-space: nowrap;
        }
        .brofit-preloader-brand-name .accent {
          color: ${PROGRESS_COLOR};
        }
        .brofit-preloader-brand-sub {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0.35;
          line-height: 1;
        }
        .brofit-preloader-tagline {
          position: absolute;
          bottom: ${pad};
          left: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .brofit-preloader-tagline-text {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.4;
          line-height: 1.4;
        }
        .brofit-preloader-tagline-line {
          width: 32px;
          height: 1px;
          background: ${PROGRESS_COLOR};
          opacity: 0.6;
        }
        .brofit-preloader-counter {
          position: absolute;
          bottom: ${pad};
          right: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .brofit-preloader-counter-value {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 56px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1em;
        }
        .brofit-preloader-status {
          position: absolute;
          bottom: calc(${pad} + 72px);
          right: ${pad};
          z-index: 4;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brofit-preloader-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${PROGRESS_COLOR};
          animation: brofitPreloaderPulse 1.2s ease-in-out infinite;
        }
        .brofit-preloader-status-text {
          color: ${COUNTER_COLOR};
          font-family: var(--font-mono), 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.4;
        }

        @keyframes brofitPreloaderPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @media (max-width: 640px) {
          .brofit-preloader-brand {
            top: ${padMobile};
            left: ${padMobile};
            gap: 6px;
          }
          .brofit-preloader-brand-name {
            font-size: 16px;
            letter-spacing: 0.1em;
          }
          .brofit-preloader-brand-sub {
            font-size: 8px;
            letter-spacing: 0.2em;
          }
          .brofit-preloader-tagline {
            bottom: ${padMobile};
            left: ${padMobile};
            max-width: 55%;
          }
          .brofit-preloader-tagline-text {
            font-size: 9px;
            letter-spacing: 0.15em;
          }
          .brofit-preloader-tagline-line {
            width: 24px;
          }
          .brofit-preloader-counter {
            bottom: ${padMobile};
            right: ${padMobile};
          }
          .brofit-preloader-counter-value {
            font-size: 36px;
          }
          .brofit-preloader-status {
            bottom: calc(${padMobile} + 50px);
            right: ${padMobile};
          }
          .brofit-preloader-status-dot {
            width: 5px;
            height: 5px;
          }
          .brofit-preloader-status-text {
            font-size: 8px;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .brofit-preloader-brand-name {
            font-size: 18px;
          }
          .brofit-preloader-counter-value {
            font-size: 48px;
          }
        }
        `
      }} />

      <div
        ref={hostRef}
        className="brofit-preloader-host"
        aria-label="Preloader"
        aria-hidden="false"
      >
        {/* ── Indicator Mask Layer (Clips during exit slide) ──────── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 3,
            willChange: phase === "exiting" ? "clip-path" : undefined,
            clipPath: counterClipPathMV,
          }}
        >
          {/* Brand mark — top-left */}
          <div className="brofit-preloader-brand">
            <div className="brofit-preloader-brand-name">
              BROTHER&apos;S<span className="accent">_</span>FITNESS
            </div>
            <div className="brofit-preloader-brand-sub">
              EST. 2024 &bull; PREMIUM GYM
            </div>
          </div>

          {/* Status indicator — above counter */}
          <div className="brofit-preloader-status">
            <div className="brofit-preloader-status-dot" />
            <div className="brofit-preloader-status-text">INITIALIZING</div>
          </div>

          {/* Counter — bottom-right (No initial text flash) */}
          <div className="brofit-preloader-counter">
            <span className="brofit-preloader-counter-value" ref={counterTextRef} />
          </div>

          {/* Tagline — bottom-left */}
          <div className="brofit-preloader-tagline">
            <div className="brofit-preloader-tagline-line" />
            <div className="brofit-preloader-tagline-text">
              PAIN IS TEMPORARY.
              <br />
              PRIDE IS FOREVER.
            </div>
          </div>
        </motion.div>

        {/* ── Overlay Panel Layer (Slides out on exit) ───────────── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: OVERLAY_COLOR,
            zIndex: 1,
            willChange: "transform",
            transform: overlayTranslateMV,
          }}
        >
          {/* Progress bar fill */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: PROGRESS_COLOR,
              willChange: "transform",
              transformOrigin: progressTransformOrigin,
              scaleX: progressScaleXMV,
              scaleY: progressScaleYMV,
            }}
          />
        </motion.div>
      </div>
    </>
  );
}
