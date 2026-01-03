"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowRight, Volume2, VolumeX, Instagram, MessageCircle } from "lucide-react";
import { useSound } from "@/components/SoundContext";
// import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const { scrollY } = useScroll();
  const { isEnabled, toggleSound } = useSound();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    { name: "Operations", id: "operations", isExternal: false },
    { name: "Protocol", id: "protocol", isExternal: false },
    { name: "Architects", id: "architects", isExternal: false },
    { name: "Fuel", id: "fuel", isExternal: false },
    { name: "Payment", id: "payment", isExternal: false },
    { name: "Diagnostics", id: "diagnostics", isExternal: false },
    { name: "Contact", id: "contact", isExternal: false },
    { name: "Quotes", id: "/quotes", isExternal: true }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth"
      });
      setIsOpen(false);
    }
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.isExternal) {
      window.open(item.id, '_blank');
      setIsOpen(false);
    } else {
      scrollToSection(item.id);
    }
  };

  return (
    <>
      {/* Fixed Navbar - always on top */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${isScrolled
          ? 'bg-black/50 backdrop-blur-xl border-b border-white/5 shadow-sm'
          : 'bg-transparent backdrop-blur-none'
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="relative z-50 group"
              whileHover={!isMobile ? { scale: 1.05 } : undefined}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm sm:text-base md:text-lg lg:text-xl font-display font-black uppercase tracking-tighter">
                <span className="text-white group-hover:text-gym-red transition-colors duration-300">
                  BROTHER&apos;S
                </span>
                <span className="text-gym-red">_</span>
                <span className="text-white group-hover:text-gym-red transition-colors duration-300">
                  FITNESS
                </span>
              </span>
            </motion.button>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {/* Instagram */}
              <motion.a
                href="https://www.instagram.com/brothers_fitness_17?igsh=MW0xYmV2dHIzOHlneQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 text-gray-400 hover:text-gym-red transition-colors"
                aria-label="Instagram"
                whileHover={!isMobile ? { scale: 1.1, rotate: 5 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.a>

              {/* WhatsApp */}
              <motion.a
                href="https://wa.me/919131179343?text=Hi%20Aman,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 text-gray-400 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
                whileHover={!isMobile ? { scale: 1.1, rotate: -5 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.a>

              {/* Sound Toggle */}
              <motion.button
                onClick={toggleSound}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-gym-red transition-colors"
                aria-label="Toggle Sound"
                whileHover={!isMobile ? { scale: 1.1 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                {isEnabled ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.button>

              {/* Hamburger Menu */}
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 sm:p-2.5 text-gray-400 hover:text-gym-red transition-colors"
                aria-label="Toggle Menu"
                whileHover={!isMobile ? { scale: 1.1 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                {isOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content overlap */}
      <div className="h-16 sm:h-20" />

      {/* Full Screen Menu - Redesigned */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/98 backdrop-blur-xl z-40"
            >
              {/* Subtle gradient accents - desktop only */}
              {!isMobile && (
                <>
                  <div className="absolute top-0 left-0 w-96 h-96 bg-gym-red/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-96 h-96 bg-gym-red/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </>
              )}
            </motion.div>

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col items-center px-6 sm:px-8 overflow-y-auto pt-4 pb-16"
            >
              {/* Navigation Items */}
              <motion.nav
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
                className="flex flex-col items-center w-full max-w-lg gap-2 sm:gap-3 flex-1 justify-center pt-12"
              >
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.name}
                    onClick={() => handleMenuClick(item)}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={!isMobile ? { scale: 1.02, x: 10 } : undefined}
                    whileTap={{ scale: 0.98 }}
                    className="w-full group"
                    custom={index}
                  >
                    <div className="flex items-center justify-between px-5 py-3 sm:py-4 border border-white/10 hover:border-gym-red/50 bg-white/5 hover:bg-gym-red/10 rounded-lg transition-all duration-200">
                      <span className="text-base sm:text-lg md:text-xl font-display font-bold uppercase tracking-wide text-white group-hover:text-gym-red transition-colors">
                        {item.name}
                      </span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-gym-red group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </motion.nav>

              {/* Status Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <p className="text-xs font-mono uppercase tracking-widest text-gray-600">
                  SYSTEM STATUS: ONLINE
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}