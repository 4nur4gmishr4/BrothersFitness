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

  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {elements.map((item, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
          animate={inView ? { opacity: 1, filter: "blur(0px)", y: 0 } : {}}
          transition={{
            duration: 0.45,
            delay: (index * delay) / 1000,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block mr-1 last:mr-0"
        >
          {item}
        </motion.span>
      ))}
    </span>
  );
}
