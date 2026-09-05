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
const VELOCITY_THRESHOLD = 400;
const GAP = 14;
const SPRING_OPTIONS = { type: "spring" as const, stiffness: 280, damping: 28 };

interface CarouselItemWrapperProps {
  item: CarouselItem;
  index: number;
  itemWidth: number;
  round: boolean;
  trackItemOffset: number;
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
  x,
  transition,
  renderItem,
}: CarouselItemWrapperProps) {
  const range = [
    -(index + 1) * trackItemOffset,
    -index * trackItemOffset,
    -(index - 1) * trackItemOffset,
  ];
  const outputRange = [45, 0, -45];
  const rotateY = useTransform(x, range, outputRange, { clamp: false });

  if (renderItem) {
    return (
      <motion.div
        key={`${item.id}-${index}`}
        className="relative shrink-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          width: itemWidth,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        transition={transition}
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
          : "items-start justify-between bg-surface-card border border-surface-border rounded-2xl"
      } overflow-hidden cursor-grab active:cursor-grabbing select-none`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : "100%",
        rotateY,
        ...(round && { borderRadius: "50%" }),
      }}
      transition={transition}
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
  baseWidth = 320,
  autoplay = false,
  autoplayDelay = 3500,
  pauseOnHover = true,
  loop = true,
  round = false,
  className = "",
  renderItem,
}: CarouselProps) {
  const containerPadding = 12;
  const itemWidth = Math.max(260, baseWidth - containerPadding * 2);
  const trackItemOffset = itemWidth + GAP;

  const itemsForRender = useMemo(() => {
    if (!loop || items.length <= 1) return items;
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState<number>(loop && items.length > 1 ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;

    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const startingPosition = loop && items.length > 1 ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

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
      x.set(-target * trackItemOffset);
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
      x.set(-target * trackItemOffset);
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
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      };

  const activeIndex =
    items.length === 0
      ? 0
      : loop
        ? (position - 1 + items.length) % items.length
        : Math.min(position, items.length - 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden p-3 select-none ${className}`}
      style={{
        width: "100%",
        maxWidth: `${baseWidth}px`,
        margin: "0 auto",
      }}
    >
      <motion.div
        className="flex"
        drag={isAnimating ? false : "x"}
        {...dragProps}
        style={{
          width: itemWidth,
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
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
            x={x}
            transition={effectiveTransition}
            renderItem={renderItem}
          />
        ))}
      </motion.div>

      {/* Pagination Dots */}
      {items.length > 1 && (
        <div className="mt-3 flex w-full justify-center items-center gap-1.5">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index}
              className={`h-1.5 rounded-full cursor-pointer border-0 p-0 transition-all duration-200 ${
                activeIndex === index ? "w-5 bg-accent" : "w-1.5 bg-surface-border hover:bg-mid"
              }`}
              animate={{
                scale: activeIndex === index ? 1 : 0.85,
              }}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
