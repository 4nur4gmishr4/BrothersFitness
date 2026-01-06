"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowRight, Volume2, VolumeX, Instagram, MessageCircle } from "lucide-react";
import { useSound } from "@/components/SoundContext";
import { useAdmin } from "@/lib/auth-context";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollY } = useScroll();
  const { isEnabled, toggleSound } = useSound();
  useAdmin(); // Keep the hook call for context, but don't destructure unused values
  const pathname = usePathname();
  const router = useRouter();

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
    // Cleanup: Always restore scroll on unmount or state change
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const menuItems = [
    { name: "Home", id: "/", isExternal: false, isRoute: true },
    { name: "Workouts", id: "/workouts", isExternal: false, isRoute: true },
    { name: "Diet Planner", id: "/fuel", isExternal: false, isRoute: true },
    { name: "Calculators", id: "/calculators", isExternal: false, isRoute: true },
    { name: "Pricing", id: "/pricing", isExternal: false, isRoute: true },
    { name: "Quotes", id: "/quotes", isExternal: false, isRoute: true }
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
    } else {
      // If element not found (e.g. we are on /workouts), redirect to home with hash
      window.location.href = `/#${id}`;
      setIsOpen(false);
    }
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.isRoute) {
      // Internal route navigation
      window.location.href = item.id;
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
              onClick={() => {
                if (pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  router.push('/');
                }
              }}
              className="relative z-50 group"
              whileHover={!isMobile ? { scale: 1.05 } : undefined}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base sm:text-lg md:text-xl lg:text-3xl font-display font-black uppercase tracking-tighter">
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
                className="p-2.5 sm:p-2.5 text-gray-400 hover:text-gym-red transition-colors"
                aria-label="Instagram"
                whileHover={!isMobile ? { scale: 1.1, rotate: 5 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                <Instagram className="w-4 h-4 sm:w-6 sm:h-6" />
              </motion.a>

              {/* WhatsApp */}
              <motion.a
                href="https://wa.me/919131179343?text=Hi%20Aman,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-2.5 text-gray-400 hover:text-[#25D366] transition-colors"
                aria-label="WhatsApp"
                whileHover={!isMobile ? { scale: 1.1, rotate: -5 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6" />
              </motion.a>

              {/* Sound Toggle */}
              <motion.button
                onClick={toggleSound}
                className="p-2.5 sm:p-2.5 text-gray-400 hover:text-gym-red transition-colors"
                aria-label="Toggle Sound"
                whileHover={!isMobile ? { scale: 1.1 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                {isEnabled ? (
                  <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" />
                )}
              </motion.button>

              {/* Hamburger Menu */}
              <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 sm:p-2.5 text-gray-400 hover:text-gym-red transition-colors"
                aria-label="Toggle Menu"
                whileHover={!isMobile ? { scale: 1.1 } : undefined}
                whileTap={{ scale: 0.9 }}
              >
                {isOpen ? (
                  <X className="w-5 h-5 sm:w-7 sm:h-7" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-7 sm:h-7" />
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
              className="fixed inset-0 z-50 flex flex-col items-center px-6 sm:px-8 pt-20 pb-6"
            >
              {/* Navigation Items - Scrollable Container */}
              <div className="w-full max-w-lg overflow-y-auto overflow-x-hidden flex-1 py-4 scrollbar-hide">
                <motion.nav
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    hidden: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                  }}
                  className="flex flex-col items-stretch gap-2 sm:gap-3"
                >
                  {menuItems.map((item, index) => {
                    const isActive = pathname === item.id || (pathname === "/" && item.id === "/");
                    return (
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
                        <div className={`flex items-center justify-between px-5 py-3 sm:py-4 border rounded-lg transition-all duration-200 ${isActive
                          ? "border-gym-red bg-gym-red/20 shadow-[0_0_15px_rgba(215,25,33,0.3)]"
                          : "border-white/10 hover:border-gym-red/50 bg-white/5 hover:bg-gym-red/10"
                          }`}>
                          <span className={`text-base sm:text-lg md:text-xl font-display font-bold uppercase tracking-wide transition-colors ${isActive ? "text-gym-red" : "text-white group-hover:text-gym-red"
                            }`}>
                            {item.name}
                          </span>
                          <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${isActive ? "text-gym-red" : "text-gray-500 group-hover:text-gym-red group-hover:translate-x-1"
                            }`} />
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.nav>

                {/* Contact Section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 pt-6 border-t border-white/10"
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4 text-center">
                    Connect with Aman
                  </p>
                  <div className="flex gap-3 justify-center">
                    <motion.a
                      href="https://www.instagram.com/brothers_fitness_17?igsh=MW0xYmV2dHIzOHlneQ=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:border-gym-red hover:bg-gym-red/10 transition-all group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Instagram className="w-5 h-5 text-gray-400 group-hover:text-gym-red transition-colors" />
                      <span className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors">Instagram</span>
                    </motion.a>
                    <motion.a
                      href="https://wa.me/919131179343?text=Hi%20Aman,%20I'm%20interested%20in%20joining%20Brother's%20Fitness!"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:border-[#25D366] hover:bg-[#25D366]/10 transition-all group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-[#25D366] transition-colors" />
                      <span className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors">WhatsApp</span>
                    </motion.a>
                  </div>
                </motion.div>
              </div>

              {/* Status Footer */}

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}