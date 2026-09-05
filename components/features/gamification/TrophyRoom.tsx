"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, useSpring, useMotionValue } from "framer-motion";
import {
  Check,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { useGamification } from "@/components/ui/providers/GamificationContext";

// --- APPLE FITNESS STYLE ANIMATED VECTOR BADGES ---

const ShieldBadge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <motion.path
      d="M24 4L38 10V22C38 31.5 32 39.5 24 44C16 39.5 10 22V10L24 4Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
    <motion.circle
      cx="24"
      cy="23"
      r="4.5"
      fill="currentColor"
      animate={unlocked ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      className={unlocked ? "text-accent" : "text-mid/30"}
    />
  </svg>
);

const StreakBadge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <motion.path
      d="M24 6C24 6 15 16 15 27C15 32.5 19 37 24 37C29 37 33 32.5 33 27C33 21 28 17 28 17C28 17 29 23 26 25C23 27 21 24 21 22C21 16 24 6 24 6Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={unlocked ? "rgba(215, 25, 33, 0.15)" : "transparent"}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
  </svg>
);

const DumbbellBadge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <line
      x1="8"
      y1="24"
      x2="40"
      y2="24"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className={unlocked ? "text-hi" : "text-mid/40"}
    />
    <rect
      x="12"
      y="14"
      width="6"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill={unlocked ? "rgba(255,255,255,0.08)" : "transparent"}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
    <rect
      x="30"
      y="14"
      width="6"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill={unlocked ? "rgba(255,255,255,0.08)" : "transparent"}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
  </svg>
);

const NutritionBadge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <ellipse
      cx="24"
      cy="24"
      rx="16"
      ry="6"
      stroke="currentColor"
      strokeWidth="1.5"
      className={unlocked ? "text-accent" : "text-mid/30"}
    />
    <ellipse
      cx="24"
      cy="24"
      rx="16"
      ry="6"
      transform="rotate(60 24 24)"
      stroke="currentColor"
      strokeWidth="1.5"
      className={unlocked ? "text-accent/80" : "text-mid/30"}
    />
    <circle
      cx="24"
      cy="24"
      r="4"
      fill="currentColor"
      className={unlocked ? "text-hi" : "text-mid/40"}
    />
  </svg>
);

const MetricsBadge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <path
      d="M10 32C10 24.268 16.268 18 24 18C31.732 18 38 24.268 38 32"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={unlocked ? "text-hi" : "text-mid/40"}
    />
    <line
      x1="24"
      y1="32"
      x2="32"
      y2="22"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
    <circle
      cx="24"
      cy="32"
      r="3"
      fill="currentColor"
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
  </svg>
);

const LegendBadge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <path
      d="M10 18L16 34H32L38 18L29 24L24 12L19 24L10 18Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={unlocked ? "rgba(215, 25, 33, 0.12)" : "transparent"}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
    <circle cx="24" cy="12" r="2" fill="currentColor" className={unlocked ? "text-hi" : "text-mid/30"} />
    <circle cx="10" cy="18" r="2" fill="currentColor" className={unlocked ? "text-hi" : "text-mid/30"} />
    <circle cx="38" cy="18" r="2" fill="currentColor" className={unlocked ? "text-hi" : "text-mid/30"} />
  </svg>
);

interface MilestoneItem {
  id: string;
  key: string;
  stage: string;
  title: string;
  subtitle: string;
  requirement: string;
  actionLabel: string;
  actionHref: string;
  component: React.ComponentType<{ unlocked: boolean }>;
}

const FLOWING_MILESTONES: MilestoneItem[] = [
  {
    id: "stage-01",
    key: "ROOKIE_RECRUIT",
    stage: "01",
    title: "MEMBER ONBOARDING",
    subtitle: "Welcome to Brother's Fitness platform",
    requirement: "First portal activation & registration",
    actionLabel: "View Facilities",
    actionHref: "/#facilities",
    component: ShieldBadge,
  },
  {
    id: "stage-02",
    key: "IRON_ADDICT",
    stage: "02",
    title: "CONSISTENCY STREAK",
    subtitle: "7-Day consecutive daily workout habit",
    requirement: "Visit platform 7 consecutive days",
    actionLabel: "Daily Motivation",
    actionHref: "/quotes",
    component: StreakBadge,
  },
  {
    id: "stage-03",
    key: "IRON_HABIT",
    stage: "03",
    title: "WORKOUT PRACTITIONER",
    subtitle: "Establish structured training splits",
    requirement: "Complete first training routine",
    actionLabel: "Workout Splits",
    actionHref: "/workouts",
    component: DumbbellBadge,
  },
  {
    id: "stage-04",
    key: "DIET_TACTICIAN",
    stage: "04",
    title: "NUTRITION PROTOCOL",
    subtitle: "Personalized calorie and macro targets",
    requirement: "Generate customized meal plan",
    actionLabel: "Diet Planner",
    actionHref: "/fuel",
    component: NutritionBadge,
  },
  {
    id: "stage-05",
    key: "CALCULATOR_ELITE",
    stage: "05",
    title: "FITNESS METRICS",
    subtitle: "Calculate 1RM strength and body composition",
    requirement: "Execute fitness calculation suite",
    actionLabel: "Open Calculators",
    actionHref: "/calculators",
    component: MetricsBadge,
  },
  {
    id: "stage-06",
    key: "GRAND_MASTER",
    stage: "06",
    title: "CONSISTENCY CHAMPION",
    subtitle: "Master all platform training disciplines",
    requirement: "Unlock all member milestones",
    actionLabel: "Membership Passes",
    actionHref: "/pricing",
    component: LegendBadge,
  },
];

export default function TrophyRoom(props: { isModal?: boolean; isPage?: boolean; onClose?: () => void } = {}) {
  void props;
  const { medals, visitStreak } = useGamification();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 22, stiffness: 220, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const isMilestoneUnlocked = useCallback((key: string): boolean => {
    if (key === "ROOKIE_RECRUIT") return medals.includes("ROOKIE_RECRUIT");
    if (key === "IRON_ADDICT") return medals.includes("IRON_ADDICT") || visitStreak >= 7;
    if (key === "DIET_TACTICIAN") return medals.includes("DIET_TACTICIAN");
    if (key === "CALCULATOR_ELITE") return medals.includes("CALCULATOR_ELITE");
    if (key === "IRON_HABIT") return medals.length >= 2;
    if (key === "GRAND_MASTER") return medals.length >= 4;
    return false;
  }, [medals, visitStreak]);

  const unlockedCount = useMemo(() => {
    return FLOWING_MILESTONES.filter((m) => isMilestoneUnlocked(m.key)).length;
  }, [isMilestoneUnlocked]);

  const completionPct = Math.round((unlockedCount / FLOWING_MILESTONES.length) * 100);

  const activeMilestone = hoveredIndex !== null ? FLOWING_MILESTONES[hoveredIndex] : null;
  const isHoveredUnlocked = activeMilestone ? isMilestoneUnlocked(activeMilestone.key) : false;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
      className="relative w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 select-none overflow-hidden"
    >
      {/* Top Display Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-14 gap-6 pb-8 border-b border-surface-border/70">
        <div>
          <span className="text-xs uppercase tracking-widest text-accent mb-2 block font-semibold">
            FITNESS AWARDS &amp; BADGES
          </span>
          <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl text-hi leading-[0.95] tracking-tight uppercase">
            AWARDS &amp; <span className="text-accent">TROPHIES</span>
          </h1>
        </div>

        {/* Live Discipline Stats Bar */}
        <div className="flex items-center gap-6 sm:gap-10 border-l-2 border-surface-border pl-6">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-mid block font-semibold">ACTIVE DAYS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-hi tracking-tight tabular-nums">
              {visitStreak} <span className="text-xs font-normal text-mid">Days</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-mid block font-semibold">BADGES EARNED</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-accent tracking-tight tabular-nums">
              {unlockedCount}/{FLOWING_MILESTONES.length}
            </span>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-mid block font-semibold">PROGRESS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-hi tracking-tight tabular-nums">
              {completionPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Clean iOS Activity List Rows */}
      <div className="space-y-1 relative">
        {FLOWING_MILESTONES.map((item, index) => {
          const isUnlocked = isMilestoneUnlocked(item.key);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredIndex(index)}
              className="group relative w-full py-4 sm:py-5 md:py-6 flex items-center justify-between border-b border-surface-border/60 text-left transition-colors cursor-pointer"
            >
              {/* Row Left: Stage Number + Refined Editorial Title */}
              <div className="flex items-center gap-4 sm:gap-6 md:gap-8 min-w-0 pr-4">
                <span className="text-xs sm:text-sm text-mid group-hover:text-accent transition-colors flex-shrink-0 font-medium">
                  {item.stage}
                </span>

                <div className="truncate min-w-0">
                  <span
                    className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight uppercase transition-all duration-150 block truncate ${
                      isHovered
                        ? "text-accent translate-x-2"
                        : isUnlocked
                        ? "text-hi group-hover:text-accent"
                        : "text-low group-hover:text-mid"
                    }`}
                  >
                    {item.title}
                  </span>
                  
                  <span className="text-xs sm:text-sm text-mid group-hover:text-hi transition-colors mt-0.5 block truncate">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              {/* Row Right: Status Pill & Action Arrow */}
              <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 shadow-xs">
                    <Check className="w-3.5 h-3.5" /> Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-soft text-low border border-surface-border shadow-xs">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}

                <Link
                  href={item.actionHref}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid group-hover:text-hi group-hover:border-accent active:scale-90 transition-all shadow-sm"
                  aria-label={item.actionLabel}
                  title={item.actionLabel}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Animated Emblem Preview (iOS Frosted Glass) */}
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
        }}
        className={`pointer-events-none fixed z-50 hidden lg:flex flex-col items-center p-6 rounded-3xl bg-surface-canvas/90 backdrop-blur-2xl border border-surface-border shadow-2xl w-80 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${
          hoveredIndex !== null ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {activeMilestone && (
          <div className="w-full space-y-4 text-center">
            {/* Animated Vector Emblem */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-soft border border-surface-border flex items-center justify-center shadow-xs">
              <activeMilestone.component unlocked={isHoveredUnlocked} />
            </div>

            {/* Stage Title */}
            <div>
              <span className="text-[11px] uppercase tracking-widest text-accent block font-semibold">
                MILESTONE {activeMilestone.stage}
              </span>
              <span className="text-xl font-bold tracking-tight text-hi uppercase block mt-0.5">
                {activeMilestone.title}
              </span>
            </div>

            {/* Requirement */}
            <div className="p-3 rounded-2xl bg-surface-card border border-surface-border text-xs text-mid text-left shadow-xs">
              <span className="block text-[10px] uppercase font-semibold text-low mb-1">
                Requirement
              </span>
              <span className="text-hi font-medium">{activeMilestone.requirement}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
