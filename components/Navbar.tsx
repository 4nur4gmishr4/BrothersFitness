"use client";
import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useSound } from "@/components/SoundContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const { isEnabled, toggleSound } = useSound();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) setIsHidden(true);
    else setIsHidden(false);
  });

  const menuItems = [
    { name: "Operations", id: "operations" },
    { name: "Protocol", id: "protocol" },
    { name: "Architects", id: "architects" },
    { name: "Fuel", id: "fuel" },
    { name: "Diagnostics", id: "diagnostics" },
    { name: "Contact", id: "contact" }
  ];

  const containerVars = {
    hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
  };

  const itemVars = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <>
      <motion.nav 
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" }}}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-transparent mix-blend-difference text-white"
      >
        <div className="flex items-center gap-2 sm:gap-4">
             <div className="font-dot text-sm sm:text-lg md:text-xl tracking-widest text-gym-red z-50 font-bold cursor-default select-none group">
                BROTHER'S<span className="group-hover:animate-pulse">_</span>FITNESS
            </div>
        </div>
       
        
        <div className="flex items-center gap-4 z-50">
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSound}
            className="p-2 text-gym-red hover:text-white transition-colors"
            title={isEnabled ? "Mute Sound" : "Enable Sound"}
            aria-label="Toggle Sound"
          >
            {isEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="p-3 rounded-full active:bg-white/10 hover:text-gym-red transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={32} /> : <Menu size={32} />}
          </motion.button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: "circle(0% at 100% 0%)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at 100% 0%)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-gym-red z-40 flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div 
                variants={containerVars}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex flex-col gap-6 text-center"
            >
              {menuItems.map((item) => (
                <motion.a
                  key={item.name}
                  href={`#${item.id}`} 
                  onClick={() => setIsOpen(false)}
                  variants={itemVars}
                  whileHover={{ x: 10, skewX: -10 }} 
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-sans text-black hover:text-white uppercase italic tracking-tighter flex items-center justify-center gap-2 sm:gap-4 group cursor-pointer"
                >
                  <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -ml-4 sm:-ml-8 md:-ml-12 w-6 sm:w-8 md:w-12" />
                  {item.name}
                </motion.a>
              ))}

            </motion.div>
            
            <div className="absolute bottom-10 font-dot text-black/50 text-xs tracking-widest">
              SYSTEM STATUS: ONLINE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}