"use client";

import { useRef, useEffect, useState, useId, FC, PointerEvent } from "react";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = "No Pain, No Gain, Shut Up & Train",
  speed = 2,
  className,
  curveAmount = 120,
  direction = "left",
  interactive = true
}) => {
  // L29: useMemo on a primitive (string) is pointless — use the prop directly.
  const measureRef = useRef<SVGTextElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
  const [spacing, setSpacing] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const gradientId = `gym-grad-${uid}`;
  const pathD = `M0,100 Q960,${100 + curveAmount} 1920,100`;
  const dragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);
  const dirRef = useRef<"left" | "right">(direction);
  const velRef = useRef(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const dumbbellIcon = " 🏋️ ";
  const textWithIcon = marqueeText + dumbbellIcon;

  const textLength = spacing;
  const totalText = textLength
    ? Array(Math.ceil(4000 / textLength) + 2)
        .fill(textWithIcon)
        .join("")
    : textWithIcon;

  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
  }, [marqueeText, className]);

  useEffect(() => {
    if (!spacing) return;
    if (textPathRef.current) {
      const initial = -spacing;
      textPathRef.current.setAttribute("startOffset", initial + "px");
    }
  }, [spacing]);

  // Pause the marquee when off-screen (IntersectionObserver) and when the
  // user prefers reduced motion — a decorative loop must not burn CPU or
  // fight an accessibility preference.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!spacing || !ready || !isVisible || reduceMotion) return;
    let frame = 0;

    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
        let newOffset = currentOffset + delta;
        const wrapPoint = spacing;

        if (newOffset <= -wrapPoint) newOffset += wrapPoint;
        if (newOffset > 0) newOffset -= wrapPoint;

        textPathRef.current.setAttribute("startOffset", newOffset + "px");
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready, isVisible, reduceMotion]);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    dragRef.current = true;
    setIsDragging(true);
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;

    const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
    let newOffset = currentOffset + dx;
    const wrapPoint = spacing;

    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;

    textPathRef.current.setAttribute("startOffset", newOffset + "px");
  };

  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    setIsDragging(false);
    dirRef.current = velRef.current > 0 ? "right" : "left";
  };

  const cursorStyle = interactive ? (isDragging ? "grabbing" : "grab") : "auto";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1920 320"
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ cursor: cursorStyle, userSelect: "none", width: "100%", height: "auto" }}
      preserveAspectRatio="none"
    >
      <defs>
        <path id={pathId} d={pathD} />
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-color)" />
          <stop offset="50%" stopColor="var(--text-hi-color)" />
          <stop offset="100%" stopColor="var(--accent-color)" />
        </linearGradient>
      </defs>

      <text ref={measureRef} fontSize="64" fontWeight="bold" opacity="0">
        {textWithIcon}
      </text>

      {ready && (
        <text fontSize="64" fontWeight="bold" fill={`url(#${gradientId})`} fontFamily="sans-serif">
          <textPath ref={textPathRef} href={`#${pathId}`}>
            {totalText}
          </textPath>
        </text>
      )}
    </svg>
  );
};

export default CurvedLoop;
