"use client";

import { useState, useEffect } from "react";
import HeroLoopManager from "./HeroLoopManager";
import QuoteCycler from "./QuoteCycler";
import PulseDot from "@/components/animations/PulseDot";
import BarGrowStats from "@/components/animations/BarGrowStats";

const YEARS_ACTIVE = new Date().getFullYear() - 2026;

export default function Hero() {
  const [memberCount, setMemberCount] = useState(0);
  const [grainOpacity, setGrainOpacity] = useState(0.07);

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
    <section className="relative min-h-[90svh] md:min-h-[100svh] flex flex-col items-center justify-center overflow-hidden py-4 md:py-0 bg-[#0a0a0a] text-white">
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

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-4 text-center mt-12 md:mt-0">
        <p className="label-text mb-2 text-faint" style={{ color: '#888888', fontSize: '10px' }}>
          BHOPAL · GYM &amp; FITNESS
        </p>

        <div className="mb-2 md:mb-3 transform scale-90 md:scale-100">
          <HeroLoopManager />
        </div>

        <div className="mb-3 transform scale-90 md:scale-100">
          <QuoteCycler />
        </div>

        {/* Member Count Badge */}
        <div className="mb-4 md:mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <PulseDot />
          <span className="label-text" style={{ color: '#cccccc' }}>
            <span className="font-display" style={{ color: '#ffffff' }}>{memberCount}</span> Active Members
          </span>
        </div>

        {/* Animated stat bars: member count + years active */}
        <div className="mb-4 md:mb-5 w-full max-w-[260px] transform scale-95 md:scale-100">
          <BarGrowStats
            items={[
              { label: "Members", value: memberCount, max: Math.max(memberCount, 150), display: `${memberCount}`, rightLabel: "∞" },
              { label: "Years Active", value: YEARS_ACTIVE, max: 5, display: `${YEARS_ACTIVE} yrs`, rightLabel: "∞" },
            ]}
          />
        </div>

        <div className="mt-2">
          <a
            href="#protocol"
            className="inline-block btn-primary group relative overflow-hidden px-6 py-2.5 text-sm"
            style={{ textDecoration: "none" }}
          >
            <span className="relative z-10">Start Training</span>
            <span className="absolute inset-0 bg-white/10 translate-x-full transition-transform duration-200 ease-clickhouse group-hover:translate-x-0" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}