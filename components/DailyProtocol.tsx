"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Crosshair, Layers } from "lucide-react";



const SPLITS = {
  standard: [
    { day: "SUNDAY", focus: "REST & RECOVERY", type: "Active Mobility & CNS Reset" },
    { day: "MONDAY", focus: "CHEST", type: "Upper Pectoral & Mid-Chest Focus" },
    { day: "TUESDAY", focus: "BACK", type: "Lat Width & Rhomboid Thickness" },
    { day: "WEDNESDAY", focus: "SHOULDERS & TRAPS", type: "Deltoid Heads & Upper Trapezius" },
    { day: "THURSDAY", focus: "TRICEPS & ABS", type: "Tricep Extension & Core Stability" },
    { day: "FRIDAY", focus: "BICEPS & FOREARMS", type: "Bicep Peak & Grip Strength" },
    { day: "SATURDAY", focus: "LEGS", type: "Quad Sweep & Hamstring Isolation" },
  ],
  triple: [
    { day: "SUNDAY", focus: "REST & RECOVERY", type: "System Reboot & Deep Sleep" },
    { day: "MONDAY", focus: "CHEST, TRICEPS, ABS", type: "Heavy Compound Push & Core" },
    { day: "TUESDAY", focus: "BACK, BICEPS, FOREARMS", type: "Heavy Compound Pull & Flexion" },
    { day: "WEDNESDAY", focus: "LEGS, SHOULDERS, TRAPS", type: "Squat Patterns & Overhead Press" },
    { day: "THURSDAY", focus: "CHEST, TRICEPS, ABS", type: "Volume Push & Accessory Isolation" },
    { day: "FRIDAY", focus: "BACK, BICEPS, FOREARMS", type: "Volume Pull & Peak Contraction" },
    { day: "SATURDAY", focus: "LEGS, SHOULDERS, TRAPS", type: "Lower Body & Deltoid Volume" },
  ]
};

export default function DailyProtocol() {
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [activeSplit, setActiveSplit] = useState<"standard" | "triple">("standard");

  useEffect(() => {
    setCurrentDay(new Date().getDay());
  }, []);

  return (
    <section id="protocol" className="min-h-screen bg-black text-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-6xl font-black uppercase mb-4 font-sans">DAILY PROTOCOL</h2>
          <p className="text-lg text-gray-400 font-dot">LIVE TRAINING SCHEDULE</p>
        </motion.div>

        <div className="flex gap-4 justify-center mb-12">
          <TabButton
            label="BRO SPLIT"
            icon={<Crosshair className="w-5 h-5" />}
            isActive={activeSplit === "standard"}
            onClick={() => setActiveSplit("standard")}
          />
          <TabButton
            label="TRIPLE SPLIT"
            icon={<Layers className="w-5 h-5" />}
            isActive={activeSplit === "triple"}
            onClick={() => setActiveSplit("triple")}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSplit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-3 md:gap-5"
          >
            {SPLITS[activeSplit].map((item, idx) => {
              const isToday = currentDay === idx;
              return (
                <motion.div
                  key={`${activeSplit}-${item.day}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`border p-6 md:p-8 relative ${isToday
                    ? "border-gym-red bg-gym-red/10"
                    : "border-white/20 hover:border-white/40"
                    } transition-all`}
                  whileHover={{ scale: 1.02 }}
                >
                  {isToday && (
                    <motion.div
                      className="absolute top-4 right-4 bg-gym-red text-white px-3 py-1 text-xs font-dot font-bold"
                      animate={{
                        boxShadow: [
                          "0 0 10px rgba(215, 25, 33, 0.5)",
                          "0 0 20px rgba(215, 25, 33, 0.8)",
                          "0 0 10px rgba(215, 25, 33, 0.5)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ACTIVE
                    </motion.div>
                  )}
                  <h3 className="text-2xl md:text-3xl font-black font-sans mb-2">{item.day}</h3>
                  <p className="text-xl md:text-2xl text-gym-red font-bold mb-1">{item.focus}</p>
                  <p className="text-sm text-gray-400 font-dot">{item.type}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function TabButton({ label, icon, isActive, onClick }: { label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 font-dot font-bold text-xs uppercase tracking-widest border transition-all ${isActive
        ? "bg-gym-red text-white border-gym-red"
        : "bg-transparent text-gray-400 border-white/20 hover:border-gym-red hover:text-gym-red"
        }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

