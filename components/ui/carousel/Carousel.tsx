"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  motion,
  type PanInfo,
  type MotionValue,
  type Transition,
  useMotionValue,
  useTransform,
} from "framer-motion";

export interface CarouselItem {
  id: string | number;
  title: string;
  description: string;
  icon?: ReactNode;
  tag?: string;
  image?: string;
  href?: string;
  ctaText?: string;
}

export interface CarouselProps {
  items: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
  className?: string;
  renderItem?: (item: CarouselItem, index: number, itemWidth: number) => ReactNode;
}

const DRAG_BUFFER = 10;
const VELOCITY_THRESHOLD = 350;
const GAP = 14;
const SPRING_OPTIONS = { type: "spring" as const, stiffness: 280, damping: 28 };

interface CarouselItemWrapperProps {
  item: CarouselItem;
  index: number;
  itemWidth: number;
  round: boolean;
  trackItemOffset: number;
  centerOffset: number;
  x: MotionValue<number>;
  transition: Transition;
  onSelect?: (index: number) => void;
  renderItem?: (item: CarouselItem, index: number, itemWidth: number) => ReactNode;
}

function CarouselItemWrapper({
  item,
  index,
  itemWidth,
  round,
  trackItemOffset,
  centerOffset,
  x,
  transition,
  onSelect,
  renderItem,
}: CarouselItemWrapperProps) {
  const centerPos = -index * trackItemOffset + centerOffset;
  const leftPos = -(index + 1) * trackItemOffset + centerOffset;
  const rightPos = -(index - 1) * trackItemOffset + centerOffset;
  const farLeftPos = leftPos - trackItemOffset;
  const farRightPos = rightPos + trackItemOffset;

  // 3D Coverflow Billboard transformations
  const rotateY = useTransform(
    x,
    [farLeftPos, leftPos, centerPos, rightPos, farRightPos],
    [24, 24, 0, -24, -24],
    { clamp: true }
  );

  const scale = useTransform(
    x,
    [farLeftPos, leftPos, centerPos, rightPos, farRightPos],
    [0.82, 0.90, 1, 0.90, 0.82],
    { clamp: true }
  );

  const opacity = useTransform(
    x,
    [farLeftPos, leftPos, centerPos, rightPos, farRightPos],
    [0.35, 0.72, 1, 0.72, 0.35],
    { clamp: true }
  );

  const zIndex = useTransform(
    x,
    [farLeftPos, leftPos, centerPos, rightPos, farRightPos],
    [1, 5, 20, 5, 1],
    { clamp: true }
  );

  if (renderItem) {
    return (
      <motion.div
        key={`${item.id}-${index}`}
        className="relative shrink-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          width: itemWidth,
          rotateY,
          scale,
          opacity,
          zIndex,
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
        }}
        transition={transition}
        onClick={() => onSelect?.(index)}
      >
        {renderItem(item, index, itemWidth)}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={`${item.id}-${index}`}
      className={`relative shrink-0 flex flex-col ${
        round
          ? "items-center justify-center text-center bg-[#120F17] border-0"
          : "items-start justify-between bg-surface-card border border-surface-border rounded-2xl shadow-xl"
      } overflow-hidden cursor-grab active:cursor-grabbing select-none`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : "100%",
        rotateY,
        scale,
        opacity,
        zIndex,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
        ...(round && { borderRadius: "50%" }),
      }}
      transition={transition}
      onClick={() => onSelect?.(index)}
    >
      <div className={`${round ? "p-0 m-0" : "mb-3 p-4"}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent">
          {item.icon}
        </span>
      </div>
      <div className="p-4 pt-0">
        <div className="mb-1 font-bold text-base text-hi">{item.title}</div>
        <p className="text-xs text-mid leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function Carousel({
  items = [],
  baseWidth = 0,
  autoplay = false,
  autoplayDelay = 3600,
  pauseOnHover = true,
  loop = true,
  round = false,
  className = "",
  renderItem,
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el) {
        setContainerWidth(el.clientWidth);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveWidth = containerWidth > 0 ? containerWidth : (baseWidth || 380);

  // Responsive billboard card width:
  // Mobile (<640px): 80% so left and right side cards peek in by ~26px each
  // Tablet/Desktop: 72% (up to 540px) so both side cards peek in beautifully like billboard banners
  const itemWidth = useMemo(() => {
    if (baseWidth > 0) {
      return Math.min(baseWidth, Math.round(effectiveWidth * 0.80));
    }
    if (effectiveWidth < 640) {
      return Math.max(260, Math.round(effectiveWidth * 0.80));
    }
    return Math.min(540, Math.max(340, Math.round(effectiveWidth * 0.72)));
  }, [baseWidth, effectiveWidth]);

  const trackItemOffset = itemWidth + GAP;
  // Center active card directly in the middle of the viewport
  const centerOffset = Math.max(0, (effectiveWidth - itemWidth) / 2);

  // Seamless infinite loop with 2 clones on each edge
  const itemsForRender = useMemo(() => {
    if (!loop || items.length <= 1) return items;
    if (items.length === 2) {
      return [items[1], items[0], items[1], items[0], items[1], items[0]];
    }
    const prefix = items.slice(-2);
    const suffix = items.slice(0, 2);
    return [...prefix, ...items, ...suffix];
  }, [items, loop]);

  const initialPosition = loop && items.length > 1 ? 2 : 0;
  const [position, setPosition] = useState<number>(initialPosition);
  const x = useMotionValue(-initialPosition * trackItemOffset + centerOffset);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Pause on hover / touch
  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleEnter = () => setIsHovered(true);
      const handleLeave = () => setIsHovered(false);
      container.addEventListener("mouseenter", handleEnter);
      container.addEventListener("mouseleave", handleLeave);
      container.addEventListener("touchstart", handleEnter, { passive: true });
      container.addEventListener("touchend", handleLeave, { passive: true });
      return () => {
        container.removeEventListener("mouseenter", handleEnter);
        container.removeEventListener("mouseleave", handleLeave);
        container.removeEventListener("touchstart", handleEnter);
        container.removeEventListener("touchend", handleLeave);
      };
    }
  }, [pauseOnHover]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;

    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  // Sync initial and resize motion value
  useEffect(() => {
    x.set(-position * trackItemOffset + centerOffset);
  }, [centerOffset, position, trackItemOffset, x]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationStart = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    if (!loop || items.length <= 1) {
      setIsAnimating(false);
      return;
    }

    // If reached first clone after real items
    if (position >= items.length + 2) {
      setIsJumping(true);
      const target = 2;
      setPosition(target);
      x.set(-target * trackItemOffset + centerOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    // If reached clone before real items
    if (position <= 1) {
      setIsJumping(true);
      const target = items.length + 1;
      setPosition(target);
      x.set(-target * trackItemOffset + centerOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;

    if (direction === 0) return;

    setPosition((prev) => {
      const next = prev + direction;
      const max = itemsForRender.length - 1;
      return Math.max(0, Math.min(next, max));
    });
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -(itemsForRender.length - 1) * trackItemOffset + centerOffset,
          right: centerOffset,
        },
      };

  const activeIndex = useMemo(() => {
    if (items.length === 0) return 0;
    if (!loop || items.length <= 1) return Math.min(position, items.length - 1);
    return (position - 2 + items.length * 10) % items.length;
  }, [items.length, loop, position]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none mx-auto ${className}`}
      style={{
        width: "100%",
        maxWidth: baseWidth > 0 ? `${baseWidth}px` : "100%",
        perspective: 1200,
      }}
    >
      <motion.div
        className="flex items-center"
        drag={isAnimating ? false : "x"}
        {...dragProps}
        style={{
          gap: `${GAP}px`,
          transformStyle: "preserve-3d",
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) + centerOffset }}
        transition={effectiveTransition}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItemWrapper
            key={`${item.id}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            round={round}
            trackItemOffset={trackItemOffset}
            centerOffset={centerOffset}
            x={x}
            transition={effectiveTransition}
            renderItem={renderItem}
            onSelect={(idx) => {
              if (idx !== position) {
                setPosition(idx);
              }
            }}
          />
        ))}
      </motion.div>

      {/* Pagination Indicators */}
      {items.length > 1 && (
        <div className="mt-4 flex w-full justify-center items-center gap-2">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index}
              className={`h-1.5 rounded-full cursor-pointer border-0 p-0 transition-all duration-200 ${
                activeIndex === index ? "w-6 bg-accent" : "w-2 bg-surface-border hover:bg-mid"
              }`}
              animate={{
                scale: activeIndex === index ? 1 : 0.85,
              }}
              onClick={() => setPosition(loop ? index + 2 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
