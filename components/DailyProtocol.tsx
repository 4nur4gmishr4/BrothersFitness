"use client";

import { useState, useEffect } from "react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";

const SPLITS = {
  standard: [
    { day: "SUNDAY", focus: "REST & RECOVERY", type: "Active Recovery & Mobility" },
    { day: "MONDAY", focus: "CHEST", type: "Upper Pectoral & Mid-Chest Focus" },
    { day: "TUESDAY", focus: "BACK", type: "Lat Width & Rhomboid Thickness" },
    { day: "WEDNESDAY", focus: "SHOULDERS & TRAPS", type: "Deltoid Heads & Upper Trapezius" },
    { day: "THURSDAY", focus: "TRICEPS & ABS", type: "Tricep Extension & Core Stability" },
    { day: "FRIDAY", focus: "BICEPS & FOREARMS", type: "Bicep Peak & Grip Strength" },
    { day: "SATURDAY", focus: "LEGS", type: "Quad Sweep & Hamstring Isolation" },
  ],
  triple: [
    { day: "SUNDAY", focus: "REST & RECOVERY", type: "Active Recovery & Mobility" },
    { day: "MONDAY", focus: "CHEST, TRICEPS, ABS", type: "Heavy Compound Push & Core" },
    { day: "TUESDAY", focus: "BACK, BICEPS, FOREARMS", type: "Heavy Compound Pull & Flexion" },
    { day: "WEDNESDAY", focus: "LEGS, SHOULDERS, TRAPS", type: "Squat Patterns & Overhead Press" },
    { day: "THURSDAY", focus: "CHEST, TRICEPS, ABS", type: "Volume Push & Accessory Isolation" },
    { day: "FRIDAY", focus: "BACK, BICEPS, FOREARMS", type: "Volume Pull & Peak Contraction" },
    { day: "SATURDAY", focus: "LEGS, SHOULDERS, TRAPS", type: "Lower Body & Deltoid Volume" },
  ],
};

export default function DailyProtocol() {
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [activeSplit, setActiveSplit] = useState<"standard" | "triple">("standard");

  useEffect(() => {
    setCurrentDay(new Date().getDay());
  }, []);

  return (
    <div id="protocol" className="h-full surface-card p-6 md:p-8 relative overflow-hidden flex flex-col">
      <div className="flex-1 w-full relative z-10">
        <div className="text-center mb-10" data-reveal>
          <p className="label-text text-accent mb-3">TRAINING</p>
          <h2 className="heading-display text-4xl md:text-6xl mb-4 text-hi">
            WEEKLY <span className="text-accent">SPLIT</span>
          </h2>
          <p className="body-text text-mid">PICK A SPLIT · FOLLOW THE PLAN</p>
        </div>

        <div className="flex gap-4 justify-center mb-12">
          <TabButton
            label="BRO SPLIT"
            icon={<AnimatedIcon name="dumbbell" className="w-5 h-5" label="BRO split" />}
            isActive={activeSplit === "standard"}
            onClick={() => setActiveSplit("standard")}
          />
          <TabButton
            label="TRIPLE SPLIT"
            icon={<AnimatedIcon name="calendar" className="w-5 h-5" label="Triple split" />}
            isActive={activeSplit === "triple"}
            onClick={() => setActiveSplit("triple")}
          />
        </div>

        <div className="grid gap-4">
          {SPLITS[activeSplit].map((item, idx) => {
            const isToday = currentDay === idx;
            return (
              <div
                key={`${activeSplit}-${item.day}`}
                className={`p-6 surface-card hairline transition-colors duration-fast ${
                  isToday
                    ? "border-accent bg-surface-elevated"
                    : "hover:border-accent/50"
                }`}
              >
                {isToday && (
                  <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-accent-muted border border-accent">
                    <span className="relative w-3 h-3 flex items-center justify-center" aria-hidden="true">
                      <span className="absolute inset-0 rounded-full border border-status-success icon-ring" />
                      <span className="w-1.5 h-1.5 bg-status-success rounded-full" />
                    </span>
                    <span className="label-text text-accent">ACTIVE TODAY</span>
                  </div>
                )}
                <h3 className="heading-display text-2xl md:text-3xl mb-2 text-hi">{item.day}</h3>
                <p className="heading-section text-xl md:text-2xl text-accent font-bold mb-1">{item.focus}</p>
                <p className="body-text text-sm text-mid">{item.type}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`category-tab ${isActive ? "category-tab--active" : ""}`}
      aria-pressed={isActive}
    >
      <span className={isActive ? "text-accent" : ""}>{icon}</span>
      {label}
    </button>
  );
}
