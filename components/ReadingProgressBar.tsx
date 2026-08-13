"use client";

import { useEffect, useState } from "react";

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            const max = doc.scrollHeight - doc.clientHeight;
            setProgress(max > 0 ? doc.scrollTop / max : 0);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    return (
        <div
            className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-[110]"
            style={{ transform: `scaleX(${progress})` }}
        />
    );
}
