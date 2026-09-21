"use client";

import React from "react";
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
  return (
    <ClickSpark sparkColor="rgba(215, 25, 33, 0.75)" sparkCount={7} sparkRadius={18}>
      <section className="relative flex flex-col justify-start overflow-hidden pt-5 sm:pt-2 lg:pt-3 pb-8 sm:pb-12 lg:pb-14 bg-surface-canvas text-hi">
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto pl-2 pr-4 sm:pl-4 sm:pr-8 md:pl-6 md:pr-12 lg:pl-8 lg:pr-16">
          
          {/* Prominent Brand Headline with Animated Stroke Text */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2 sm:space-y-3 mb-3 sm:mb-4"
          >
            <h1 className="sr-only">Brother&apos;s Fitness Lakhnadon</h1>
            {/* Prominent Brand Headline: BROTHER'S on Line 1, FITNESS on Line 2 with Left Alignment & Unified Scale */}
            <div className="w-[88%] sm:w-full max-w-full -ml-1 sm:-ml-2 mb-3 sm:mb-1">
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
            </div>

            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-hi/90 tracking-tight leading-snug flex flex-wrap items-center gap-x-2.5 sm:gap-x-3">
              <span className="text-mid font-medium">Lakhnadon&apos;s Best Place for</span>
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

          {/* Subtitle: Unique, simple & engaging description with slow cinematic reveal */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-mid max-w-4xl lg:max-w-5xl leading-relaxed mb-4 sm:mb-6"
          >
            <BlurText
              text="Built from the ground up by Coach Aman and Coach Pradeep right here in Lakhnadon. Whether you are lifting your very first dumbbell or pushing for a new personal record, this is your home for real, honest strength. We cut through the noise with certified hands-on guidance, heavy-duty iron, dedicated women's training hours, and a supportive brotherhood, zero admission fees, no confusing fitness myths, and no hidden catches. Just real work, real coaches, and real progress every single day."
              delay={32}
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
              <span>Check Gym Timings</span>
            </Link>
          </motion.div>

          {/* 3D Billboard Carousel: Showcasing Free Gym Trial, Free AI Generator & Workout Library */}
          <div
            id="featured-offer-carousel"
            className="block mt-8 sm:mt-12 -mx-2 sm:mx-0 overflow-hidden py-1 w-[calc(100%+1rem)] sm:w-full"
          >
            <MobileOfferCarousel />
          </div>

        </div>
      </section>
    </ClickSpark>
  );
}