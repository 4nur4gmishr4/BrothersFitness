import { Suspense } from "react";
import WorkoutManager from "@/components/WorkoutManager";
import Navbar from "@/components/Navbar";
import TacticalStopwatch from "@/components/TacticalStopwatch";
import Footer from "@/components/Footer";

export default function WorkoutsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 font-sans text-white">
                        TACTICAL ARMORY
                    </h1>
                    <p className="text-gray-400 font-dot uppercase tracking-widest text-sm md:text-base">
                        CLASSIFIED EXERCISE DATABASE // WGER.DE UPLINK ESTABLISHED
                    </p>
                </div>

                <Suspense fallback={<div className="text-center text-gym-red animate-pulse font-mono">ESTABLISHING UPLINK...</div>}>
                    <WorkoutManager />
                </Suspense>
            </div>

            {/* Floating Tactical Stopwatch */}
            <TacticalStopwatch />
            <Footer />
        </div>
    );
}
