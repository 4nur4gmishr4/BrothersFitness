"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
    "CALCULATING OPTIMAL MACRO DISTRIBUTION...",
    "ANALYZING MARKET PRICES (INR)...",
    "TRANSLATING TO HINDI...",
    "CATEGORIZING HOME ESSENTIALS...",
    "FINALIZING TACTICAL BRIEF..."
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
        <p className="font-dot text-xs text-green-500 uppercase tracking-widest min-h-[1.5em]">
            {MESSAGES[index]}
        </p>
    );
}
