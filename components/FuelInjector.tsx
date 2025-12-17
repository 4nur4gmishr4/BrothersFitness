"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Utensils } from "lucide-react";

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => current.toFixed(1)); // Rounded to 1 decimal if needed

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export default function FuelInjector() {
  const [mode, setMode] = useState<"bulk" | "cut">("bulk");

  return (
    <section id="fuel" className="py-12 md:py-24 bg-white dark:bg-gym-dark transition-colors duration-300 relative overflow-hidden">
        <div className="absolute -right-10 md:-right-20 top-20 text-[100px] md:text-[200px] font-black text-black/5 dark:text-white/5 rotate-90 pointer-events-none select-none font-sans">
            FUEL
        </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-8 md:mb-12">
             <h3 className="text-xl sm:text-2xl md:text-4xl font-black font-sans italic uppercase text-black dark:text-white flex items-center justify-center gap-2 sm:gap-3">
                <Utensils className="text-gym-yellow w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" /> FUEL <span className="text-gym-yellow">INJECTOR</span>
            </h3>
            <p className="font-dot text-xs md:text-sm text-gray-500 mt-2 tracking-wider">OPTIMIZE YOUR INTAKE. CHOOSE YOUR GOAL.</p>
        </div>

        <div className="flex justify-center mb-6 sm:mb-8 md:mb-12">
            <div className="bg-gray-200 dark:bg-white/10 p-1 rounded-full flex relative w-full max-w-xs">
                <button 
                    onClick={() => setMode("bulk")}
                    className={`flex-1 px-3 sm:px-4 md:px-8 py-2 rounded-full font-bold font-dot tracking-widest text-xs md:text-sm relative z-10 transition-colors ${mode === "bulk" ? "text-white" : "text-gray-500"}`}
                >
                    BULK
                </button>
                <button 
                    onClick={() => setMode("cut")}
                    className={`flex-1 px-3 sm:px-4 md:px-8 py-2 rounded-full font-bold font-dot tracking-widest text-xs md:text-sm relative z-10 transition-colors ${mode === "cut" ? "text-black" : "text-gray-500"}`}
                >
                    CUT
                </button>
                
                <motion.div 
                    layout
                    className={`absolute top-1 bottom-1 w-[50%] rounded-full shadow-md ${mode === "bulk" ? "bg-gym-red left-1" : "bg-gym-yellow right-1"}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>
        </div>

        <AnimatePresence mode="wait">
            <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className={`border-l-4 p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-black/40 shadow-xl ${mode === "bulk" ? "border-gym-red" : "border-gym-yellow"}`}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                    <div>
                        <h4 className={`text-3xl sm:text-4xl md:text-6xl font-black font-sans italic mb-2 sm:mb-3 ${mode === "bulk" ? "text-gym-red" : "text-gym-yellow"}`}>
                            {mode === "bulk" ? "MASS" : "SHRED"}
                        </h4>
                        <p className="font-sans text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-lg leading-relaxed">
                            {mode === "bulk" 
                                ? "Primary objective: Hypertrophy. Increase caloric surplus by 300-500 kcal. Prioritize complex carbs pre-workout and fast carbs post-workout." 
                                : "Primary objective: Fat Oxidation. Maintain 300-500 kcal deficit. Keep protein high (2g/kg) to preserve muscle tissue."}
                        </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-300 dark:border-white/10 pb-2">
                            <span className="font-dot font-bold text-[9px] sm:text-xs tracking-widest">PROTEIN</span>
                            <span className="font-black font-sans italic text-base sm:text-lg md:text-xl text-black dark:text-white flex gap-1">
                                <AnimatedNumber value={2.0} />g - <AnimatedNumber value={2.5} />g / kg
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-300 dark:border-white/10 pb-2">
                            <span className="font-dot font-bold text-[9px] sm:text-xs tracking-widest">CARBS</span>
                            <span className={`font-black font-sans italic text-base sm:text-lg md:text-xl ${mode === "bulk" ? "text-gym-red" : "text-gym-yellow"}`}>
                                {mode === "bulk" ? "HIGH (40-50%)" : "LOW (10-20%)"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-300 dark:border-white/10 pb-2">
                             <span className="font-dot font-bold text-[9px] sm:text-xs tracking-widest">FATS</span>
                             <span className="font-black font-sans italic text-base sm:text-lg md:text-xl text-gray-500">
                                {mode === "bulk" ? "MODERATE" : "MODERATE-HIGH"}
                             </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}