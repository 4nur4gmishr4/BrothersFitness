"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BentoItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  link: string;
  colSpan: string;
  isWide?: boolean;
}

const BENTO_ITEMS: BentoItem[] = [
  {
    id: "weights",
    tag: "Strength",
    title: "Weights & Machines",
    desc: "Dumbbells, barbells, and heavy machines to help you build muscle and strength.",
    link: "/workouts",
    colSpan: "col-span-2 md:col-span-2",
    isWide: true,
  },
  {
    id: "cardio",
    tag: "Cardio",
    title: "Running & Cycling",
    desc: "Treadmills and cycles to improve your stamina and burn calories.",
    link: "/workouts",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    id: "coaching",
    tag: "Trainers",
    title: "Personal Coaching",
    desc: "1-on-1 guidance and step-by-step help from Aman and Pradeep.",
    link: "#architects",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    id: "nutrition",
    tag: "Food",
    title: "Diet & Meal Plans",
    desc: "Simple daily food charts tailored for weight loss or muscle building.",
    link: "/fuel",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    id: "calculators",
    tag: "Tools",
    title: "Body Calculators",
    desc: "Easy online tools to check your daily calorie burn and BMI.",
    link: "/calculators",
    colSpan: "col-span-1 md:col-span-1",
  },
  {
    id: "membership",
    tag: "Plans",
    title: "Gym Passes & Pricing",
    desc: "Affordable monthly, 3-month, and yearly passes with zero extra admission fees.",
    link: "/pricing",
    colSpan: "col-span-2 md:col-span-3",
    isWide: true,
  },
];

export default function FeaturesOverview() {
  return (
    <section id="facilities" className="w-full h-full select-none">
      <div className="w-full">
        
        {/* Big Display Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">
              GYM AMENITIES
            </p>
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.95] tracking-tight uppercase">
              FACILITIES &amp; <span className="text-accent">FEATURES</span>
            </h2>
          </div>
          
          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">6 Dedicated Training Zones</p>
            <p className="text-xs text-mid">Heavy iron, cardio line &amp; customized nutrition</p>
          </div>
        </div>

        {/* Compact Apple Bento Grid (2-Col on Mobile, 3-Col on Desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {BENTO_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className={`${item.colSpan} group block select-none`}
            >
              <div
                className={`h-full bg-surface-card border border-surface-border rounded-xl sm:rounded-2xl transition-all duration-200 ease-out hover:bg-surface-elevated hover:border-surface-border/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] shadow-sm flex flex-col justify-between ${
                  item.isWide
                    ? "p-3.5 sm:p-5 md:p-6"
                    : "p-3 sm:p-4 md:p-5"
                }`}
              >
                {/* Top Row: Tag + Chevron */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-xs font-semibold text-accent group-hover:text-hi transition-colors duration-150">
                    {item.tag}
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-low group-hover:text-hi group-hover:translate-x-0.5 transition-all duration-200" />
                </div>

                {/* Content: Space-optimized for Mobile & Desktop */}
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-hi tracking-tight mb-0.5 sm:mb-1 group-hover:text-accent transition-colors duration-150">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-mid leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {item.desc}
                  </p>
                </div>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
