"use client";

import { motion, useScroll } from "framer-motion";

export default function ReadingProgressBar() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-[110] pointer-events-none will-change-transform"
            style={{ scaleX: scrollYProgress }}
        />
    );
}

export { ReadingProgressBar };
