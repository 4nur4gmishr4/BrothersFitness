"use client";

import React from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// React Bits Components
import ClickSpark from "@/components/ui/animations/ClickSpark";
import RotatingText from "@/components/ui/text/RotatingText";
import BlurText from "@/components/ui/text/BlurText";

const FACILITY_HIGHLIGHTS = [
  {
    num: "01",
    label: "MACHINERY",
    title: "Heavy Calibrated Iron",
    desc: "Elite plate-loaded & cable bio-mechanics",
  },
  {
    num: "02",
    label: "TIMINGS",
    title: "5:30 AM – 10:00 PM",
    desc: "Structured morning & evening shifts",
  },
  {
    num: "03",
    label: "BATCH PRIVACY",
    title: "Dedicated Women's Hours",
    desc: "11:30 AM – 1:30 PM exclusive training",
  },
  {
    num: "04",
    label: "MEMBERSHIP",
    title: "₹0 Admission Fee",
    desc: "Zero hidden costs, transparent plans",
  },
];

export default function Hero() {
  return (
    <ClickSpark sparkColor="rgba(215, 25, 33, 0.75)" sparkCount={7} sparkRadius={18}>
      <section className="relative flex flex-col justify-start overflow-hidden pt-4 pb-10 sm:pt-8 sm:pb-14 lg:pt-12 lg:pb-16 bg-surface-canvas text-hi select-none">
        
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
            className="flex flex-wrap items-center gap-3 sm:gap-5 mb-8 sm:mb-10"
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

          {/* Lakhnadon Athletic Facility Intelligence Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full"
          >
            {FACILITY_HIGHLIGHTS.map((item) => (
              <div
                key={item.num}
                className="p-4 sm:p-5 rounded-2xl bg-surface-card/80 border border-surface-border hover:border-accent/40 transition-colors text-left space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-mid/60">{item.num}</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-hi leading-tight">
                  {item.title}
                </p>
                <p className="text-[11px] text-mid leading-normal">{item.desc}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </section>
    </ClickSpark>
  );
}