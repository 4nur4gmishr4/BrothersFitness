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

// --- UNIQUE ANIMATED SVG EMBLEMS (0 EMOJIS, 0 GENERIC LOGOS) ---

// 1. Shield Star (Initiation)
const AnimatedShieldStar = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <motion.path
      d="M24 4L38 10V22C38 31.5 32 39.5 24 44C16 39.5 10 31.5 10 22V10L24 4Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
    <motion.circle
      cx="24"
      cy="23"
      r="4.5"
      fill="currentColor"
      animate={unlocked ? { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] } : {}}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      className={unlocked ? "text-accent" : "text-mid/30"}
    />
  </svg>
);

// 2. Flame Aura (Consistency Streak)
const AnimatedFlameAura = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <motion.path
      d="M24 6C24 6 15 16 15 27C15 32.5 19 37 24 37C29 37 33 32.5 33 27C33 21 28 17 28 17C28 17 29 23 26 25C23 27 21 24 21 22C21 16 24 6 24 6Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={unlocked ? "rgba(215, 25, 33, 0.15)" : "transparent"}
      animate={
        unlocked
          ? {
              d: [
                "M24 6C24 6 15 16 15 27C15 32.5 19 37 24 37C29 37 33 32.5 33 27C33 21 28 17 28 17C28 17 29 23 26 25C23 27 21 24 21 22C21 16 24 6 24 6Z",
                "M24 4C24 4 14 15 14 26C14 32.5 18.5 38 24 38C29.5 38 34 32.5 34 26C34 19 28 16 28 16C28 16 30 22 27 25C24 28 20 24 20 21C20 14 24 4 24 4Z",
                "M24 6C24 6 15 16 15 27C15 32.5 19 37 24 37C29 37 33 32.5 33 27C33 21 28 17 28 17C28 17 29 23 26 25C23 27 21 24 21 22C21 16 24 6 24 6Z",
              ],
            }
          : {}
      }
      transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
  </svg>
);

// 3. Precision Concentric Barbell (Iron Discipline)
const AnimatedIronBarbell = ({ unlocked }: { unlocked: boolean }) => (
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
    <motion.rect
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
    <motion.rect
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
    <motion.circle
      cx="24"
      cy="24"
      r="9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      animate={unlocked ? { rotate: 360 } : {}}
      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      className={unlocked ? "text-accent" : "text-mid/20"}
    />
  </svg>
);

// 4. Metabolic Atom Orbit (Macro Protocol)
const AnimatedMetabolicOrbit = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <motion.ellipse
      cx="24"
      cy="24"
      rx="16"
      ry="6"
      stroke="currentColor"
      strokeWidth="1.5"
      animate={unlocked ? { rotate: [0, 180, 360] } : {}}
      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
      className={unlocked ? "text-accent" : "text-mid/30"}
    />
    <motion.ellipse
      cx="24"
      cy="24"
      rx="16"
      ry="6"
      transform="rotate(60 24 24)"
      stroke="currentColor"
      strokeWidth="1.5"
      animate={unlocked ? { rotate: [60, 240, 420] } : {}}
      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
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

// 5. Precision Caliper Gauge (Analytical Edge)
const AnimatedPrecisionGauge = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <path
      d="M10 32C10 24.268 16.268 18 24 18C31.732 18 38 24.268 38 32"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={unlocked ? "text-hi" : "text-mid/40"}
    />
    <motion.line
      x1="24"
      y1="32"
      x2="32"
      y2="22"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      animate={unlocked ? { rotate: [-20, 25, -20] } : {}}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      style={{ originX: "24px", originY: "32px" }}
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

// 6. Architectural Crown Diamond (Brotherhood Legend)
const AnimatedCrownDiamond = ({ unlocked }: { unlocked: boolean }) => (
  <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
    <motion.path
      d="M10 18L16 34H32L38 18L29 24L24 12L19 24L10 18Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={unlocked ? "rgba(215, 25, 33, 0.12)" : "transparent"}
      className={unlocked ? "text-accent" : "text-mid/40"}
    />
    <motion.circle cx="24" cy="12" r="2" fill="currentColor" className={unlocked ? "text-hi" : "text-mid/30"} />
    <motion.circle cx="10" cy="18" r="2" fill="currentColor" className={unlocked ? "text-hi" : "text-mid/30"} />
    <motion.circle cx="38" cy="18" r="2" fill="currentColor" className={unlocked ? "text-hi" : "text-mid/30"} />
  </svg>
);

interface MilestoneItem {
  id: string;
  key: string;
  stage: string;
  title: string;
  subtitle: string;
  requirement: string;
  xp: number;
  actionLabel: string;
  actionHref: string;
  component: React.ComponentType<{ unlocked: boolean }>;
}

const FLOWING_MILESTONES: MilestoneItem[] = [
  {
    id: "stage-01",
    key: "ROOKIE_RECRUIT",
    stage: "01",
    title: "INITIATION",
    subtitle: "Welcome to Brother's Fitness platform",
    requirement: "First portal activation & registration",
    xp: 50,
    actionLabel: "View Facilities",
    actionHref: "/#facilities",
    component: AnimatedShieldStar,
  },
  {
    id: "stage-02",
    key: "IRON_ADDICT",
    stage: "02",
    title: "CONSISTENCY STREAK",
    subtitle: "7-Day consecutive daily discipline",
    requirement: "Visit platform 7 consecutive days",
    xp: 150,
    actionLabel: "Daily Motivation",
    actionHref: "/quotes",
    component: AnimatedFlameAura,
  },
  {
    id: "stage-03",
    key: "IRON_HABIT",
    stage: "03",
    title: "IRON DISCIPLINE",
    subtitle: "Establish core resistance training habit",
    requirement: "Complete first training split routine",
    xp: 200,
    actionLabel: "Workout Splits",
    actionHref: "/workouts",
    component: AnimatedIronBarbell,
  },
  {
    id: "stage-04",
    key: "DIET_TACTICIAN",
    stage: "04",
    title: "MACRO PROTOCOL",
    subtitle: "Calculate personalized fuel & protein targets",
    requirement: "Generate customized nutrition strategy",
    xp: 150,
    actionLabel: "Diet Planner",
    actionHref: "/fuel",
    component: AnimatedMetabolicOrbit,
  },
  {
    id: "stage-05",
    key: "CALCULATOR_ELITE",
    stage: "05",
    title: "ANALYTICAL EDGE",
    subtitle: "Master 1RM strength & body composition metrics",
    requirement: "Execute fitness calculation suite",
    xp: 150,
    actionLabel: "Open Calculators",
    actionHref: "/calculators",
    component: AnimatedPrecisionGauge,
  },
  {
    id: "stage-06",
    key: "GRAND_MASTER",
    stage: "06",
    title: "BROTHERHOOD LEGEND",
    subtitle: "Complete all prerequisite disciplines",
    requirement: "Unlock 100% of platform achievements",
    xp: 500,
    actionLabel: "Membership Passes",
    actionHref: "/pricing",
    component: AnimatedCrownDiamond,
  },
];

export default function TrophyRoom(props: { isModal?: boolean; isPage?: boolean; onClose?: () => void } = {}) {
  void props;
  const { medals, visitStreak } = useGamification();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth spring mouse tracking for floating preview card (FlowingMenu)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
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

  const totalXP = useMemo(() => {
    return FLOWING_MILESTONES.reduce((acc, m) => {
      return isMilestoneUnlocked(m.key) ? acc + m.xp : acc;
    }, 0);
  }, [isMilestoneUnlocked]);

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
          <span className="text-xs font-mono uppercase tracking-widest text-accent mb-2 block font-semibold">
            ATHLETE PROGRESSION &amp; ACHIEVEMENTS
          </span>
          <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl text-hi leading-[0.95] tracking-tight uppercase">
            TROPHY <span className="text-accent">ROOM</span>
          </h1>
        </div>

        {/* Live Discipline Stats Bar */}
        <div className="flex items-center gap-6 sm:gap-10 border-l-2 border-surface-border pl-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid block">STREAK</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-hi tracking-tight">
              {visitStreak} <span className="text-xs font-normal text-mid">Days</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid block">EXPERIENCE</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-accent tracking-tight">
              {totalXP} <span className="text-xs font-normal text-mid">XP</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-mid block">STATUS</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-hi tracking-tight">
              {unlockedCount}/{FLOWING_MILESTONES.length}
            </span>
          </div>
        </div>
      </div>

      {/* React Bits FlowingMenu Editorial Rows with Balanced Typography */}
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
                <span className="text-xs sm:text-sm font-mono text-mid group-hover:text-accent transition-colors flex-shrink-0">
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

              {/* Row Right: XP Badge & Status Pill & Action Arrow */}
              <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                <span className="hidden sm:inline-block text-xs font-mono font-semibold px-3 py-1 rounded-full bg-surface-soft border border-surface-border text-mid">
                  +{item.xp} XP
                </span>

                {isUnlocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 shadow-sm">
                    <Check className="w-3.5 h-3.5" /> Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-soft text-low border border-surface-border shadow-sm">
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

      {/* Floating Animated Emblem Card (React Bits FlowingMenu Preview) */}
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
        }}
        className={`pointer-events-none fixed z-50 hidden lg:flex flex-col items-center p-6 rounded-3xl bg-surface-canvas/95 backdrop-blur-xl border border-surface-border/80 shadow-2xl w-80 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${
          hoveredIndex !== null ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {activeMilestone && (
          <div className="w-full space-y-4 text-center">
            {/* Animated Vector Emblem */}
            <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-soft/80 border border-surface-border flex items-center justify-center shadow-inner">
              <activeMilestone.component unlocked={isHoveredUnlocked} />
            </div>

            {/* Stage Title & XP */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent block font-semibold">
                STAGE {activeMilestone.stage} &bull; +{activeMilestone.xp} XP
              </span>
              <span className="text-xl font-bold tracking-tight text-hi uppercase block mt-0.5">
                {activeMilestone.title}
              </span>
            </div>

            {/* Requirement */}
            <div className="p-3 rounded-xl bg-surface-card/80 border border-surface-border text-xs text-mid text-left">
              <span className="font-semibold text-hi block mb-0.5">Requirement:</span>
              {activeMilestone.requirement}
            </div>

            {/* Status Pill */}
            <div className="pt-1">
              {isHoveredUnlocked ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/30">
                  <Check className="w-3.5 h-3.5" /> Milestone Achieved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-surface-soft text-low border border-surface-border">
                  <Lock className="w-3.5 h-3.5" /> Stage Incomplete
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>

    </div>
  );
}
