"use client";

import { motion } from "framer-motion";

const INFINITY_PATH =
  "M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z";

export function MorphingInfinity({
  className = "w-8 h-8 text-accent",
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="status"
      aria-label="Loading"
      className={className}
      {...props}
    >
      {/* Background track */}
      <path
        d={INFINITY_PATH}
        stroke="currentColor"
        strokeOpacity={0.18}
        strokeWidth={2}
      />
      {/* Animated trace */}
      <motion.path
        d={INFINITY_PATH}
        initial={{ pathLength: 0.15, pathOffset: 0 }}
        animate={{
          pathLength: [0.15, 0.65, 0.15],
          pathOffset: [0, 1],
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </svg>
  );
}

export default MorphingInfinity;
