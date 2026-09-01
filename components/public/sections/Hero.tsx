"use client";

import React from "react";
import { Clock, ArrowUpRight, ShieldCheck, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// React Bits Components
import ClickSpark from "@/components/ui/animations/ClickSpark";
import RotatingText from "@/components/ui/text/RotatingText";
import BlurText from "@/components/ui/text/BlurText";

export default function Hero() {
  return (
    <ClickSpark sparkColor="rgba(215, 25, 33, 0.75)" sparkCount={7} sparkRadius={18}>
      <section className="relative min-h-[92dvh] sm:min-h-[calc(100vh-4.5rem)] flex flex-col justify-center overflow-hidden py-14 sm:py-16 lg:py-24 bg-surface-canvas text-hi select-none">
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
          
          {/* Mobile-Only Live Facility Status Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex sm:hidden items-center gap-2 mb-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs font-semibold text-hi shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-mid">Lakhnadon &bull; Open Today 5:30 AM &ndash; 10 PM</span>
            </div>
          </motion.div>

          {/* Prominent Brand Headline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 sm:space-y-5 mb-5 sm:mb-8"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-hi leading-[0.98]">
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
            className="text-sm sm:text-lg md:text-xl text-mid max-w-3xl leading-relaxed mb-7 sm:mb-12"
          >
            <BlurText
              text="Founded by Aman & Pradeep Shrivastava in Lakhnadon, Madhya Pradesh. Built with elite heavy machinery, certified coaching, and dedicated training batches with zero admission fees."
              delay={18}
            />
          </motion.div>

          {/* iOS Shaped Buttons with Tactile Physics */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3 sm:gap-5"
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

          {/* Mobile-Only Tactical Micro Metrics (Unique & High-Value) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="grid grid-cols-3 gap-2.5 pt-8 sm:hidden"
          >
            <div className="p-3 rounded-2xl bg-surface-card/90 border border-surface-border/80 text-left shadow-xs">
              <ShieldCheck className="w-4 h-4 text-accent mb-1.5" />
              <p className="text-[11px] font-bold text-hi leading-tight">Zero Fee</p>
              <p className="text-[9px] text-mid mt-0.5">Free Admission</p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-card/90 border border-surface-border/80 text-left shadow-xs">
              <Clock className="w-4 h-4 text-accent mb-1.5" />
              <p className="text-[11px] font-bold text-hi leading-tight">Women Batch</p>
              <p className="text-[9px] text-mid mt-0.5">11:30 AM &ndash; 1:30 PM</p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-card/90 border border-surface-border/80 text-left shadow-xs">
              <Dumbbell className="w-4 h-4 text-accent mb-1.5" />
              <p className="text-[11px] font-bold text-hi leading-tight">Certified</p>
              <p className="text-[9px] text-mid mt-0.5">1-on-1 Guidance</p>
            </div>
          </motion.div>

        </div>
      </section>
    </ClickSpark>
  );
}