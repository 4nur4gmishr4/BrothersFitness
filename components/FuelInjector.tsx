"use client";

import { useState, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect } from "react";

export default function FuelInjector() {
  const [mode, setMode] = useState<"bulk" | "cut">("bulk");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const macros = mode === "bulk"
    ? [{ name: "Protein", percent: 30, color: "bg-red-500" }, { name: "Carbs", percent: 50, color: "bg-blue-500" }, { name: "Fats", percent: 20, color: "bg-yellow-500" }]
    : [{ name: "Protein", percent: 40, color: "bg-red-500" }, { name: "Carbs", percent: 30, color: "bg-blue-500" }, { name: "Fats", percent: 30, color: "bg-yellow-500" }];

  return (
    <section id="fuel" ref={ref} className="min-h-screen bg-black py-12 md:py-20 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          backgroundImage: mode === "bulk"
            ? "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.5), transparent 50%)"
            : "radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.5), transparent 50%)"
        }}
        transition={{ duration: 0.5 }}
      />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4 font-sans">
            FUEL INJECTOR
          </h2>
          <p className="text-lg text-gray-400 font-dot">
            OPTIMIZE YOUR INTAKE. CHOOSE YOUR GOAL.
          </p>
        </motion.div>

        <div className="flex gap-4 justify-center mb-12">
          <ModeButton
            label="BULK"
            icon={<TrendingUp className="w-5 h-5" />}
            isActive={mode === "bulk"}
            onClick={() => setMode("bulk")}
          />
          <ModeButton
            label="CUT"
            icon={<TrendingDown className="w-5 h-5" />}
            isActive={mode === "cut"}
            onClick={() => setMode("cut")}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.5 }}
            className="border-2 border-white p-6 md:p-10"
          >
            <div className="mb-8">
              <h3 className="text-2xl md:text-3xl font-black font-sans mb-4">
                {mode === "bulk" ? "HYPERTROPHY PROTOCOL" : "FAT LOSS PROTOCOL"}
              </h3>
              <p className="text-gray-400">
                {mode === "bulk"
                  ? "Primary objective: Hypertrophy. Increase caloric surplus by 300-500 kcal. Prioritize complex carbs pre-workout and fast carbs post-workout."
                  : "Primary objective: Fat Oxidation. Maintain 300-500 kcal deficit. Keep protein high (2g/kg) to preserve muscle tissue."}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-dot font-bold uppercase tracking-widest text-gray-400 mb-4">
                MACRO BREAKDOWN
              </h4>
              {macros.map((macro, idx) => (
                <div key={macro.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">{macro.name}</span>
                    <span className="font-bold">{macro.percent}%</span>
                  </div>
                  <div className="h-3 bg-gray-800 overflow-hidden">
                    <MacroBar percent={macro.percent} color={macro.color} delay={idx * 0.1} isInView={isInView} />
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              className="mt-8 grid md:grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CalorieCard
                label="MAINTENANCE"
                value={mode === "bulk" ? 2500 : 2200}
                suffix="kcal"
                isInView={isInView}
              />
              <CalorieCard
                label={mode === "bulk" ? "GROWTH" : "DEFICIT"}
                value={mode === "bulk" ? 2800 : 1700}
                suffix="kcal"
                isInView={isInView}
                highlight
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function ModeButton({ label, icon, isActive, onClick }: { label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 font-dot font-bold text-xs uppercase tracking-widest border-2 transition-all ${isActive
        ? "bg-gym-red text-white border-gym-red"
        : "bg-transparent text-gray-400 border-white hover:border-gym-red"
        }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function MacroBar({ percent, color, delay, isInView }: { percent: number; color: string; delay: number; isInView: boolean }) {
  return (
    <motion.div
      className={`h-full ${color}`}
      initial={{ width: "0%" }}
      animate={isInView ? { width: `${percent}%` } : {}}
      transition={{ duration: 1, delay, ease: "easeOut" }}
    />
  );
}

function CalorieCard({ label, value, suffix, isInView, highlight = false }: { label: string; value: number; suffix: string; isInView: boolean; highlight?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      className={`border-2 p-6 ${highlight
        ? "border-gym-red bg-gym-red/5"
        : "border-gray-700"
        }`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <p className="text-xs font-dot font-bold uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </p>
      <p className={`text-4xl font-black ${highlight ? "text-gym-red" : ""}`}>
        {count.toLocaleString()} <span className="text-lg">{suffix}</span>
      </p>
    </motion.div>
  );
}

