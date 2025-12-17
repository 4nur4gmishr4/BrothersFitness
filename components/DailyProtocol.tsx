"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, Crosshair, Layers, Zap } from "lucide-react";

// --- 3D TILT COMPONENT (Mobile Optimized) ---
function TiltCard({ children, className, onClick }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    if (isMobile) return; // Disable on mobile
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);
  
  // Holographic Sheen
  const sheenX = useTransform(mouseX, [-100, 100], ["0%", "100%"]);
  const sheenY = useTransform(mouseY, [-100, 100], ["0%", "100%"]);

  return (
    <motion.div
      style={isMobile ? {} : { rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      className={`${className} relative`}
    >
      <div style={isMobile ? {} : { transform: "translateZ(20px)" }}>
        {children}
      </div>
      
      {/* Glossy Sheen Overlay - Hidden on Mobile */}
      {!isMobile && (
        <motion.div 
          style={{ 
              background: "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%)",
              left: sheenX,
              top: sheenY,
              position: "absolute",
              width: "200%",
              height: "200%",
              transform: "translate(-50%, -50%) pointer-events-none"
          }}
          className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      )}
    </motion.div>
  );
}

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
    <section id="protocol" className="py-12 md:py-24 bg-gym-black/5 dark:bg-black relative border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-8 md:mb-12">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-gym-red blur-lg opacity-50 animate-pulse"></div>
                    <Calendar className="relative text-gym-red w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                    <h3 className="text-2xl md:text-4xl font-black font-sans italic uppercase text-black dark:text-white">DAILY <span className="text-gym-red">PROTOCOL</span></h3>
                    <p className="font-dot text-xs text-gray-500 tracking-widest mt-1">LIVE TRAINING SCHEDULE</p>
                </div>
            </div>

            <div className="flex gap-2 bg-white dark:bg-white/5 p-1 rounded-sm border border-gray-200 dark:border-white/10 w-full md:w-auto">
                <TabButton 
                    label="SINGLE / DOUBLE" 
                    icon={<Layers size={14} />} 
                    isActive={activeSplit === "standard"} 
                    onClick={() => setActiveSplit("standard")} 
                />
                <TabButton 
                    label="TRIPLE (PPL)" 
                    icon={<Zap size={14} />} 
                    isActive={activeSplit === "triple"} 
                    onClick={() => setActiveSplit("triple")} 
                />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 perspective-1000">
            <AnimatePresence mode="wait">
                {SPLITS[activeSplit].map((item, idx) => {
                    const isToday = currentDay === idx;
                    
                    return (
                        <TiltCard
                            key={`${activeSplit}-${idx}`}
                            className={`relative p-5 md:p-6 border rounded-sm overflow-hidden group flex flex-col justify-between min-h-[150px] cursor-default
                                ${isToday 
                                    ? "bg-gym-red text-white border-gym-red shadow-[0_0_30px_rgba(215,25,33,0.3)] scale-[1.02] md:scale-105 z-10" 
                                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 opacity-70 hover:opacity-100 hover:border-gym-yellow transition-all"
                                }`}
                        >
                            {isToday && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 font-dot text-[10px] bg-black/20 px-2 py-1 rounded">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                    ACTIVE
                                </div>
                            )}

                            <div>
                                <div className="font-dot text-xs tracking-[0.2em] opacity-60 mb-2">{item.day}</div>
                                <h4 className={`text-xl md:text-2xl font-black font-sans italic uppercase leading-none mb-3 ${isToday ? "text-white" : "text-black dark:text-white"}`}>
                                    {item.focus}
                                </h4>
                            </div>
                            
                            <div className="flex items-start gap-2 text-xs font-sans font-medium border-t border-black/10 dark:border-white/10 pt-3">
                                <Crosshair size={14} className={`mt-0.5 shrink-0 ${isToday ? "text-white" : "text-gym-red"}`} />
                                <span className="uppercase tracking-tight whitespace-normal leading-tight">{item.type}</span>
                            </div>
                        </TiltCard>
                    );
                })}
            </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TabButton({ label, icon, isActive, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-2 font-dot text-[10px] md:text-xs font-bold tracking-widest transition-all whitespace-nowrap rounded-sm
                ${isActive 
                    ? "bg-gym-red text-white shadow-md" 
                    : "text-gray-500 hover:text-gym-red hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}