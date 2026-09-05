"use client";

import React, { useState, useEffect } from "react";

interface ScheduleItem {
  id: string;
  name: string;
  category: string;
  time: string;
  isClosed?: boolean;
  startHour?: number;
  startMin?: number;
  endHour?: number;
  endMin?: number;
}

const SCHEDULE: ScheduleItem[] = [
  {
    id: "morning",
    name: "Morning Batch",
    category: "Open for all members",
    time: "6:00 AM – 10:00 AM",
    startHour: 6,
    startMin: 0,
    endHour: 10,
    endMin: 0,
  },
  {
    id: "women",
    name: "Women's Batch",
    category: "Girls & Women only",
    time: "4:30 PM – 6:30 PM",
    startHour: 16,
    startMin: 30,
    endHour: 18,
    endMin: 30,
  },
  {
    id: "evening",
    name: "Evening Batch",
    category: "Open for all members",
    time: "6:30 PM – 10:00 PM",
    startHour: 18,
    startMin: 30,
    endHour: 22,
    endMin: 0,
  },
  {
    id: "sunday",
    name: "Sunday",
    category: "Rest Day & Cleaning",
    time: "Closed",
    isClosed: true,
  },
];

export default function OperatingSchedule() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isGymOpen, setIsGymOpen] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (day === 0) {
      setIsGymOpen(false);
      return;
    }

    let foundActive = false;
    for (const item of SCHEDULE) {
      if (item.startHour !== undefined && item.endHour !== undefined) {
        const start = item.startHour * 60 + (item.startMin || 0);
        const end = item.endHour * 60 + (item.endMin || 0);
        if (currentMinutes >= start && currentMinutes < end) {
          setIsGymOpen(true);
          foundActive = true;
          break;
        }
      }
    }

    if (!foundActive) {
      setIsGymOpen(false);
    }
  }, []);

  return (
    <section id="timings" className="w-full h-full flex flex-col justify-start select-none">
      <div className="w-full">
        
        {/* Apple iOS Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-hi">
              Gym Timings
            </h2>
            <p className="text-xs text-mid mt-0.5">
              Brother&apos;s Fitness, Lakhnadon
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-semibold ${
                isGymOpen ? "text-[#34C759]" : "text-mid"
              }`}
            >
              {isGymOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        {/* Exact Apple iOS Inset Grouped TableView */}
        <div
          onMouseLeave={() => setHoveredIndex(null)}
          className="w-full bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
        >
          {SCHEDULE.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const isDividerHidden =
              hoveredIndex !== null &&
              (hoveredIndex === index || hoveredIndex === index + 1);

            return (
              <React.Fragment key={item.id}>
                <div
                  onMouseEnter={() => setHoveredIndex(index)}
                  className={`group w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-sm transition-colors duration-150 cursor-pointer select-none ${
                    isHovered ? "bg-surface-elevated" : ""
                  }`}
                >
                  {/* Left: Batch Title & Audience */}
                  <div className="flex flex-col min-w-0 pr-2">
                    <span
                      className={`text-xs font-semibold transition-colors duration-150 ${
                        isHovered ? "text-hi" : "text-hi/90"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-[11px] text-mid truncate mt-0.5">
                      {item.category}
                    </span>
                  </div>

                  {/* Right: Clean Time Text */}
                  <div className="flex-shrink-0">
                    <span
                      className={`text-xs font-medium transition-colors duration-150 ${
                        item.isClosed
                          ? "text-low"
                          : isHovered
                          ? "text-hi"
                          : "text-mid"
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>

                {/* Inset Hairline Divider with Hover Disappear */}
                {index < SCHEDULE.length - 1 && (
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
        </div>

        {/* Apple iOS Inset Footer */}
        <div className="flex items-center justify-between mt-2.5 px-2 text-[11px] text-mid">
          <span>Monday – Saturday</span>
          <span>6:00 AM – 10:00 PM</span>
        </div>

      </div>
    </section>
  );
}
