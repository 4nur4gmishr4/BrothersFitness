"use client";

import React, { useEffect, useState } from "react";
import { Clock, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// React Bits Components
import ClickSpark from "@/components/ui/animations/ClickSpark";
import RotatingText from "@/components/ui/text/RotatingText";
import BlurText from "@/components/ui/text/BlurText";
import StrokeText from "@/components/ui/text/StrokeText";
import MobileOfferCarousel from "@/components/public/widgets/MobileOfferCarousel";

export default function Hero() {
  // Stage 0: Waiting for preloader curtain to finish (~960ms)
  // Stage 1: Preloader finished -> Draw Big "BROTHER'S FITNESS" headline (~1400ms)
  // Stage 2: Headline finished -> Reveal continuous changing line, description, buttons & carousel
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    // If preloader already finished in this session or on internal client navigation
    if (typeof window !== "undefined" && (window as unknown as { __preloaderDone?: boolean }).__preloaderDone) {
      setStage(2);
      return;
    }

    let headlineTimer: ReturnType<typeof setTimeout> | null = null;

    const onPreloaderDone = () => {
      setStage(1);
      // Wait for StrokeText drawing to finish (~1.4s) before revealing bottom text
      headlineTimer = setTimeout(() => {
        setStage(2);
      }, 1400);
    };

    // Fallback in case event already fired or preloader was skipped
    const fallbackTimer = setTimeout(onPreloaderDone, 980);

    window.addEventListener("preloader-finished", onPreloaderDone, { once: true });
    return () => {
      clearTimeout(fallbackTimer);
      if (headlineTimer) clearTimeout(headlineTimer);
      window.removeEventListener("preloader-finished", onPreloaderDone);
    };
  }, []);

  return (
    <ClickSpark sparkColor="rgba(215, 25, 33, 0.75)" sparkCount={7} sparkRadius={18}>
      <section className="relative flex flex-col justify-start overflow-hidden pt-5 sm:pt-2 lg:pt-3 pb-8 sm:pb-12 lg:pb-14 bg-surface-canvas text-hi">
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto pl-2 pr-4 sm:pl-4 sm:pr-8 md:pl-6 md:pr-12 lg:pl-8 lg:pr-16">
          
          {/* Prominent Brand Headline with Animated Stroke Text */}
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
            <h1 className="sr-only">Brother&apos;s Fitness Lakhnadon</h1>
            
            {/* Stage 1: Prominent Brand Headline: Only mounts/draws AFTER preloader curtain is fully complete */}
            <div className="w-[88%] sm:w-full max-w-full -ml-1 sm:-ml-2 mb-3 sm:mb-1 min-h-[140px] sm:min-h-[190px]">
              {stage >= 1 && (
                <StrokeText
                  lines={["BROTHER'S", "FITNESS"]}
                  lineHeight={1.26}
                  mobileFontSize={124}
                  highlightWord="FITNESS"
                  highlightColor="#D71921"
                  strokeWidth={1.8}
                  drawDuration={1.3}
                  fillDelay={0.12}
                  stagger={0.035}
                  ease="power2.out"
                  trigger="mount"
                  fillMode="wipe"
                  fontSize={100}
                  fontWeight={800}
                  fontFamily="var(--font-syne), 'Syne', sans-serif"
                  letterSpacing={0}
                  align="left"
                  className="w-full"
                />
              )}
            </div>

            {/* Continuous changing line: Strictly on the next line below on mobile (flex-col), side-by-side on laptop (sm:flex-row) */}
            {stage >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-hi/90 tracking-tight leading-snug flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1.5 gap-x-2.5 sm:gap-x-3"
              >
                <span className="text-mid font-medium block">Lakhnadon&apos;s Best Place for</span>
                <div className="block min-h-[1.5em] flex items-center">
                  <RotatingText
                    texts={[
                      "Strength Training",
                      "Personal Coaching",
                      "Dedicated Women's Batches",
                      "Healthy Food Plans",
                      "Heavy Iron Lifting",
                      "Losing Fat & Getting Fit",
                      "Staying Fit & Active",
                      "Muscle Building",
                    ]}
                    rotationInterval={3000}
                    staggerDuration={0.03}
                    transition={{ type: "spring", damping: 25, stiffness: 280 }}
                    mainClassName="text-accent font-bold px-1"
                    splitLevelClassName="overflow-hidden"
                    splitBy="words"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-120%", opacity: 0 }}
                    auto={true}
                    loop={true}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Stage 2 Content: Reveals cleanly AFTER big headline finishes drawing */}
          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              {/* Subtitle: Unique, simple & engaging description with slow cinematic reveal */}
              <div className="text-sm sm:text-base md:text-lg text-mid max-w-4xl lg:max-w-5xl leading-relaxed mb-4 sm:mb-6">
                <BlurText
                  text="Built from the ground up by Coach Aman and Coach Pradeep right here in Lakhnadon. Whether you are lifting your very first dumbbell or pushing for a new personal record, this is your home for real, honest strength. We cut through the noise with certified hands-on guidance, heavy-duty iron, dedicated women's training hours, and a supportive brotherhood, zero admission fees, no confusing fitness myths, and no hidden catches. Just real work, real coaches, and real progress every single day."
                  delay={32}
                />
              </div>

              {/* iOS Shaped Buttons with Tactile Physics */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
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
                  <span>Check Gym Timings</span>
                </Link>
              </div>

              {/* 3D Billboard Carousel: Showcasing Free Gym Trial, Free AI Generator & Workout Library */}
              <div
                id="featured-offer-carousel"
                className="block mt-8 sm:mt-12 w-full mx-auto overflow-hidden py-1 flex flex-col items-center justify-center"
              >
                <MobileOfferCarousel />
              </div>
            </motion.div>
          )}

        </div>
      </section>
    </ClickSpark>
  );
}