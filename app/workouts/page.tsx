import { Suspense } from "react";
import WorkoutLibrary from "@/components/features/workouts/WorkoutLibrary";
import Navbar from "@/components/public/layout/Navbar";
import Footer from "@/components/public/layout/Footer";

export default function WorkoutsPage() {
  return (
    <div className="min-h-screen surface-canvas text-hi">
      <Navbar />
      <div className="pt-6 sm:pt-10 pb-12 px-4 sm:px-8 md:px-12 lg:px-16 max-w-[1600px] mx-auto">
        {/* Top Display Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-14 gap-6 pb-8 border-b border-surface-border/70">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent mb-2 block font-semibold">
              GYM EXERCISES &amp; GUIDE
            </span>
            <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl text-hi leading-[0.95] tracking-tight uppercase">
              WORKOUT <span className="text-accent">LIBRARY</span>
            </h1>
          </div>

          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">Exercise Steps &amp; Guides</p>
            <p className="text-xs text-mid">Search exercises by body parts and equipment</p>
          </div>
        </div>

        <Suspense fallback={<div className="text-center text-accent animate-pulse label-text">Loading exercises...</div>}>
          <WorkoutLibrary />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
