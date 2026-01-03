"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useSpring, AnimatePresence, useMotionValueEvent } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { SoundProvider } from "@/components/SoundContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfoSection from "@/components/InfoSection";
import DailyProtocol from "@/components/DailyProtocol";
import Architects from "@/components/Architects";
import FuelInjector from "@/components/FuelInjector";
import Diagnostics from "@/components/Diagnostics";
import PaymentSection from "@/components/PaymentSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const [showGoToTop, setShowGoToTop] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Track scroll position for Go to Top button visibility
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setShowGoToTop(latest > 0.1);
    setScrollPercent(Math.round(latest * 100));
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate circle circumference for progress indicator
  const circleRadius = 18;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <SoundProvider>
      <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
        {/* Progress bar at top */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gym-red origin-left z-[60]"
          style={{ scaleX }}
        />

        <Navbar />
        <Hero />
        <InfoSection />
        <PaymentSection />
        <DailyProtocol />
        <Architects />
        <FuelInjector />
        <Diagnostics />
        <ContactForm />
        <Footer />

        {/* Circular Scroll Progress + Go to Top Button */}
        <AnimatePresence>
          {showGoToTop && (
            <motion.button
              onClick={scrollToTop}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 right-6 z-50 group"
              aria-label="Go to top"
            >
              {/* Circular Progress Background */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                {/* Background circle */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 44 44"
                >
                  <circle
                    cx="22"
                    cy="22"
                    r={circleRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r={circleRadius}
                    fill="none"
                    stroke="#D71921"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-150"
                  />
                </svg>

                {/* Center button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-full border border-white/10 group-hover:border-gym-red/50 group-hover:bg-gym-red/10 transition-all">
                  <ArrowUp className="w-5 h-5 text-white group-hover:text-gym-red transition-colors" />
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </SoundProvider>
  );
}