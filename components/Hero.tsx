"use client";
import { motion } from "framer-motion";
import HeroLoopManager from "./HeroLoopManager";
import QuoteCycler from "./QuoteCycler";
import CurvedLoop from "@/components/react-bits/CurvedLoop";

export default function Hero() {
  return (
    <section className="h-[100svh] w-full bg-white dark:bg-gym-black flex flex-col items-center relative overflow-hidden transition-colors duration-300">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#888_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

      {/* Main Content Centered */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center px-4 w-full flex-grow flex flex-col justify-center"
      >
        {/* Label */}
        <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "linear", repeat: 2, repeatType: "reverse" }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-gym-red font-dot text-xs md:text-sm tracking-[0.3em] mb-4 md:mb-8"
        >
            EST. 2024 // GYM OS
        </motion.h2>
        
        {/* BIG TITLE */}
        <div className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase italic leading-none tracking-tighter min-h-[2.2em] flex items-center justify-center w-full">
            <HeroLoopManager />
        </div>

        {/* QUOTE CYCLER */}
        <div className="mt-6 md:mt-10 max-w-[95%] md:max-w-2xl mx-auto flex justify-center w-full">
            <QuoteCycler />
        </div>
        
        {/* BUTTON */}
        <div>
            <motion.a 
            href="#protocol"
            whileHover={{ scale: 1.05, backgroundColor: "#D71921", color: "#FFF" }}
            whileTap={{ scale: 0.95 }}
            className="inline-block mt-6 sm:mt-8 md:mt-12 px-6 sm:px-8 md:px-10 py-2 sm:py-3 md:py-4 border border-gym-red text-gym-red font-bold font-dot tracking-widest uppercase bg-transparent hover:border-transparent transition-colors cursor-pointer text-xs sm:text-sm md:text-base rounded-sm"
            >
            Initialize_Training
            </motion.a>
        </div>
      </motion.div>

      {/* CURVED LOOP CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="relative z-20 w-full flex justify-center pb-8 sm:pb-10 md:pb-10 -mt-16 sm:-mt-20 md:mt-0 scale-100 sm:scale-110 md:scale-100 origin-bottom"
      >
        <div className="w-full max-w-[100vw] overflow-hidden">
            <CurvedLoop 
                marqueeText="No Pain, No Gain, Shut Up & Train   ❚█══█❚   "
                speed={2}
                curveAmount={120} 
                interactive={true}
            />
        </div>
      </motion.div>
    </section>
  );
}