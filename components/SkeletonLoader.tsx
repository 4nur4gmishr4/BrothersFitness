"use client";

import { motion } from "framer-motion";

interface SkeletonCardProps {
    className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
    return (
        <div className={`skeleton rounded-lg ${className}`}>
            <div className="p-4 space-y-3">
                <div className="h-32 skeleton rounded-md" />
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
            </div>
        </div>
    );
}

export function SkeletonWorkoutGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                >
                    <SkeletonCard className="h-[200px]" />
                </motion.div>
            ))}
        </div>
    );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {[...Array(lines)].map((_, i) => (
                <div
                    key={i}
                    className={`h-4 skeleton rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`}
                />
            ))}
        </div>
    );
}
