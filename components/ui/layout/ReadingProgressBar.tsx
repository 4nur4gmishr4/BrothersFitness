"use client";

import React, { useEffect } from "react";

export default function ReadingProgressBar() {
    useEffect(() => {
        // If native CSS scroll-timeline is supported, browser compositor handles 100% of the work
        if (typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()")) {
            return;
        }

        let rafId: number;
        let ticking = false;
        const bar = document.getElementById("global-reading-progress");
        if (!bar) return;

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                rafId = requestAnimationFrame(() => {
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollHeight)) : 0;
                    bar.style.transform = `scaleX(${progress})`;
                    ticking = false;
                });
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            <style>{`
                @keyframes readingProgressScrollTimeline {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                @supports (animation-timeline: scroll()) {
                    #global-reading-progress {
                        animation: readingProgressScrollTimeline linear;
                        animation-timeline: scroll();
                    }
                }
            `}</style>
            <div
                id="global-reading-progress"
                className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-[110] pointer-events-none will-change-transform transform scale-x-0"
            />
        </>
    );
}

export { ReadingProgressBar };
