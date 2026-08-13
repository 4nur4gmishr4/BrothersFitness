import { Suspense } from "react";
import WorkoutLibrary from "@/components/WorkoutLibrary";
import Navbar from "@/components/Navbar";
import TacticalStopwatch from "@/components/TacticalStopwatch";
import Footer from "@/components/Footer";

export default function WorkoutsPage() {
  return (
    <div className="min-h-screen surface-canvas text-hi">
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <p className="label-text text-accent mb-3">EXERCISE DATABASE</p>
          <h1 className="heading-display text-4xl md:text-6xl mb-4 text-hi">
            EXERCISE <span className="text-accent">LIBRARY</span>
          </h1>
          <p className="body-text text-mid">BROWSE EXERCISES BY MUSCLE GROUP</p>
        </div>

        <Suspense fallback={<div className="text-center text-accent animate-pulse label-text">Loading exercises...</div>}>
          <WorkoutLibrary />
        </Suspense>
      </div>

      {/* Floating workout timer */}
      <TacticalStopwatch />
      <Footer />
    </div>
  );
}
