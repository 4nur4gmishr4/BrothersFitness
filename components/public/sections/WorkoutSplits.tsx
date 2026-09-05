"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DayPlan {
  day: string;
  focus: string;
  isRest?: boolean;
}

interface SplitOption {
  id: string;
  name: string;
  daysCount: string;
  schedule: DayPlan[];
}

const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: "ppl",
    name: "Push Pull Legs",
    daysCount: "6 days / week",
    schedule: [
      { day: "Monday", focus: "Chest, Shoulders & Triceps" },
      { day: "Tuesday", focus: "Back & Biceps" },
      { day: "Wednesday", focus: "Quads, Hamstrings & Calves" },
      { day: "Thursday", focus: "Chest & Shoulders" },
      { day: "Friday", focus: "Back, Rear Delts & Biceps" },
      { day: "Saturday", focus: "Legs & Core" },
      { day: "Sunday", focus: "Rest", isRest: true },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    daysCount: "4 days / week",
    schedule: [
      { day: "Monday", focus: "Upper Body (Strength)" },
      { day: "Tuesday", focus: "Lower Body (Strength)" },
      { day: "Wednesday", focus: "Rest", isRest: true },
      { day: "Thursday", focus: "Upper Body (Building Muscle)" },
      { day: "Friday", focus: "Lower Body (Building Muscle)" },
      { day: "Saturday", focus: "Rest", isRest: true },
      { day: "Sunday", focus: "Rest", isRest: true },
    ],
  },
  {
    id: "bro-split",
    name: "Bro Split",
    daysCount: "5 days / week",
    schedule: [
      { day: "Monday", focus: "Chest" },
      { day: "Tuesday", focus: "Back" },
      { day: "Wednesday", focus: "Shoulders" },
      { day: "Thursday", focus: "Legs" },
      { day: "Friday", focus: "Arms & Core" },
      { day: "Saturday", focus: "Rest", isRest: true },
      { day: "Sunday", focus: "Rest", isRest: true },
    ],
  },
];

export default function WorkoutSplits() {
  const [selectedId, setSelectedId] = useState<string>("ppl");
  const [todayName, setTodayName] = useState<string>("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  React.useEffect(() => {
    const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
    setTodayName(day);
  }, []);

  const currentSplit = SPLIT_OPTIONS.find((s) => s.id === selectedId) || SPLIT_OPTIONS[0];

  return (
    <section id="splits" className="w-full select-none">
      <div className="w-full">
        
        {/* iOS Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-hi">
              Workout Plans
            </h2>
            <p className="text-xs text-mid mt-0.5">
              Easy exercise schedule for every day
            </p>
          </div>
          <span className="text-xs font-medium text-accent">
            {currentSplit.daysCount}
          </span>
        </div>

        {/* Native iOS Cupertino Segmented Control */}
        <div className="w-full p-1 bg-surface-soft border border-surface-border rounded-xl flex items-center mb-4 shadow-sm">
          {SPLIT_OPTIONS.map((split) => {
            const isActive = split.id === selectedId;
            return (
              <button
                key={split.id}
                onClick={() => setSelectedId(split.id)}
                type="button"
                className={`relative flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 text-center select-none active:scale-[0.98] ${
                  isActive
                    ? "text-hi font-semibold"
                    : "text-mid hover:text-hi hover:bg-surface-elevated/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="iosSegmentPill"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className="absolute inset-0 bg-surface-card border border-surface-border rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">{split.name}</span>
              </button>
            );
          })}
        </div>

        {/* Exact iOS Inset Grouped TableView with Full Row Hover & Disappearing Dividers */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSplit.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseLeave={() => setHoveredIndex(null)}
            className="w-full bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
          >
            {currentSplit.schedule.map((item, index) => {
              const isToday = item.day.toLowerCase() === todayName.toLowerCase();
              const isHovered = hoveredIndex === index;
              const isDividerHidden =
                hoveredIndex !== null &&
                (hoveredIndex === index || hoveredIndex === index + 1);

              return (
                <React.Fragment key={item.day}>
                  <div
                    onMouseEnter={() => setHoveredIndex(index)}
                    className={`group w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-sm transition-colors duration-150 cursor-pointer select-none ${
                      isHovered ? "bg-surface-elevated" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 w-40 flex-shrink-0">
                      <span
                        className={`text-xs font-semibold transition-colors duration-150 ${
                          isHovered
                            ? "text-hi"
                            : isToday
                            ? "text-hi"
                            : "text-hi/90"
                        }`}
                      >
                        {item.day}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-accent text-white shadow-sm flex items-center gap-1 transition-transform duration-150 group-hover:scale-105">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          Active
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs text-right font-medium truncate transition-colors duration-150 ${
                        item.isRest
                          ? "text-low group-hover:text-mid"
                          : isHovered
                          ? "text-hi"
                          : "text-mid"
                      }`}
                    >
                      {item.focus}
                    </span>
                  </div>
                  {index < currentSplit.schedule.length - 1 && (
                    <div
                      className={`h-[1px] ml-4 sm:ml-5 transition-opacity duration-150 ${
                        isDividerHidden
                          ? "opacity-0"
                          : "opacity-100 bg-surface-border/60"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
