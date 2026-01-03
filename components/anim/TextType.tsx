"use client";
import { motion } from "framer-motion";

export default function TextType({ text, delay = 0 }: { text: string, delay?: number }) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        // Base delay of 0.5s plus any added delay
        delayChildren: 0.5 + delay
      },
    },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-wrap justify-center gap-x-[0.2em] gap-y-2"
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="whitespace-nowrap flex">
          {Array.from(word).map((char, charIndex) => (
            <motion.span key={`char-${wordIndex}-${charIndex}`} variants={child}>
              {char}
            </motion.span>
          ))}
          {/* Add a non-breaking space after each word except the last one if needed, 
              but since we wrap words in spans, we rely on gap-x for spacing */}\r
        </span>
      ))}
    </motion.div>
  );
}
