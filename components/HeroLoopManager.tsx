"use client";
import { motion, Variants } from "framer-motion";

export default function HeroLoopManager() {
  const text1 = "BROTHER'S";
  const text2 = "FITNESS";

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="text-left">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl heading-display flex flex-wrap text-hi"
      >
        {text1.split("").map((char, index) => (
          <motion.span key={`text1-${index}`} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-2 md:mt-4 text-6xl md:text-7xl lg:text-8xl xl:text-9xl heading-display flex flex-wrap text-accent"
      >
        {text2.split("").map((char, index) => (
          <motion.span key={`text2-${index}`} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}