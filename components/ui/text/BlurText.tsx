"use client";

import React from "react";
import { motion, useInView } from "framer-motion";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
}

export default function BlurText({
  text,
  delay = 40,
  className = "",
  animateBy = "words",
}: BlurTextProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      <span className="sr-only">{text}</span>
      {elements.map((item, index) => {
        // Cap stagger delay to max 450ms so text doesn't trail behind during scroll
        const staggeredDelay = Math.min((index * delay) / 1000, 0.45);
        return (
          <motion.span
            key={index}
            initial={{
              opacity: 0,
              y: 6,
              filter: isMobile ? "none" : "blur(6px)",
            }}
            animate={
              inView
                ? {
                    opacity: 1,
                    y: 0,
                    filter: isMobile ? "none" : "blur(0px)",
                  }
                : {}
            }
            transition={{
              duration: isMobile ? 0.35 : 0.5,
              delay: staggeredDelay,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="inline-block mr-1 last:mr-0"
          >
            {item}
          </motion.span>
        );
      })}
    </span>
  );
}
