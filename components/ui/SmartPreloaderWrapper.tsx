"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
} from "framer-motion";

/* ─── Brothers Fitness SmartPreloader ─────────────────────────────
 *  Native reimplementation of the Framer SmartPreloader component,
 *  customised for the BroFit brand. No external URL imports needed.
 *
 *  Behaviour:
 *    1. Full-screen dark overlay appears on mount
 *    2. Red progress bar fills bottom→top with a synced % counter
 *    3. On completion the overlay slides out, revealing the page
 *    4. Component unmounts itself from the DOM
 *
 *  Palette:
 *    overlay  → #0A0A0A  (--surface-canvas)
 *    progress → #D71921  (--accent / BroFit red)
 *    counter  → #FFFFFF  (--text-hi)
 * ────────────────────────────────────────────────────────────────── */

// ── Config ──────────────────────────────────────────────────────
const OVERLAY_COLOR = "#0A0A0A";
const PROGRESS_COLOR = "#D71921";
const COUNTER_COLOR = "#FFFFFF";
const BRAND_TEXT = "BROTHER'S_FITNESS";
const START_DELAY_MS = 200;
const REVEAL_MS = 1800;
const EXIT_MS = 900;
const DIRECTION: "bottom-to-top" | "top-to-bottom" | "left-to-right" | "right-to-left" = "bottom-to-top";

// ── Easing (cubic-bezier matching the Framer "cinematic" preset) ─
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  // Simple cubic-bezier evaluator using binary search
  const sampleCurveX = (t: number) => ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t;
  const sampleCurveY = (t: number) => ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
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

// ── Slow-warp: pauses briefly at 27% and 82% for dramatic effect ─
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

const slowWarp = createSlowWarp([27, 82]);

// ── Exit translation helper ─────────────────────────────────────
function exitTranslate(val: number, dir: string) {
  if (dir === "left-to-right") return `translate3d(${val}%, 0%, 0)`;
  if (dir === "right-to-left") return `translate3d(${-val}%, 0%, 0)`;
  if (dir === "top-to-bottom") return `translate3d(0%, ${val}%, 0)`;
  return `translate3d(0%, ${-val}%, 0)`;
}

function progressOrigin(dir: string) {
  if (dir === "left-to-right") return "0% 50%";
  if (dir === "right-to-left") return "100% 50%";
  if (dir === "top-to-bottom") return "50% 0%";
  return "50% 100%";
}

// ══════════════════════════════════════════════════════════════════
export default function SmartPreloaderWrapper() {
  const [phase, setPhase] = useState<"idle" | "revealing" | "exiting" | "done">("idle");
  const [visible, setVisible] = useState(true);
  const counterRef = useRef<HTMLSpanElement>(null);
  const finalizedRef = useRef(false);

  // Motion values
  const tNorm = useMotionValue(0);
  const exitMV = useMotionValue(0);

  // Derived motion values
  const revealProgress = useTransform(tNorm, (t) => slowWarp(t));
  const revealPercent = useTransform(revealProgress, (p) => p * 100);

  const exitEasedPct = useTransform(exitMV, (t) => EASING_FN(t) * 100);

  // Overlay slide-out transform
  const overlayTransform = useTransform(exitEasedPct, (val) => {
    if (phase !== "exiting") return "translate3d(0%, 0%, 0)";
    return exitTranslate(val, DIRECTION);
  });

  // Counter clip-path for exit
  const counterClipPath = useTransform(exitEasedPct, (val) => {
    if (phase !== "exiting") return "inset(0% 0% 0% 0%)";
    const v = Math.max(0, Math.min(100, val));
    if (DIRECTION === "left-to-right") return `inset(0% 0% 0% ${v}%)`;
    if (DIRECTION === "right-to-left") return `inset(0% ${v}% 0% 0%)`;
    if (DIRECTION === "top-to-bottom") return `inset(${v}% 0% 0% 0%)`;
    return `inset(0% 0% ${v}% 0%)`;
  });

  // Progress bar scale
  const isHorizontal = DIRECTION === "left-to-right" || DIRECTION === "right-to-left";
  const scaleX = useTransform(revealProgress, (p) => (isHorizontal ? p : 1));
  const scaleY = useTransform(revealProgress, (p) => (isHorizontal ? 1 : p));

  // ── Finalize: trigger exit animation then unmount ──────────────
  const finalize = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    setPhase("exiting");
    window.setTimeout(() => {
      setPhase("done");
      setVisible(false);
    }, EXIT_MS);
  }, []);

  // ── Kick-off after start delay ────────────────────────────────
  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("revealing"), START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // ── Reveal animation ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "revealing") return;
    tNorm.set(0);
    const controls = animate(tNorm, 1, {
      duration: REVEAL_MS / 1000,
      ease: (t: number) => t, // linear — the slow-warp transform provides the feel
    });
    controls.then(() => {
      window.setTimeout(() => finalize(), 100);
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
      duration: EXIT_MS / 1000,
      ease: (t: number) => t,
    });
    return () => controls.stop();
  }, [phase, exitMV]);

  // ── Counter text updater (direct DOM for perf) ────────────────
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

  // ── Scroll-lock while active ──────────────────────────────────
  useEffect(() => {
    if (!visible || phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible, phase]);

  // ── Memoised styles ───────────────────────────────────────────
  const origin = useMemo(() => progressOrigin(DIRECTION), []);

  if (!visible || phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        overflow: "hidden",
        pointerEvents: phase === "exiting" ? "none" : "auto",
        touchAction: phase === "exiting" ? "auto" : "none",
      }}
      aria-label="Preloader"
      aria-hidden={phase === "done" ? "true" : "false"}
    >
      {/* ── Counter overlay (clips during exit) ───────────────── */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 3,
          clipPath: counterClipPath,
        }}
      >
        {/* Brand text — centered horizontally, slightly above center */}
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              color: COUNTER_COLOR,
              fontFamily: "var(--font-display), Anton, sans-serif",
              fontSize: "clamp(24px, 5vw, 56px)",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              lineHeight: 1,
              opacity: 0.9,
              whiteSpace: "nowrap",
            }}
          >
            {BRAND_TEXT}
          </span>
          <span
            style={{
              color: PROGRESS_COLOR,
              fontFamily: "var(--font-mono), JetBrains Mono, monospace",
              fontSize: "clamp(12px, 2vw, 16px)",
              letterSpacing: "0.25em",
              textTransform: "uppercase" as const,
              opacity: 0.6,
            }}
          >
            PAIN IS TEMPORARY. PRIDE IS FOREVER.
          </span>
        </div>

        {/* Percentage counter — bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "40px",
            color: COUNTER_COLOR,
            fontFamily: "var(--font-mono), JetBrains Mono, monospace",
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: "1em",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <span ref={counterRef}>0%</span>
        </div>
      </motion.div>

      {/* ── Overlay panel (slides out on exit) ────────────────── */}
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
        {/* Progress bar fill */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            background: PROGRESS_COLOR,
            willChange: "transform",
            transformOrigin: origin,
            scaleX,
            scaleY,
            opacity: 0.12,
          }}
        />
      </motion.div>
    </div>
  );
}
