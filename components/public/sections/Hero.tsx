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

export default function Hero() {
  return (
    <ClickSpark sparkColor="rgba(215, 25, 33, 0.75)" sparkCount={7} sparkRadius={18}>
      <section className="relative flex flex-col justify-start overflow-hidden pt-1.5 sm:pt-2 lg:pt-3 pb-8 sm:pb-12 lg:pb-14 bg-surface-canvas text-hi">
        
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
          
          {/* Prominent Brand Headline with Animated Stroke Text */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2 sm:space-y-3 mb-4 sm:mb-6"
          >
            <h1 className="sr-only">Brother&apos;s Fitness Lakhnadon</h1>
            {/* Prominent Brand Headline: BROTHER'S on Line 1, FITNESS on Line 2 with Left Alignment */}
            <div className="flex flex-col items-start -ml-1 sm:-ml-2 max-w-full">
              <div className="w-full">
                <StrokeText
                  text="BROTHER'S"
                  delay={0}
                  strokeWidth={1.8}
                  drawDuration={1.1}
                  fillDelay={0.1}
                  stagger={0.035}
                  ease="power2.out"
                  trigger="mount"
                  fillMode="wipe"
                  fontSize={105}
                  fontWeight={800}
                  fontFamily="var(--font-syne), 'Syne', sans-serif"
                  letterSpacing={0}
                  align="left"
                  className="w-full"
                />
              </div>
              <div className="w-full -mt-3 sm:-mt-4 md:-mt-5">
                <StrokeText
                  text="FITNESS"
                  delay={0.15}
                  strokeColor="#D71921"
                  fillColor="#D71921"
                  highlightWord="FITNESS"
                  highlightColor="#D71921"
                  strokeWidth={1.8}
                  drawDuration={1.1}
                  fillDelay={0.1}
                  stagger={0.035}
                  ease="power2.out"
                  trigger="mount"
                  fillMode="wipe"
                  fontSize={105}
                  fontWeight={800}
                  fontFamily="var(--font-syne), 'Syne', sans-serif"
                  letterSpacing={0}
                  align="left"
                  className="w-full"
                />
              </div>
            </div>

            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-hi/90 tracking-tight leading-snug flex flex-wrap items-center gap-x-2.5 sm:gap-x-3">
              <span className="text-mid font-medium">Lakhnadon&apos;s Premier Center for</span>
              <RotatingText
                texts={[
                  "Strength Training",
                  "Personal Coaching",
                  "Dedicated Women's Batches",
                  "Custom Nutrition Plans",
                  "Heavy Iron Powerlifting",
                  "Fat Loss & Conditioning",
                  "Functional Athletics",
                  "Muscle Building",
                ]}
                mainClassName="text-accent inline-flex font-bold tracking-tight"
                staggerFrom="last"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                splitBy="characters"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                rotationInterval={3000}
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
            className="text-sm sm:text-base md:text-lg text-mid max-w-3xl leading-relaxed mb-6 sm:mb-8"
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
              <span>View Operating Hours</span>
            </Link>
          </motion.div>

        </div>
      </section>
    </ClickSpark>
  );
}