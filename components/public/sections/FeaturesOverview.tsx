"use client";

import Link from "next/link";
import { CSSProperties } from "react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { motion } from "framer-motion";

type FeatureIcon = "calendar" | "dumbbell" | "utensils" | "calculator" | "credit-card" | "chat";

const features: { icon: FeatureIcon; title: string; desc: string; link: string; spec: string }[] = [
  {
    icon: "calendar",
    title: "OPERATIONAL SCHEDULE",
    desc: "Precision timing modules for daily training sessions.",
    spec: "MIXED // WOMEN ONLY",
    link: "#timings",
  },
  {
    icon: "dumbbell",
    title: "PROTOCOL DATABASE",
    desc: "Extensive video index of hyper-targeted biomechanical movements.",
    spec: "800+ PROTOCOLS",
    link: "/workouts",
  },
  {
    icon: "utensils",
    title: "AI NUTRITION MATRIX",
    desc: "Algorithmic diet generation calibrated for optimal hypertrophy.",
    spec: "MACHINE LEARNING",
    link: "/fuel",
  },
  {
    icon: "calculator",
    title: "DIAGNOSTIC METRICS",
    desc: "Calculate TDEE, BMI, and 1RM thresholds with absolute accuracy.",
    spec: "LIVE CALIBRATION",
    link: "/calculators",
  },
  {
    icon: "credit-card",
    title: "MEMBERSHIP TIERS",
    desc: "Transparent access tiers for maximum facility utilization.",
    spec: "NO HIDDEN FEES",
    link: "/pricing",
  },
  {
    icon: "chat",
    title: "SECURE COMMS",
    desc: "Direct communication channel to our operational headquarters.",
    spec: "24/7 RESPONSE",
    link: "/contact",
  },
];

export default function FeaturesOverview() {
  return (
    <section className="surface-canvas py-16 md:py-24 border-y border-surface-border relative overflow-hidden">
      
      {/* Decorative background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(var(--hi) 1px, transparent 1px), linear-gradient(90deg, var(--hi) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10">
        
        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          
          {/* LEFT: Technical Header */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-[35%] p-8 md:p-10 border border-surface-border bg-surface-card rounded-none flex flex-col justify-between shrink-0"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-accent animate-pulse" />
                <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase font-bold">SYSTEM CAPABILITIES</p>
              </div>
              
              <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.9] mb-6 uppercase">
                TECHNICAL<br/><span className="text-accent">INFRASTRUCTURE</span>
              </h2>
              
              <p className="text-mid md:text-base font-mono text-xs leading-relaxed max-w-sm mb-12 uppercase tracking-wide opacity-80">
                Brother&apos;s Fitness provides a unified digital ecosystem to track, calibrate, and optimize your physical transformation. No generic tools. Only precision engineering.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="h-[1px] w-full bg-surface-border/50" />
              <Link href="#timings" className="group">
                <div className="inline-flex items-center justify-between w-full p-4 border border-surface-border bg-surface-elevated hover:border-accent transition-colors duration-300">
                  <span className="font-mono text-[11px] tracking-widest text-hi uppercase group-hover:text-accent transition-colors">INITIALIZE PROTOCOL</span>
                  <AnimatedIcon name="dumbbell" className="w-5 h-5 text-accent" label="Start" />
                </div>
              </Link>
            </div>
          </motion.div>

          {/* RIGHT: Grid of Modules */}
          <div className="w-full lg:w-[65%] grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 flex-grow">
            {features.map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group block h-full"
              >
                <Link href={feature.link} className="block h-full">
                  <div className="h-full p-6 border border-surface-border bg-surface-card hover:border-accent hover:bg-surface-elevated transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                    
                    {/* Hover scanner effect */}
                    <div className="absolute inset-y-0 left-0 w-[2px] bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                    
                    <div>
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-10 h-10 border border-surface-border bg-surface-canvas flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                          <AnimatedIcon name={feature.icon} className="w-5 h-5" label={feature.title} />
                        </div>
                        <span className="font-mono text-[9px] tracking-widest text-low uppercase bg-surface-canvas px-2 py-1 border border-surface-border/50">
                          {feature.spec}
                        </span>
                      </div>
                      
                      <h3 className="font-display font-bold text-xl md:text-2xl text-hi mb-3 uppercase tracking-wide group-hover:text-accent transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs font-mono text-mid leading-relaxed uppercase opacity-70">
                        {feature.desc}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-surface-border/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="font-mono text-[9px] tracking-[0.2em] text-accent uppercase">ACCESS MODULE</span>
                      <span className="font-mono text-xs text-accent">→</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
