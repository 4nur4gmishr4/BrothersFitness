"use client";

import { useEffect, useState } from "react";

/** Shows a ticking MM:SS countdown that fires onComplete when it hits zero. */
export default function CountdownTimer({ duration, onComplete }: { duration: number; onComplete?: () => void }) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, onComplete]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="font-mono text-4xl font-black text-gym-red tabular-nums tracking-widest">
            {formatTime(timeLeft)}
        </div>
    );
}
