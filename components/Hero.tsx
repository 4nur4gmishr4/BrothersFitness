"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import HeroLoopManager from "./HeroLoopManager";
import QuoteCycler from "./QuoteCycler";
import CurvedLoop from "@/components/react-bits/CurvedLoop";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white py-16 md:py-0">
      {/* Background grid animation - desktop only */}
      {!isMobile && (
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(215, 25, 33, 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(215, 25, 33, 0.3) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
            animate={{
              backgroundPosition: ["0px 0px", "50px 50px"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 2px, transparent 4px)",
            }}
            animate={{ y: ["0%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {/* Glow blobs - desktop only */}
      {!isMobile && (
        <>
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gym-red rounded-full blur-[120px] opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-[120px] opacity-10"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-7xl px-4 text-center">
        <motion.div
          className="mb-4 md:mb-6 font-mono text-xs md:text-sm tracking-ultra text-gray-400 uppercase font-medium"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          EST. 2024 // GYM OS
        </motion.div>

        <motion.div
          className="mb-6 md:mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <HeroLoopManager />
        </motion.div>

        <motion.div
          className="mb-8 md:mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <QuoteCycler />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <motion.a
            href="#operations"
            className="inline-block relative group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gym-red blur-xl opacity-50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.button
              className="relative bg-gym-red text-white px-8 md:px-14 py-4 md:py-6 font-mono font-bold text-xs md:text-base uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 overflow-hidden"
              whileHover={{
                boxShadow: "0 0 30px rgba(215, 25, 33, 0.6)",
              }}
            >
              <motion.span
                className="relative z-10"
                animate={{
                  letterSpacing: ["0.15em", "0.2em", "0.15em"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Initialize_Training
              </motion.span>
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>
          </motion.a>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 w-full mt-8 md:mt-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <CurvedLoop
          marqueeText="No Pain, No Gain, Shut Up & Train"
          speed={2}
          className="w-full"
          curveAmount={120}
          direction="left"
          interactive={true}
        />
      </motion.div>
    </section>
  );
}
