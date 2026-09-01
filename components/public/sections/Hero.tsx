"use client";

import React, { useState, useEffect } from "react";
import { Clock, ArrowUpRight, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// React Bits Components
import ClickSpark from "@/components/ui/animations/ClickSpark";
import RotatingText from "@/components/ui/text/RotatingText";
import BlurText from "@/components/ui/text/BlurText";

const LAKHNADON_INSIGHTS = [
  {
    tag: "TRAINING PHILOSOPHY",
    text: "Built on heavy calibrated iron, dedicated women's training hours, and science-backed progressive overload with zero admission fees.",
  },
  {
    tag: "COMMUNITY & CULTURE",
    text: "Lakhnadon's benchmark fitness facility engineered for real strength gains, athletic conditioning, and an authentic brotherhood of lifters.",
  },
  {
    tag: "COACHING EXCELLENCE",
    text: "From beginners mastering their first barbell lift to advanced lifters chasing heavy PRs — certified coaches guide every single set with precision.",
  },
  {
    tag: "PURE DISCIPLINE",
    text: "Zero gimmicks and zero hidden costs. Just high-grade machinery, structured batch schedules, and custom nutrition designed for lasting results.",
  },
  {
    tag: "FOUNDERS' VISION",
    text: "A premier strength training floor established by Aman & Pradeep Shrivastava, cultivating daily consistency and physical power in Lakhnadon.",
  },
];

export default function Hero() {
  const [insightIndex, setInsightIndex] = useState(0);

  // Pick random on mount and cycle smoothly every 7.5 seconds
  useEffect(() => {
    const initialIndex = Math.floor(Math.random() * LAKHNADON_INSIGHTS.length);
    setInsightIndex(initialIndex);

    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % LAKHNADON_INSIGHTS.length);
    }, 7500);

    return () => clearInterval(interval);
  }, []);

  const handleNextInsight = () => {
    setInsightIndex((prev) => (prev + 1) % LAKHNADON_INSIGHTS.length);
  };

  const currentInsight = LAKHNADON_INSIGHTS[insightIndex];

  return (
    <ClickSpark sparkColor="rgba(215, 25, 33, 0.75)" sparkCount={7} sparkRadius={18}>
      <section className="relative flex flex-col justify-start overflow-hidden pt-4 pb-10 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20 bg-surface-canvas text-hi select-none">
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
          
          {/* Prominent Brand Headline (Moved Upper) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 sm:space-y-4 mb-4 sm:mb-6"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-hi leading-[0.95]">
              BROTHER&apos;S <span className="text-accent">FITNESS</span>
            </h1>

            <div className="text-xl sm:text-3xl md:text-4xl font-semibold text-hi/90 tracking-tight leading-snug flex flex-wrap items-center gap-x-2.5">
              <span>Lakhnadon&apos;s Premier Center for</span>
              <RotatingText
                texts={[
                  "Strength Training",
                  "Personal Coaching",
                  "Women's Batches",
                  "Custom Nutrition",
                ]}
                rotationInterval={2800}
              />
            </div>
          </motion.div>

          {/* Subtitle: BlurText */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-mid max-w-3xl leading-relaxed mb-6 sm:mb-8"
          >
            <BlurText
              text="Founded by Aman & Pradeep Shrivastava in Lakhnadon, Madhya Pradesh. Built with elite heavy machinery, certified coaching, and dedicated training batches with zero admission fees."
              delay={16}
            />
          </motion.div>

          {/* iOS Shaped Buttons with Tactile Physics */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 sm:gap-5 mb-8 sm:mb-12"
          >
            <a
              href="#splits"
              className="inline-flex items-center justify-center gap-2 px-7 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white bg-accent rounded-full shadow-sm hover:brightness-110 active:scale-[0.97] transition-all duration-150"
              style={{ textDecoration: "none" }}
            >
              <span>Join The Gym</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <Link
              href="#timings"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-hi bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-surface-border/90 rounded-full active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              <Clock className="w-4 h-4 text-accent" />
              <span>View Operating Hours</span>
            </Link>
          </motion.div>

          {/* Unique Dynamic Lakhnadon Insight Box (Changes Periodically / Randomly) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="w-full max-w-3xl"
          >
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-card/70 border border-surface-border/80 backdrop-blur-xs shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-surface-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-accent uppercase">
                    {currentInsight.tag}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextInsight}
                  className="p-1 rounded-full text-mid hover:text-hi hover:bg-surface-elevated transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  title="Switch insight"
                  aria-label="Next fitness insight"
                >
                  <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>

              <div className="pt-3 min-h-[58px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={insightIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs sm:text-sm text-hi/90 font-medium leading-relaxed"
                  >
                    &ldquo;{currentInsight.text}&rdquo;
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </ClickSpark>
  );
}