"use client";
import { ArrowRight, Activity, Zap } from "lucide-react";
import Link from "next/link";

export default function AiDietPlannerFlex() {
  return (
    <Link href="/fuel" className="group block relative w-full overflow-hidden rounded-md border border-accent/20 bg-black/40 backdrop-blur-md transition-all hover:border-accent">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="p-4 md:p-6 flex flex-col justify-between h-full relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-accent font-bold">SYS.AI_ACTIVE</span>
          </div>
          <Activity className="w-5 h-5 text-low group-hover:text-hi transition-colors" />
        </div>

        <div>
          <h3 className="font-display text-2xl md:text-3xl text-hi mb-2 tracking-wide">
            AI DIET <br/>
            <span className="text-accent">PLANNER</span>
          </h3>
          <p className="text-sm text-mid mb-4 font-sans line-clamp-2">
            Personalized meal plans built to crush goals. Scanning metrics for optimal zones.
          </p>
          
          <div className="flex items-center gap-2 text-hi font-bold text-sm tracking-widest uppercase group-hover:text-accent transition-colors">
            Initialize
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
