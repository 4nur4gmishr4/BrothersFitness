"use client";

import {
  CSSProperties,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "@/components/ui/providers/ThemeProvider";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type StrokeTextTrigger = "mount" | "hover" | "scroll" | "loop";
export type StrokeTextFillMode = "wipe" | "fade" | "none";

export interface StrokeTextProps {
  text?: string;
  delay?: number;
  strokeColor?: string;
  fillColor?: string;
  highlightWord?: string;
  highlightColor?: string;
  highlightStrokeColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  ease?: string;
  trigger?: StrokeTextTrigger;
  fillMode?: StrokeTextFillMode;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: number;
  reverse?: boolean;
  align?: "left" | "center";
  className?: string;
  style?: CSSProperties;
}

interface StrokeTextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_TEXT = "BROTHER'S FITNESS";

const StrokeText = ({
  text = DEFAULT_TEXT,
  delay = 0,
  strokeColor,
  fillColor,
  highlightWord = "FITNESS",
  highlightColor = "#D71921",
  highlightStrokeColor,
  strokeWidth = 1.8,
  drawDuration = 1.3,
  fillDelay = 0.12,
  stagger = 0.035,
  ease = "power2.out",
  trigger = "mount",
  fillMode = "wipe",
  fontSize = 100,
  fontWeight = 800,
  fontFamily = "var(--font-syne), 'Syne', sans-serif",
  letterSpacing = 0,
  reverse = false,
  align = "left",
  className = "",
  style = {},
}: StrokeTextProps) => {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const strokeTextRef = useRef<SVGTextElement | null>(null);
  const wipeRectRef = useRef<SVGRectElement | null>(null);
  const hasMountedAnimRef = useRef(false);

  const { resolvedTheme } = useTheme();

  // Theme-aware colors:
  // Dark mode: BROTHER'S in crisp #FFFFFF, FITNESS in gym brand red #D71921
  // Light mode: BROTHER'S in pure #0A0A0A, FITNESS in gym brand red #D71921
  const activeFillColor =
    fillColor ?? (resolvedTheme === "light" ? "#0A0A0A" : "#FFFFFF");
  const activeStrokeColor =
    strokeColor ?? (resolvedTheme === "light" ? "#0A0A0A" : "#FFFFFF");
  const activeHighlightColor = highlightColor ?? "#D71921";
  const activeHighlightStrokeColor =
    highlightStrokeColor ?? activeHighlightColor;

  const [box, setBox] = useState<StrokeTextBox | null>(null);

  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const characters = useMemo(() => Array.from(String(text ?? "")), [text]);

  // Determine which character indices belong to the highlight word
  const highlightIndices = useMemo(() => {
    const str = String(text ?? "");
    if (!highlightWord) return new Set<number>();
    const idx = str.indexOf(highlightWord);
    if (idx === -1) return new Set<number>();
    const set = new Set<number>();
    for (let i = idx; i < idx + highlightWord.length; i++) {
      set.add(i);
    }
    return set;
  }, [text, highlightWord]);

  const dash = Math.max(fontSize * 7, 200);

  const fontStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      fontFamily,
      letterSpacing: `${letterSpacing}px`,
    }),
    [fontSize, fontWeight, fontFamily, letterSpacing]
  );

  useLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;
      let bbox: DOMRect | undefined;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2,
      };

      setBox((prev) =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5
          ? prev
          : next
      );

      // If animation already completed in the past, immediately maintain full wipe width
      if (hasMountedAnimRef.current && wipeRectRef.current) {
        gsap.set(wipeRectRef.current, { attr: { width: next.width } });
      }
    };

    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [characters, fontSize, fontWeight, fontFamily, letterSpacing, strokeWidth]);

  useEffect(() => {
    const root = rootRef.current;
    if (typeof window === "undefined" || !root || !box) return undefined;

    const strokes = gsap.utils.toArray(
      root.querySelectorAll("[data-stroke-char]")
    );
    const fills = gsap.utils.toArray(root.querySelectorAll("[data-fill-char]"));
    const wipe = wipeRectRef.current;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== "none";
    const useWipe = fillEnabled && fillMode === "wipe";
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig: number | gsap.StaggerVars = reverse
      ? { each: stagger, from: "end" as const }
      : stagger;
    const targets = [...strokes, ...fills, wipe].filter(Boolean);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe)
        gsap.set(wipe, { attr: { width: fillEnabled ? box.width : 0 } });
    };

    // If already animated on initial mount, keep the text rendered and do NOT restart!
    if (hasMountedAnimRef.current && trigger !== "hover" && trigger !== "loop") {
      setEnd();
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setEnd();
      hasMountedAnimRef.current = true;
      return () => gsap.killTweensOf(targets);
    }

    const build = () => {
      setStart();
      const tl = gsap.timeline({
        paused: true,
        delay: delay ?? 0,
        repeat: trigger === "loop" ? -1 : 0,
        repeatDelay: trigger === "loop" ? 0.9 : 0,
        defaults: { overwrite: "auto" },
        onComplete: () => {
          hasMountedAnimRef.current = true;
        },
      });

      tl.to(
        strokes,
        {
          strokeDashoffset: 0,
          duration: drawDuration,
          ease,
          stagger: staggerConfig,
        },
        0
      );

      if (useWipe && wipe) {
        tl.to(
          wipe,
          {
            attr: { width: box.width },
            duration: fillDuration,
            ease: "power2.inOut",
          },
          drawDuration + fillDelay
        );
      } else if (fillEnabled) {
        tl.to(
          fills,
          {
            opacity: 1,
            duration: fillDuration,
            ease: "power2.out",
            stagger: staggerConfig,
          },
          drawDuration + fillDelay
        );
      }

      return tl;
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
    let removeHover: (() => void) | null = null;

    if (trigger === "hover") {
      setEnd();
      const play = () => {
        timeline?.kill();
        timeline = build();
        timeline.play(0);
      };
      root.addEventListener("pointerenter", play);
      removeHover = () => root.removeEventListener("pointerenter", play);
    } else {
      timeline = build();
      if (trigger === "scroll") {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: "top 82%",
          once: true,
          onEnter: () => timeline?.play(0),
        });
      } else {
        timeline.play(0);
      }
    }

    return () => {
      removeHover?.();
      scrollTrigger?.kill();
      timeline?.kill();
      gsap.killTweensOf(targets);
    };
    // CRITICAL: Notice activeFillColor, activeStrokeColor, activeHighlightColor are deliberately NOT dependencies here!
    // Theme toggling must NEVER restart or replay the stroke drawing timeline!
  }, [
    box,
    dash,
    drawDuration,
    fillDelay,
    stagger,
    ease,
    trigger,
    fillMode,
    reverse,
  ]);

  const viewBox = box
    ? `${box.x} ${box.y} ${box.width} ${box.height}`
    : `0 ${-fontSize} 720 ${fontSize * 1.3}`;

  const aspect = align === "left" ? "xMinYMin meet" : "xMidYMin meet";

  return (
    <span
      ref={rootRef}
      className={`block w-full leading-[0] select-none ${
        trigger === "hover" ? "cursor-pointer" : ""
      } ${className}`.trim()}
      style={style}
      role="img"
      aria-label={String(text ?? "")}
    >
      <svg
        className="block w-full"
        style={{
          height: box
            ? `${Math.ceil(box.height)}px`
            : `${Math.round(fontSize * 1.15)}px`,
          maxHeight: "100%",
        }}
        viewBox={viewBox}
        preserveAspectRatio={aspect}
        aria-hidden="true"
      >
        {fillMode === "wipe" && box && (
          <defs>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect
                ref={wipeRectRef}
                x={box.x}
                y={box.y}
                width="0"
                height={box.height}
              />
            </clipPath>
          </defs>
        )}

        {/* 1. Animated Stroke Outlines */}
        <text
          ref={strokeTextRef}
          className="select-none"
          x="0"
          y="0"
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((char, index) => {
            const isHighlight = highlightIndices.has(index);
            return (
              <tspan
                data-stroke-char
                key={`s-${index}`}
                stroke={
                  isHighlight ? activeHighlightStrokeColor : activeStrokeColor
                }
              >
                {char}
              </tspan>
            );
          })}
        </text>

        {/* 2. Revealed Fills */}
        <text
          className="select-none"
          x="0"
          y="0"
          stroke="none"
          style={fontStyle}
          clipPath={fillMode === "wipe" && box ? `url(#${wipeId})` : undefined}
        >
          {characters.map((char, index) => {
            const isHighlight = highlightIndices.has(index);
            return (
              <tspan
                data-fill-char
                key={`f-${index}`}
                fill={isHighlight ? activeHighlightColor : activeFillColor}
              >
                {char}
              </tspan>
            );
          })}
        </text>
      </svg>
    </span>
  );
};

export default StrokeText;
