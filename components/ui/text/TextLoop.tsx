"use client";

import { CSSProperties, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

export type TextLoopShape = "wave" | "circle" | "infinity" | "arch" | "line";
export type TextLoopDirection = "forward" | "reverse";

export interface TextLoopProps {
  text?: string;
  texts?: string[];
  shape?: TextLoopShape;
  path?: string;
  speed?: number;
  direction?: TextLoopDirection;
  separator?: string;
  curviness?: number;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  pauseOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Metrics {
  length: number;
  unitWidth: number;
  reps: number;
}

const VIEW_W = 1200;
const VIEW_H = 520;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;

const buildPath = (shape: TextLoopShape, curviness: number, ribbonWidth: number): string => {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

  switch (shape) {
    case "circle": {
      const r = Math.min(90 + c * 0.95, room);
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case "infinity": {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        "Z",
      ].join(" ");
    }
    case "arch": {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case "line":
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case "wave":
    default: {
      const a = Math.min(c * 2.2, room * 2);
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
};

const TextLoop = ({
  text,
  texts,
  shape = "wave",
  path,
  speed = 90,
  direction = "forward",
  separator = "✦",
  curviness = 90,
  fontSize = 44,
  fontWeight = 800,
  fontFamily = "var(--font-syne), 'Syne', sans-serif",
  letterSpacing = 2,
  uppercase = true,
  color = "#ffffff",
  ribbon = true,
  ribbonColor = "#D71921",
  ribbonWidth = 86,
  pauseOnHover = true,
  className = "",
  style = {},
}: TextLoopProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);
  const headRef = useRef<SVGTextPathElement | null>(null);
  const tailRef = useRef<SVGTextPathElement | null>(null);

  const [metrics, setMetrics] = useState<Metrics>({ length: 0, unitWidth: 0, reps: 2 });

  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const d = useMemo(() => path || buildPath(shape, curviness, ribbonWidth), [path, shape, curviness, ribbonWidth]);

  const rawText = useMemo(() => {
    if (texts && texts.length > 0) {
      return texts.join(` ${separator} `);
    }
    return text || "BROTHER'S FITNESS LAKHNADON";
  }, [text, texts, separator]);

  const unit = useMemo(() => {
    const base = uppercase ? String(rawText).toUpperCase() : String(rawText);
    const gap = separator ? `\u00A0${separator}\u00A0` : "\u00A0\u00A0\u00A0";
    return `${base}${gap}`;
  }, [rawText, separator, uppercase]);

  const textStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      fontFamily,
      letterSpacing: `${letterSpacing}px`,
    }),
    [fontSize, fontWeight, fontFamily, letterSpacing]
  );

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    const measureEl = measureRef.current;
    if (!pathEl || !measureEl) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      let length = 0;
      let unitWidth = 0;
      try {
        length = pathEl.getTotalLength();
        unitWidth = measureEl.getComputedTextLength();
      } catch {
        return;
      }
      if (!length || !unitWidth) return;

      const reps = Math.max(2, Math.ceil(length / unitWidth) + 1);
      setMetrics((prev) =>
        prev.length === length && prev.unitWidth === unitWidth && prev.reps === reps
          ? prev
          : { length, unitWidth, reps }
      );
    };

    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [d, unit, fontSize, fontWeight, letterSpacing]);

  useEffect(() => {
    const { unitWidth, reps } = metrics;
    const head = headRef.current;
    const tail = tailRef.current;
    const cycleLength = unitWidth * Math.max(1, Math.floor(reps / 2));
    if (!head || !tail || !cycleLength) return undefined;

    const apply = (offset: number) => {
      const partner = offset >= 0 ? offset - cycleLength : offset + cycleLength;
      head.setAttribute("startOffset", `${offset}px`);
      tail.setAttribute("startOffset", `${partner}px`);
    };

    apply(0);

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || speed <= 0) return undefined;

    const state = { offset: 0 };
    const tween = gsap.to(state, {
      offset: direction === "reverse" ? -cycleLength : cycleLength,
      duration: cycleLength / speed,
      ease: "none",
      repeat: -1,
      onUpdate: () => apply(state.offset),
    });

    const root = rootRef.current;
    const pause = () => tween.pause();
    const resume = () => tween.resume();

    if (pauseOnHover && root) {
      root.addEventListener("pointerenter", pause);
      root.addEventListener("pointerleave", resume);
    }

    return () => {
      tween.kill();
      if (pauseOnHover && root) {
        root.removeEventListener("pointerenter", pause);
        root.removeEventListener("pointerleave", resume);
      }
    };
  }, [metrics, speed, direction, pauseOnHover]);

  const loopText = unit.repeat(metrics.reps);

  return (
    <div ref={rootRef} className={`relative w-full overflow-hidden ${className}`.trim()} style={style}>
      <svg
        className="block w-full h-auto"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={rawText}
      >
        <path
          ref={pathRef}
          id={pathId}
          d={d}
          fill="none"
          stroke={ribbon ? ribbonColor : "none"}
          strokeWidth={ribbon ? ribbonWidth : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text ref={measureRef} className="invisible pointer-events-none" style={textStyle} aria-hidden="true">
          {unit}
        </text>

        <text className="select-none" style={textStyle} fill={color} dominantBaseline="central" aria-hidden="true">
          <textPath ref={headRef} href={`#${pathId}`} startOffset={0}>
            {loopText}
          </textPath>
        </text>

        <text className="select-none" style={textStyle} fill={color} dominantBaseline="central" aria-hidden="true">
          <textPath ref={tailRef} href={`#${pathId}`} startOffset={0}>
            {loopText}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default TextLoop;
