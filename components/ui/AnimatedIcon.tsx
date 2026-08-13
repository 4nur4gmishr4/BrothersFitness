/**
 * AnimatedIcon — ClickHouse-style stroke-line SVG registry.
 *
 * Every icon is stroke-only (currentColor), 1.5px, viewBox 0 0 24 24.
 * Color flows from the consumer's text-* class; no hardcoded hex.
 *
 * Animation is opt-in via `animate` prop (default true). The global
 * `@media (prefers-reduced-motion: reduce)` block in globals.css kills
 * all animation at the CSS layer — no JS guard needed.
 *
 * When the user provides real animated SVGs, replace the JSX path data
 * below or swap to <img src="/icons/<name>.svg"> for SMIL-animated files.
 */

"use client";

import { type ReactNode } from "react";

export type IconName =
  /* brand / hero */
  | "barbell"
  | "dumbbell"
  /* homepage */
  | "clock"
  | "sunrise"
  | "sunset"
  | "calendar"
  | "utensils"
  | "calculator"
  | "credit-card"
  | "chat"
  | "shield"
  | "medal"
  /* workouts */
  | "stopwatch"
  | "play"
  | "muscle-chest"
  | "muscle-back"
  | "muscle-shoulders"
  | "muscle-legs"
  | "muscle-biceps"
  | "muscle-triceps"
  | "muscle-abs"
  /* fuel */
  | "plate"
  | "protein"
  | "carb"
  | "fat"
  | "water-drop"
  | "refresh"
  /* calculators */
  | "flame"
  | "scale"
  /* pricing */
  | "check"
  | "star"
  | "x-cross"
  /* quotes */
  | "quote"
  /* admin */
  | "users"
  | "trending-up"
  | "calendar-alert"
  | "inbox"
  | "bell"
  | "cake"
  | "trophy"
  /* UI icons */
  | "sun"
  | "moon"
  | "empty"
  | "success"
  | "error";

interface AnimatedIconProps {
  name: IconName;
  className?: string;
  /** Apply animation class. Default true. */
  animate?: boolean;
  /** Explicit aria-label; if omitted the name is used. */
  label?: string;
  /** Override default 24x24 viewBox (e.g. "0 0 32 32"). */
  viewBox?: string;
  strokeWidth?: number;
}

/* ------------------------------------------------------------------ */
/*  Internal glyph map                                                */
/* ------------------------------------------------------------------ */

type Glyph = { paths: ReactNode; viewBox?: string; animClass?: string };

const GLYPHS: Record<IconName, Glyph> = {
  /* ---- brand / hero ---- */
  barbell: {
    paths: (
      <>
        <path d="M3 12h18" />
        <path d="M6 8v8" />
        <path d="M4 10v4" />
        <path d="M18 8v8" />
        <path d="M20 10v4" />
        <path d="M6 12h12" strokeWidth={1} />
      </>
    ),
    animClass: "icon-float",
  },
  dumbbell: {
    paths: (
      <>
        <path d="M8 4h8l-2 4h-4l-2-4z" />
        <path d="M12 8v8" />
        <path d="M8 20h8l-2-4h-4l-2 4z" />
      </>
    ),
    animClass: "icon-float",
  },

  /* ---- homepage ---- */
  clock: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 3.5" />
      </>
    ),
  },
  sunrise: {
    paths: (
      <>
        <path d="M4 18h16" />
        <path d="M6 14a6 6 0 0 1 12 0" />
        <path d="M12 10V4" />
        <path d="M5 21l1.5-3" />
        <path d="M19 21l-1.5-3" />
      </>
    ),
  },
  sunset: {
    paths: (
      <>
        <path d="M4 18h16" />
        <path d="M6 14a6 6 0 0 1 12 0" />
        <path d="M12 10v-4" />
        <path d="M4 21h16" opacity={0.4} />
      </>
    ),
  },
  calendar: {
    paths: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M8 13h.01M12 13h.01M16 13h.01" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  utensils: {
    paths: (
      <>
        <path d="M3 2v7a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4V2" />
        <path d="M7 2v20" />
        <path d="M17 2c-1.7 0-3 1.5-3 3.5S15.3 9 17 9c.7 0 1.3-.3 1.8-.7L17 12v10" />
      </>
    ),
  },
  calculator: {
    paths: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M8 6h8" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth={2} strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01" strokeWidth={2} strokeLinecap="round" />
        <path d="M8 18h.01M12 18h.01M16 18h.01" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  "credit-card": {
    paths: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </>
    ),
  },
  chat: {
    paths: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.4 8.4 0 0 1 8 8v.5z" />
      </>
    ),
  },
  shield: {
    paths: (
      <>
        <path d="M12 3l8 4v5c0 4.4-3.2 8.5-8 10-4.8-1.5-8-5.6-8-10V7l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    animClass: "icon-draw",
  },
  medal: {
    paths: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M9.5 12.5L7 21h10l-2.5-8.5" />
        <path d="M12 6v4" />
        <path d="M10 8h4" />
      </>
    ),
  },

  /* ---- workouts ---- */
  stopwatch: {
    paths: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5" />
        <path d="M10 2h4" />
        <path d="M20 5l-1.5 1.5" />
      </>
    ),
  },
  play: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor" strokeWidth={0} />
      </>
    ),
    animClass: "icon-pulse",
  },
  "muscle-chest": {
    paths: (
      <>
        <path d="M6 12c0-3 2-5 4-5s3 2 2 5" />
        <path d="M18 12c0-3-2-5-4-5s-3 2-2 5" />
        <path d="M12 12v9" />
      </>
    ),
  },
  "muscle-back": {
    paths: (
      <>
        <path d="M8 5c-2 3-2 6 0 9l4 4 4-4c2-3 2-6 0-9" />
        <path d="M12 5v13" />
        <path d="M8 10h8" />
      </>
    ),
  },
  "muscle-shoulders": {
    paths: (
      <>
        <path d="M8 10a4 4 0 0 1 8 0" />
        <path d="M12 10v10" />
        <path d="M4 14h4M16 14h4" />
      </>
    ),
  },
  "muscle-legs": {
    paths: (
      <>
        <path d="M10 4h4v5l3 10h-2l-2-7-2 7-2-7-2 7H7l3-10V4z" />
      </>
    ),
  },
  "muscle-biceps": {
    paths: (
      <>
        <path d="M7 18l-2-5c-1-3 1-5 3-5l2 2 2-2c2 0 4 2 3 5l-2 5" />
        <path d="M12 10v8" />
      </>
    ),
  },
  "muscle-triceps": {
    paths: (
      <>
        <path d="M9 4c-1 4-1 6 0 10l3 6" />
        <path d="M15 4c1 4 1 6 0 10l-3 6" />
        <path d="M7 12h10" />
      </>
    ),
  },
  "muscle-abs": {
    paths: (
      <>
        <rect x="8" y="4" width="8" height="16" rx="2" />
        <path d="M12 4v16" />
        <path d="M8 8h8M8 12h8M8 16h8" />
      </>
    ),
  },

  /* ---- fuel ---- */
  plate: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" fill="currentColor" strokeWidth={0} />
      </>
    ),
  },
  protein: {
    paths: (
      <>
        <path d="M4 20l4-8 4 8" />
        <path d="M8 12V6c0-2 2-4 4-4s4 2 4 4v6" />
        <path d="M20 20l-4-8" />
      </>
    ),
  },
  carb: {
    paths: (
      <>
        <path d="M12 2l7 4.5v7L12 18l-7-4.5v-7L12 2z" />
        <path d="M12 10v8" />
      </>
    ),
  },
  fat: {
    paths: (
      <>
        <circle cx="12" cy="12" r="7" />
        <circle cx="10" cy="10" r="3" opacity={0.4} />
        <circle cx="14" cy="13" r="2" opacity={0.6} />
      </>
    ),
  },
  "water-drop": {
    paths: (
      <>
        <path d="M12 2c-4 6-7 9-7 13a7 7 0 0 0 14 0c0-4-3-7-7-13z" />
        <path d="M9 15a3 3 0 0 0 4 2.5" />
      </>
    ),
    animClass: "icon-float",
  },
  refresh: {
    paths: (
      <>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M18 2l3 3.3-3.3 3" />
        <path d="M6 22l-3-3.3L6.3 16" />
      </>
    ),
    animClass: "icon-spin",
  },

  /* ---- calculators ---- */
  flame: {
    paths: (
      <>
        <path d="M12 22c-4 0-7-3-7-7 0-4 3-8 4-10 1 3 2 4 3 4s2-2 3-5c0 0 3 4 3 8 0 0-1 3-3 5 1.5 1 3.5 1.5 5.5 1C17 19.5 14.5 22 12 22z" />
      </>
    ),
    animClass: "icon-pulse",
  },
  scale: {
    paths: (
      <>
        <path d="M12 3v18" />
        <path d="M8 21h8" />
        <path d="M3 7l5 8h0a4 4 0 0 0 6 0h0l5-8" />
        <path d="M3 7h18" />
      </>
    ),
  },

  /* ---- pricing ---- */
  check: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 10" />
      </>
    ),
    animClass: "icon-draw",
  },
  star: {
    paths: (
      <>
        <path d="M12 2l2.9 6.3 6.9.5-5.2 4.5L18 21l-6-3.8L6 21l1.5-7.7L2.3 8.8l6.9-.5L12 2z" />
      </>
    ),
    animClass: "icon-pulse",
  },
  "x-cross": {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </>
    ),
  },

  /* ---- quotes ---- */
  quote: {
    paths: (
      <>
        <path d="M10 8c-2 0-4 1-4 3 0 1.5 1 2.5 3 3l1 5h3l-1-5c2-.5 3-2 3-4 0-2-2-3-4-3z" />
        <path d="M18 8c-2 0-4 1-4 3 0 1.5 1 2.5 3 3l1 5h3l-1-5c2-.5 3-2 3-4 0-2-2-3-4-3z" />
      </>
    ),
  },

  /* ---- admin ---- */
  users: {
    paths: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="17" cy="7" r="2.5" opacity={0.5} />
        <path d="M21 21v-1.5a3 3 0 0 0-2.5-3" opacity={0.5} />
      </>
    ),
  },
  "trending-up": {
    paths: (
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M17 7h4v4" />
      </>
    ),
  },
  "calendar-alert": {
    paths: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M8 3v4M16 3v4" />
        <path d="M12 13v3" />
        <path d="M12 18h.01" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    animClass: "icon-pulse",
  },
  inbox: {
    paths: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 10h8l2 2h2l2-2h8" />
      </>
    ),
  },
  bell: {
    paths: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    animClass: "icon-float",
  },
  cake: {
    paths: (
      <>
        <path d="M4 15h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z" />
        <path d="M4 15c0-4 3-5 5-5 2 0 3 1 3 1s1-1 3-1c2 0 5 1 5 5" />
        <path d="M12 5v4M12 5c-1-1-3-1-3 1M12 5c1-1 3-1 3 1" />
      </>
    ),
    animClass: "icon-float",
  },
  trophy: {
    paths: (
      <>
        <path d="M6 9a6 6 0 0 0 12 0V5H6v4z" />
        <path d="M6 7H3v2a3 3 0 0 0 3 3" />
        <path d="M18 7h3v2a3 3 0 0 1-3 3" />
        <path d="M10 21h4M12 17v4" />
      </>
    ),
    animClass: "icon-draw",
  },

  /* ---- global UI ---- */
  sun: {
    paths: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>
    ),
  },
  moon: {
    paths: (
      <>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </>
    ),
  },
  empty: {
    paths: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" strokeDasharray="4 2" />
        <path d="M8 12h8M12 8v8" opacity={0.4} />
      </>
    ),
  },
  success: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 10" />
      </>
    ),
    animClass: "icon-draw",
  },
  error: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </>
    ),
    animClass: "icon-draw",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function AnimatedIcon({
  name,
  className = "w-5 h-5",
  animate = true,
  label,
  viewBox,
  strokeWidth = 1.5,
}: AnimatedIconProps) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;

  const classes = [className, animate && glyph.animClass]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox={viewBox || "0 0 24 24"}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label || name}
    >
      {glyph.paths}
    </svg>
  );
}
