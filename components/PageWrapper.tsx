"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SoundProvider } from "@/components/SoundContext";

import TacticalChatbot from "@/components/TacticalChatbot";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    // Start with content visible to prevent flash
    const [showLoader, setShowLoader] = useState(false);
    const [showContent, setShowContent] = useState(true);
    const [videoEnded, setVideoEnded] = useState(false);

    useEffect(() => {
        // Check if returning user synchronously
        const hasLoadedData = sessionStorage.getItem("brofit_loaded");
        let isReturning = false;

        if (hasLoadedData) {
            try {
                const { timestamp } = JSON.parse(hasLoadedData);
                const sevenDays = 7 * 24 * 60 * 60 * 1000;

                if (Date.now() - timestamp < sevenDays) {
                    isReturning = true;
                }
            } catch (e) {
                // Invalid format
            }
        }

        if (isReturning) {
            // Returning user: content already visible, no loader needed
            setShowContent(true);
            setShowLoader(false);
            setVideoEnded(true);
            return;
        }

        // New user: Show loader immediately
        setShowLoader(true);
        setShowContent(false);
        document.body.style.overflow = "hidden";

        // Safety fallback: Force end after 2.5 seconds
        const timer = setTimeout(() => {
            handleVideoComplete();
        }, 2500);

        // Absolute fail-safe: Force remove loader after 4 seconds
        const failSafe = setTimeout(() => {
            setShowLoader(false);
            setShowContent(true);
            setVideoEnded(true);
            document.body.style.overflow = "";
            sessionStorage.setItem("brofit_loaded", JSON.stringify({ timestamp: Date.now() }));
        }, 4000);

        return () => {
            clearTimeout(timer);
            clearTimeout(failSafe);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVideoComplete = () => {
        if (videoEnded) return;
        setVideoEnded(true);

        setTimeout(() => {
            setShowLoader(false);
            setShowContent(true);
            document.body.style.overflow = "";
            sessionStorage.setItem("brofit_loaded", JSON.stringify({ timestamp: Date.now() }));
        }, 500);
    };

    return (
        <SoundProvider>
            {/* Loader Overlay */}
            <AnimatePresence mode="wait">
                {showLoader && (
                    <motion.div
                        key="loader"
                        className="fixed inset-0 z-[100] bg-black grid place-items-center"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    >
                        <video
                            src="/assets/Brofitlottie.webm"
                            autoPlay
                            muted
                            playsInline
                            onEnded={handleVideoComplete}
                            onError={handleVideoComplete}
                            className="w-16 md:w-24 object-contain"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - Always visible, animated only on first load */}
            <AnimatePresence mode="wait">
                {showContent && (
                    <motion.div
                        key="main-content"
                        className="relative min-h-screen"
                        initial={{ opacity: videoEnded ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        id="main-content-wrapper"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>

            <TacticalChatbot />
        </SoundProvider>
    );
}
