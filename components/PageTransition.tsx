"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        // Skip animation on first load
        if (isFirstLoad) {
            setIsFirstLoad(false);
        }
    }, [isFirstLoad]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={isFirstLoad ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
