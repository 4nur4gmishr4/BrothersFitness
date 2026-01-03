"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoundProvider } from "@/components/SoundContext";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [videoEnded, setVideoEnded] = useState(false);

    useEffect(() => {
        // Lock scroll during loading
        document.body.style.overflow = "hidden";

        // Safety fallback: Force end after 5 seconds if video hangs
        const timer = setTimeout(() => {
            setVideoEnded(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const handleAnimationComplete = () => {
        document.body.style.overflow = ""; // Unlock scroll
        // Additional cleanup if needed
    };

    return (
        <SoundProvider>
            {/* Loader Overlay */}
            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div
                        key="loader"
                        className="fixed inset-0 z-[100] bg-black grid place-items-center"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.5 } }} // Fade out background after reveal starts
                    >
                        <video
                            src="/assets/Brofitlottie.webm"
                            autoPlay
                            muted
                            playsInline
                            onEnded={() => setVideoEnded(true)}
                            className="w-16 md:w-24 object-contain"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content with Reveal Animation */}
            <motion.div
                key="main-content"
                className="relative min-h-screen"
                initial={{ clipPath: "circle(0% at 50% 50%)" }}
                animate={{
                    clipPath: videoEnded ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)"
                }}
                transition={{
                    type: "spring",
                    stiffness: 70,
                    damping: 15,
                    mass: 1,
                    restDelta: 0.001
                }}
                onAnimationComplete={() => {
                    if (videoEnded) {
                        setLoading(false);
                        handleAnimationComplete();
                    }
                }}
            >
                {children}
            </motion.div>
        </SoundProvider>
    );
}
