"use client";

import { useState, useEffect } from "react";
import HeroLoopManager from "./HeroLoopManager";
import PulseDot from "@/components/animations/PulseDot";
import BarGrowStats from "@/components/animations/BarGrowStats";
import AiDietPlannerFlex from "./AiDietPlannerFlex";
import { Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

const YEARS_ACTIVE = new Date().getFullYear() - 2024;

export default function Hero() {
  const [memberCount, setMemberCount] = useState(0);
  const [grainOpacity, setGrainOpacity] = useState(0.07);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // H5 fix: AbortController prevents setState after unmount on quick navigation.
  useEffect(() => {
    const controller = new AbortController();
    const fetchMemberCount = async () => {
      try {
        const res = await fetch("/api/public/member-count", { signal: controller.signal });
        const data = await res.json();
        setMemberCount(data.count);
      } catch {
        if (!controller.signal.aborted) setMemberCount(0);
      }
    };
    fetchMemberCount();
    return () => controller.abort();
  }, []);

  // Handle grain fade out on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const fadeStart = 50;
      const fadeEnd = 300;
      if (scrollY <= fadeStart) {
        setGrainOpacity(0.07);
      } else if (scrollY >= fadeEnd) {
        setGrainOpacity(0);
      } else {
        const progress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
        setGrainOpacity(0.07 * (1 - progress));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-[90svh] md:min-h-[100svh] flex flex-col items-center justify-center overflow-hidden py-4 md:py-0 bg-surface-canvas text-hi">
      {/* Scroll-fading grain overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-75"
        style={{
          opacity: grainOpacity,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'grain\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23grain)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px'
        }}
      />

      <div className="relative z-10 w-full max-w-7xl px-4 md:px-8 mt-16 md:mt-0">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SECTION - Brand & Typewriter */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6 text-accent"
            >
              <Dumbbell className="w-8 h-8 md:w-12 md:h-12" />
              <p className="label-text text-[10px] tracking-widest text-low uppercase">
                EST. 2024 // BHOPAL
              </p>
            </motion.div>
            
            <div className="mb-8">
              <HeroLoopManager />
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.5 }}
            >
              <a
                href="#protocol"
                className="inline-block btn-primary group relative overflow-hidden px-8 py-3 text-sm tracking-widest uppercase font-bold"
                style={{ textDecoration: "none" }}
              >
                <span className="relative z-10">Initialize Training</span>
                <span className="absolute inset-0 bg-white/10 translate-x-full transition-transform duration-200 ease-clickhouse group-hover:translate-x-0" aria-hidden="true" />
              </a>
            </motion.div>
          </div>

          {/* RIGHT SECTION - Metrics & AI Widget */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Top Right - Metrics */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="p-6 border border-surface-border bg-surface-card rounded-md flex flex-col gap-6"
            >
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full text-xs w-max bg-[#1a1a1a] border border-[#2a2a2a]">
                <PulseDot />
                <span className="label-text text-mid">
                  <span className="font-display text-hi text-sm">{memberCount}</span> Active Members
                </span>
              </div>

              <div className="w-full">
                <BarGrowStats
                  items={[
                    { label: "Members", value: memberCount, max: Math.max(memberCount, 150), display: `${memberCount}`, rightLabel: "∞" },
                    { label: "Years Active", value: YEARS_ACTIVE, max: 5, display: `${YEARS_ACTIVE} yrs`, rightLabel: "∞" },
                  ]}
                />
              </div>
            </motion.div>

            {/* Bottom Right - AI Diet Planner Flex */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.4 }}
            >
               <AiDietPlannerFlex />
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}