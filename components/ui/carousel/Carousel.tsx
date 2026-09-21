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

const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: "spring" as const, stiffness: 300, damping: 30 };

interface CarouselItemWrapperProps {
  item: CarouselItem;
  index: number;
  itemWidth: number;
  round: boolean;
  trackItemOffset: number;
  centerOffset: number;
  x: MotionValue<number>;
  transition: Transition;
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
  renderItem,
}: CarouselItemWrapperProps) {
  const range = [
    centerOffset - (index + 1) * trackItemOffset,
    centerOffset - index * trackItemOffset,
    centerOffset - (index - 1) * trackItemOffset,
  ];
  const outputRange = [90, 0, -90];
  const rotateY = useTransform(x, range, outputRange, { clamp: false });

  if (renderItem) {
    return (
      <motion.div
        key={`${item?.id ?? index}-${index}`}
        className="relative shrink-0 flex flex-col overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          width: itemWidth,
          rotateY: rotateY,
        }}
        transition={transition}
      >
        {renderItem(item, index, itemWidth)}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={`${item?.id ?? index}-${index}`}
      className={`relative shrink-0 flex flex-col ${
        round
          ? "items-center justify-center text-center bg-[#120F17] border-0"
          : "items-start justify-between bg-surface-card border border-surface-border rounded-[16px]"
      } overflow-hidden cursor-grab active:cursor-grabbing select-none`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : "100%",
        rotateY: rotateY,
        ...(round && { borderRadius: "50%" }),
      }}
      transition={transition}
    >
      <div className={`${round ? "p-0 m-0" : "mb-4 p-5"}`}>
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#120F17]">
          {item.icon}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-1 font-black text-lg text-white">{item.title}</div>
        <p className="text-sm text-mid">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function Carousel({
  items = [],
  baseWidth = 360,
  autoplay = false,
  autoplayDelay = 3600,
  pauseOnHover = true,
  loop = false,
  round = false,
  className = "",
  renderItem,
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(baseWidth);

  // ResizeObserver for mathematical pixel-perfect centering on both mobile and desktop
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [baseWidth]);

  const containerPadding = round ? 16 : 0;
  const itemWidth = Math.min(Math.max(260, baseWidth - containerPadding * 2), containerWidth);
  const trackItemOffset = itemWidth + GAP;
  // Exact symmetric offset to lock the active card dead-center in the viewport/container
  const centerOffset = Math.max(0, (containerWidth - itemWidth) / 2);

  const itemsForRender = useMemo(() => {
    if (!loop) return items;
    if (items.length === 0) return [];
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState<number>(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [progressKey, setProgressKey] = useState<number>(0);

  // When hold or tap on banners, or autoplay disabled: strictly freeze autoplay and progress
  const isPaused = !autoplay || isHolding || (pauseOnHover && isHovered) || isAnimating || isJumping;

  // Global pointer release listener so releasing outside banner safely resumes
  useEffect(() => {
    if (!isHolding) return;
    const handleGlobalRelease = () => {
      setIsHolding(false);
    };
    window.addEventListener("pointerup", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    window.addEventListener("touchcancel", handleGlobalRelease);
    window.addEventListener("mouseup", handleGlobalRelease);
    return () => {
      window.removeEventListener("pointerup", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
      window.removeEventListener("touchcancel", handleGlobalRelease);
      window.removeEventListener("mouseup", handleGlobalRelease);
    };
  }, [isHolding]);

  // Initial and reactive positioning: strictly centered
  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(centerOffset - startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, centerOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationStart = () => {
    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;

    if (position === lastCloneIndex) {
      setIsJumping(true);
      const target = 1;
      setPosition(target);
      x.set(centerOffset - target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    if (position === 0) {
      setIsJumping(true);
      const target = items.length;
      setPosition(target);
      x.set(centerOffset - target * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }

    setIsAnimating(false);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    setIsHolding(false);
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
    setProgressKey((k) => k + 1);
  };

  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: centerOffset - trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: centerOffset,
        },
      };

  const activeIndex =
    items.length === 0
      ? 0
      : loop
      ? (position - 1 + items.length) % items.length
      : Math.min(position, items.length - 1);

  return (
    <>
      <style>{`
        @keyframes carouselProgressFill {
          0% {
            transform: scaleX(0);
          }
          100% {
            transform: scaleX(1);
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`relative overflow-hidden w-full flex flex-col items-center justify-center mx-auto ${
          round ? "p-4 rounded-full border border-white" : "p-0 border-0 bg-transparent"
        } ${className}`}
        style={{
          width: "100%",
          maxWidth: `${baseWidth}px`,
          ...(round && { height: `${baseWidth}px` }),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={() => setIsHolding(true)}
        onPointerUp={() => setIsHolding(false)}
        onPointerCancel={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)}
        onTouchEnd={() => setIsHolding(false)}
        onTouchCancel={() => setIsHolding(false)}
      >
        {/* Strictly Centered 3D Carousel Motion Track */}
        <motion.div
          className="flex items-center"
          drag={isAnimating ? false : "x"}
          {...dragProps}
          style={{
            width: itemWidth,
            gap: `${GAP}px`,
            perspective: 1000,
            perspectiveOrigin: `${centerOffset + position * trackItemOffset + itemWidth / 2}px 50%`,
            x,
          }}
          onDragStart={() => setIsHolding(true)}
          onDragEnd={handleDragEnd}
          animate={{ x: centerOffset - (position * trackItemOffset) }}
          transition={effectiveTransition}
          onAnimationStart={handleAnimationStart}
          onAnimationComplete={handleAnimationComplete}
        >
          {itemsForRender.map((item, index) => (
            <CarouselItemWrapper
              key={`${item?.id ?? index}-${index}`}
              item={item}
              index={index}
              itemWidth={itemWidth}
              round={round}
              trackItemOffset={trackItemOffset}
              centerOffset={centerOffset}
              x={x}
              transition={effectiveTransition}
              renderItem={renderItem}
            />
          ))}
        </motion.div>

        {/* Best Ever Dynamic Segmented Story Progress Bar */}
        <div className="mt-5 sm:mt-7 flex flex-col items-center gap-2 w-full max-w-sm sm:max-w-md mx-auto px-4 select-none">
          {/* Segmented Progress Track Pills */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full">
            {items.map((item, index) => {
              const isPast = index < activeIndex;
              const isCurrent = index === activeIndex;

              return (
                <button
                  key={item.id ?? index}
                  type="button"
                  onClick={() => {
                    setPosition(loop ? index + 1 : index);
                    setProgressKey((k) => k + 1);
                  }}
                  aria-label={`Jump to slide ${index + 1}: ${item.title}`}
                  className="group relative flex-1 h-2 sm:h-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer overflow-hidden p-0 border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {/* Past slides: Solid subtle fill */}
                  {isPast && (
                    <div className="w-full h-full bg-white/35 rounded-full" />
                  )}

                  {/* Active slide: Hardware-accelerated GPU scaleX progress fill */}
                  {isCurrent && (
                    <div
                      key={`prog-${activeIndex}-${progressKey}`}
                      className="h-full bg-accent rounded-full will-change-transform shadow-[0_0_12px_rgba(215,25,33,0.8)]"
                      style={{
                        width: "100%",
                        transformOrigin: "left",
                        animationName: "carouselProgressFill",
                        animationDuration: `${autoplayDelay}ms`,
                        animationTimingFunction: "linear",
                        animationFillMode: "forwards",
                        animationPlayState: isPaused ? "paused" : "running",
                      }}
                      onAnimationEnd={() => {
                        if (!isPaused) {
                          setPosition((prev) => (loop ? prev + 1 : (prev + 1) % itemsForRender.length));
                          setProgressKey((k) => k + 1);
                        }
                      }}
                    />
                  )}

                  {/* Future slides: Dark transparent track */}
                  {!isPast && !isCurrent && (
                    <div className="w-full h-full bg-transparent" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Status Badge & Hold Indicator */}
          <div className="flex items-center justify-between w-full text-[11px] font-mono tracking-wider text-mid px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold">{String(activeIndex + 1).padStart(2, "0")}</span>
              <span className="text-muted/60">/</span>
              <span className="text-muted/60">{String(items.length).padStart(2, "0")}</span>
              <span className="ml-1 text-hi font-medium truncate max-w-[120px] sm:max-w-[220px]">
                {items[activeIndex]?.title}
              </span>
            </div>

            {/* Hold to Pause Indicator */}
            <div className="flex items-center gap-1">
              {isHolding ? (
                <span className="inline-flex items-center gap-1.5 text-accent font-semibold animate-pulse text-[10px] uppercase tracking-widest bg-accent/15 px-2 py-0.5 rounded-full border border-accent/40 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  PAUSED
                </span>
              ) : (
                <span className="text-[10px] text-muted/60 uppercase tracking-widest hidden sm:inline">
                  HOLD TO PAUSE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
