"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
    "CALCULATING DAILY MACROS...",
    "ANALYZING MARKET PRICES (INR)...",
    "TRANSLATING TO HINDI...",
    "CATEGORIZING HOME ESSENTIALS...",
    "GENERATING YOUR PLAN..."
];

/** Rotates through synthesis progress messages every 3 seconds. */
export default function LoadingStatus() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <p className="font-mono text-xs text-status-success uppercase tracking-widest min-h-[1.5em]">
            {MESSAGES[index]}
        </p>
    );
}

