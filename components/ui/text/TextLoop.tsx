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

const buildPath = (shape: TextLoopShape, curviness: number, ribbonWidth: number, viewW: number, viewH: number): string => {
  const cx = viewW / 2;
  const cy = viewH / 2;
  const c = Math.max(0, curviness);
  const room = Math.max(20, cy - Math.max(0, ribbonWidth) / 2 - 6);

  switch (shape) {
    case "circle": {
      const r = Math.min(90 + c * 0.95, room);
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
    }
    case "infinity": {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${cx} ${cy}`,
        `C ${cx + r * 0.55} ${cy - h} ${cx + r} ${cy - h} ${cx + r} ${cy}`,
        `C ${cx + r} ${cy + h} ${cx + r * 0.55} ${cy + h} ${cx} ${cy}`,
        `C ${cx - r * 0.55} ${cy - h} ${cx - r} ${cy - h} ${cx - r} ${cy}`,
        `C ${cx - r} ${cy + h} ${cx - r * 0.55} ${cy + h} ${cx} ${cy}`,
        "Z",
      ].join(" ");
    }
    case "arch": {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M 80 ${cy + rise / 2} Q ${cx} ${cy - rise * 1.5} ${viewW - 80} ${cy + rise / 2}`;
    }
    case "line":
      return `M -400 ${cy} L ${viewW + 400} ${cy}`;
    case "wave":
    default: {
      const a = Math.min(c * 1.5, room * 1.2);
      return `M -400 ${cy} Q -200 ${cy - a} 0 ${cy} T 200 ${cy} T 400 ${cy} T 600 ${cy} T 800 ${cy} T ${viewW + 400} ${cy}`;
    }
  }
};

const TextLoop = ({
  text,
  texts,
  shape = "line",
  path,
  speed = 70,
  direction = "forward",
  separator = "•",
  curviness = 40,
  fontSize = 20,
  fontWeight = 800,
  fontFamily = "var(--font-syne), 'Syne', sans-serif",
  letterSpacing = 1.5,
  uppercase = true,
  color = "#D71921",
  ribbon = false,
  ribbonColor = "#D71921",
  ribbonWidth = 44,
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

  // Viewport proportions optimized for slimline mobile ticker
  const viewW = 800;
  const viewH = shape === "line" ? 54 : shape === "wave" ? 90 : 260;

  const d = useMemo(
    () => path || buildPath(shape, curviness, ribbonWidth, viewW, viewH),
    [path, shape, curviness, ribbonWidth, viewW, viewH]
  );

  const rawTextContent = useMemo(() => {
    if (texts && texts.length > 0) {
      return texts.join(` ${separator} `);
    }
    return text || "BROTHER'S FITNESS LAKHNADON";
  }, [text, texts, separator]);

  const unit = useMemo(() => {
    const base = uppercase ? String(rawTextContent).toUpperCase() : String(rawTextContent);
    const gap = separator ? `\u00A0\u00A0${separator}\u00A0\u00A0` : "\u00A0\u00A0\u00A0";
    return `${base}${gap}`;
  }, [rawTextContent, separator, uppercase]);

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

      // Ensure enough repetitions to seamlessly cover the path length
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
  }, [d, unit, fontSize, fontWeight, fontFamily, letterSpacing]);

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
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    <div
      ref={rootRef}
      className={`relative w-full overflow-hidden ${className}`.trim()}
      style={style}
    >
      <svg
        className="block w-full h-auto"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={rawTextContent}
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

        <text
          ref={measureRef}
          className="invisible pointer-events-none"
          style={textStyle}
          aria-hidden="true"
        >
          {unit}
        </text>

        <text
          className="select-none"
          style={textStyle}
          fill={color}
          dominantBaseline="central"
          aria-hidden="true"
        >
          <textPath ref={headRef} href={`#${pathId}`} startOffset="0px">
            {loopText}
          </textPath>
        </text>

        <text
          className="select-none"
          style={textStyle}
          fill={color}
          dominantBaseline="central"
          aria-hidden="true"
        >
          <textPath ref={tailRef} href={`#${pathId}`} startOffset="0px">
            {loopText}
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default TextLoop;
