"use client";

import { useState, useEffect } from "react";
import HeroTypewriter from "./HeroTypewriter";
import { Dumbbell, Activity, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSvgIcon from "@/components/ui/AnimatedSvgIcon";
import Link from "next/link";

export default function Hero() {
  const [memberCount, setMemberCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number; isCurrent?: boolean }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMemberCount = async () => {
      try {
        const res = await fetch("/api/public/member-count", { signal: controller.signal });
        const data = await res.json();
        setMemberCount(data.count);
        if (data.monthlyData && Array.isArray(data.monthlyData)) {
          setMonthlyData(data.monthlyData);
        }
      } catch {
        if (!controller.signal.aborted) {
          setMemberCount(0);
          setMonthlyData([]);
        }
      }
    };
    fetchMemberCount();
    return () => controller.abort();
  }, []);

  // Fallback if data is still loading (4 months quarter)
  const displayBars = monthlyData.length > 0 ? monthlyData : [
    { month: "MAY", count: Math.round(memberCount * 0.7) },
    { month: "JUN", count: Math.round(memberCount * 0.8) },
    { month: "JUL", count: Math.round(memberCount * 0.9) },
    { month: "TODAY", count: memberCount, isCurrent: true }
  ];

  // Highest count for scaling bar heights
  const maxCountInChart = Math.max(...displayBars.map(b => b.count), 1);

  return (
    <section className="relative min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center overflow-hidden py-3 lg:py-3 bg-surface-canvas text-hi">
      
      <div className="relative z-10 w-full max-w-[1600px] h-full flex flex-col justify-center px-3 sm:px-4 md:px-6">
        
        {/* Main 65% / 35% Flex Container for exact stretch */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3 md:gap-5 w-full h-full">
          
          {/* LEFT WIDGET - 65% Width, Boxy Style, Full Vertical Stretch */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-[65%] shrink-0 p-6 md:p-8 border border-surface-border bg-surface-card rounded-none flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3 text-accent">
                  <Dumbbell className="w-8 h-8 md:w-10 md:h-10" />
                  <p className="label-text text-xs tracking-widest text-low uppercase font-mono">
                    EST. 2024 // LAKHNADON
                  </p>
                </div>

                {/* Dumbbell Lottie placed sharply in top right of Left Widget */}
                <div className="hidden sm:block w-20 h-20 md:w-28 md:h-28 opacity-90 pointer-events-none">
                  <AnimatedSvgIcon src="/animatedsvgs/lottie_gym_equipment.svg" className="w-full h-full" themeColor="accent" />
                </div>
              </div>
              
              <div className="mb-4 md:mb-6">
                <HeroTypewriter />
              </div>

              <p className="text-base md:text-lg text-mid max-w-2xl leading-relaxed mb-6 md:mb-8">
                Brothers Fitness is Lakhnadon&apos;s premier strength and conditioning facility. Elite equipment, expert coaching, and a community built on hard work.
              </p>
              
              <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-12">
                <span className="px-2 py-1 md:px-3 md:py-1.5 bg-surface-elevated border border-surface-border text-xs md:text-xs font-mono text-low uppercase tracking-wider">
                  {"/// Hammer Strength Equipped"}
                </span>
                <span className="px-2 py-1 md:px-3 md:py-1.5 bg-surface-elevated border border-surface-border text-xs md:text-xs font-mono text-low uppercase tracking-wider">
                  {"/// Strength Tracking"}
                </span>
                <span className="px-2 py-1 md:px-3 md:py-1.5 bg-surface-elevated border border-surface-border text-xs md:text-xs font-mono text-low uppercase tracking-wider">
                  {"/// Lakhnadon, MP"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-auto">
              <a
                href="#protocol"
                className="inline-block btn-primary group relative overflow-hidden px-8 py-3 md:py-4 text-sm tracking-widest uppercase font-bold rounded-none flex-shrink-0"
                style={{ textDecoration: "none" }}
              >
                <span className="relative z-10">Join The Gym</span>
                <span className="absolute inset-0 bg-white/10 translate-x-full transition-transform duration-200 ease-clickhouse group-hover:translate-x-0" aria-hidden="true" />
              </a>
              

            </div>
          </motion.div>

          {/* RIGHT SECTION - 35% Width, Two Stacked Boxy Widgets */}
          <div className="w-full lg:w-[35%] flex flex-col gap-3 md:gap-5 justify-between flex-grow">
            
            {/* Top Right Widget - Active Members (Lakhnadon Branch) - 1000/1000 Precision Analytics */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="p-5 md:p-6 border border-surface-border bg-surface-card rounded-none flex flex-col justify-between gap-4 h-full flex-1 relative group overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs tracking-widest uppercase text-low font-mono">Lakhnadon Branch</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-hi">{memberCount}</span>
                    <span className="text-sm text-mid">Active Members</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent font-mono text-xs uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Real-Time Feed
                  </span>
                  <span className="text-xs font-mono text-faint">UPDATED TODAY</span>
                </div>
              </div>

              {/* 1000/1000 Premium Vertical Bar Chart */}
              <div className="w-full flex-1 flex flex-col justify-end pt-4 pb-1 z-10 relative mt-4">
                {/* Y-Axis Guidelines & Grid Container */}
                <div className="w-full h-full relative flex flex-col justify-between">
                  
                  {/* Grid Guidelines */}
                  <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                    <div className="border-b border-dashed border-hi w-full" />
                    <div className="border-b border-dashed border-hi w-full" />
                    <div className="border-b border-dashed border-hi w-full" />
                    <div className="border-b border-dashed border-hi w-full" />
                  </div>

                  {/* Bars Container */}
                  <div className="w-full h-full min-h-[160px] flex items-end justify-between gap-3 md:gap-5 px-2 z-10 border-b border-surface-border/80 pb-1">
                    {displayBars.map((item, idx) => {
                      const heightPct = Math.min((item.count / (maxCountInChart || 1)) * 100, 100);
                      const isToday = item.isCurrent || item.month === "TODAY";

                      return (
                        <div key={item.month} className="flex-1 h-full flex flex-col items-center justify-end group/bar relative">
                          {/* Number printed above bar */}
                          <span className={`text-xs font-mono mb-1 text-accent font-bold transition-transform ${isToday ? "scale-110" : "group-hover/bar:scale-110"}`}>
                            {item.count}
                          </span>

                          {/* Vertical Bar Column */}
                          <div className="w-full max-w-[36px] h-full flex items-end bg-surface-canvas/60 border border-surface-border/80 overflow-hidden relative">
                            
                            {/* Bar Fill with Red Gradient */}
                            <motion.div
                              className={`w-full relative bg-gradient-to-t from-accent/50 via-accent/80 to-accent ${
                                isToday ? "shadow-[0_0_12px_rgba(215,25,33,0.6)] brightness-110" : "opacity-85 group-hover/bar:opacity-100"
                              }`}
                              initial={{ height: "0%" }}
                              animate={{ height: `${Math.max(heightPct, 8)}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {/* Glowing Top Cap */}
                              <div className="w-full h-[2px] bg-white/90" />
                            </motion.div>
                          </div>

                          {/* Month Label */}
                          <span className={`text-xs font-mono mt-2 tracking-wider uppercase transition-colors ${
                            isToday ? "text-accent font-bold" : "text-low group-hover/bar:text-hi"
                          }`}>
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom Right Widget - AI Diet Generator */}
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className="p-5 md:p-6 border border-surface-border bg-surface-card rounded-none flex items-center justify-between gap-4 shrink-0 group hover:border-accent transition-colors duration-300 relative overflow-hidden"
            >
               <div className="z-10 flex flex-col items-start gap-1 max-w-[60%]">
                 <h3 className="text-lg font-display font-bold text-hi leading-tight">AI Diet Generator</h3>
                 <p className="text-xs md:text-xs text-mid leading-relaxed mb-1">Personalized nutrition plan strictly calibrated to your goals.</p>
                 <Link href="/fuel" className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-accent font-bold group-hover:text-hi transition-colors">
                   Generate Protocol <ChevronRight className="w-3.5 h-3.5" />
                 </Link>
               </div>
               
               {/* Maximized Lottie on Right */}
               <div className="z-10 w-20 h-20 md:w-24 md:h-24 rounded-none bg-surface-elevated border border-surface-border flex items-center justify-center shrink-0 ml-auto mr-0 md:mr-2 relative">
                 {/* Decorative scanner line */}
                 <div className="absolute inset-x-0 top-0 h-[1px] bg-accent/30 overflow-hidden pointer-events-none">
                   <motion.div 
                      className="h-full bg-accent w-1/3"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   />
                 </div>
                 <div className="w-16 h-16 md:w-20 md:h-20 opacity-90 group-hover:scale-110 transition-transform duration-300">
                   <AnimatedSvgIcon src="/animatedsvgs/lottie_meal_plate.svg" className="w-full h-full" themeColor="accent" />
                 </div>
               </div>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}