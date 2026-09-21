"use client";

import {
  CSSProperties,
  useEffect,
  useId,
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
  text?: string | string[];
  lines?: string[];
  lineHeight?: number;
  delay?: number;
  mobileScaleX?: number;
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
  mobileFontSize?: number;
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
  lines,
  lineHeight = 1.26,
  delay = 0,
  mobileScaleX = 1,
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
  mobileFontSize,
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

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const effectiveFontSize = isMobile && mobileFontSize ? mobileFontSize : fontSize;
  const scaleXVal = isMobile && mobileScaleX ? mobileScaleX : 1;

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

  // Parse lines: supports lines prop, array of strings, or newline-delimited text
  const parsedLines = useMemo<string[]>(() => {
    if (lines && lines.length > 0) return lines;
    if (Array.isArray(text)) return text;
    if (typeof text === "string") return text.split("\n");
    return [DEFAULT_TEXT];
  }, [text, lines]);

  // Stable pre-computed initial bounding box prevents layout thrashing & CLS
  const [box, setBox] = useState<StrokeTextBox>(() => {
    const maxChars = Math.max(...(lines || [DEFAULT_TEXT]).map((l) => l.length), 9);
    const estW = maxChars * (fontSize || 100) * 0.74;
    const estH = ((lines || [DEFAULT_TEXT]).length || 2) * (fontSize || 100) * (lineHeight || 1.26) + 30;
    return {
      x: 0,
      y: -(fontSize || 100) * 0.85,
      width: estW,
      height: estH,
    };
  });

  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Determine if a character in a given line belongs to the highlight word
  const isCharHighlight = (lineText: string, charIndex: number) => {
    if (!highlightWord) return false;
    const idx = lineText.indexOf(highlightWord);
    if (idx === -1) return false;
    return charIndex >= idx && charIndex < idx + highlightWord.length;
  };

  const dash = Math.max(effectiveFontSize * 7, 200);

  const fontStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: `${effectiveFontSize}px`,
      fontWeight,
      fontFamily,
      letterSpacing: `${letterSpacing}px`,
    }),
    [effectiveFontSize, fontWeight, fontFamily, letterSpacing]
  );

  // Asynchronous measurement with requestAnimationFrame so layout is never blocked
  useEffect(() => {
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

      const pad = Math.max(Number(strokeWidth) || 1, effectiveFontSize * 0.08);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: (bbox.width * scaleXVal) + pad * 2,
        height: bbox.height + pad * 2,
      };

      setBox((prev) =>
        prev &&
        Math.abs(prev.x - next.x) < 1 &&
        Math.abs(prev.width - next.width) < 1 &&
        Math.abs(prev.y - next.y) < 1
          ? prev
          : next
      );

      if (hasMountedAnimRef.current && wipeRectRef.current) {
        gsap.set(wipeRectRef.current, { attr: { width: next.width } });
      }
    };

    const rafId = requestAnimationFrame(() => {
      measure();
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(measure).catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [parsedLines, effectiveFontSize, fontWeight, fontFamily, letterSpacing, strokeWidth, lineHeight, scaleXVal]);

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
  }, [
    box,
    dash,
    drawDuration,
    fillDelay,
    delay,
    stagger,
    ease,
    trigger,
    fillMode,
    reverse,
  ]);

  const viewBox = box
    ? `${box.x} ${box.y} ${box.width} ${box.height}`
    : `0 ${-fontSize} 800 ${fontSize * 2.2}`;

  const aspect = align === "left" ? "xMinYMin meet" : "xMidYMin meet";

  return (
    <span
      ref={rootRef}
      className={`block w-full leading-[0] select-none ${
        trigger === "hover" ? "cursor-pointer" : ""
      } ${className}`.trim()}
      style={style}
      role="img"
      aria-label={parsedLines.join(" ")}
    >
      <svg
        className="block w-full h-auto overflow-visible"
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
          transform={scaleXVal !== 1 ? `scale(${scaleXVal}, 1)` : undefined}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {parsedLines.map((lineText, lineIdx) => (
            <tspan
              key={`line-s-${lineIdx}`}
              x="0"
              dy={lineIdx === 0 ? "0" : `${lineHeight}em`}
            >
              {Array.from(lineText).map((char, charIdx) => {
                const isHighlight = isCharHighlight(lineText, charIdx);
                return (
                  <tspan
                    data-stroke-char
                    key={`s-${lineIdx}-${charIdx}`}
                    stroke={
                      isHighlight ? activeHighlightStrokeColor : activeStrokeColor
                    }
                  >
                    {char}
                  </tspan>
                );
              })}
            </tspan>
          ))}
        </text>

        {/* 2. Revealed Fills */}
        <text
          className="select-none"
          x="0"
          y="0"
          transform={scaleXVal !== 1 ? `scale(${scaleXVal}, 1)` : undefined}
          stroke="none"
          style={fontStyle}
          clipPath={fillMode === "wipe" && box ? `url(#${wipeId})` : undefined}
        >
          {parsedLines.map((lineText, lineIdx) => (
            <tspan
              key={`line-f-${lineIdx}`}
              x="0"
              dy={lineIdx === 0 ? "0" : `${lineHeight}em`}
            >
              {Array.from(lineText).map((char, charIdx) => {
                const isHighlight = isCharHighlight(lineText, charIdx);
                return (
                  <tspan
                    data-fill-char
                    key={`f-${lineIdx}-${charIdx}`}
                    fill={isHighlight ? activeHighlightColor : activeFillColor}
                  >
                    {char}
                  </tspan>
                );
              })}
            </tspan>
          ))}
        </text>
      </svg>
    </span>
  );
};

export default StrokeText;
