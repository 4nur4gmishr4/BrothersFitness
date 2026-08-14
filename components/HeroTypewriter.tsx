"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const QUOTES = [
  "PAIN IS TEMPORARY",
  "NO EXCUSES",
  "PUSH YOUR LIMITS",
  "EMBRACE THE GRIND",
  "DEFY GRAVITY",
  "STRENGTH WITHIN"
];

const BRAND_NAME = "BROTHERS FITNESS";

export default function HeroTypewriter() {
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    // Determine target string
    const isBrandTurn = (phraseIndex + 1) % 3 === 0;
    const targetPhrase = isBrandTurn 
      ? BRAND_NAME 
      : QUOTES[phraseIndex % QUOTES.length];

    const typeSpeed = isDeleting ? 30 : 80;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText !== targetPhrase) {
          setCurrentText(targetPhrase.substring(0, currentText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (currentText === "") {
          setIsDeleting(false);
          setPhraseIndex((prev) => prev + 1);
        } else {
          setCurrentText(targetPhrase.substring(0, currentText.length - 1));
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, phraseIndex]);

  const isBrandTurn = (phraseIndex + 1) % 3 === 0;

  return (
    <div className="text-left h-[100px] md:h-[140px] flex items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl heading-display transition-colors duration-300 ${
          isBrandTurn ? "text-accent" : "text-hi"
        }`}
      >
        {currentText}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-[4px] md:w-[6px] h-[40px] md:h-[60px] ml-2 bg-current align-middle"
        />
      </motion.div>
    </div>
  );
}