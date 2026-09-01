"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/ui/providers/ThemeProvider";
import { useUserAuth } from "@/lib/user-auth-context";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  ArrowUpRight,
  Github,
  Instagram,
  Bell,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const ProfileModal = dynamic(() => import("@/components/ui/primitives/ProfileModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/ui/primitives/LoginModal"), { ssr: false });
const WelcomeModal = dynamic(() => import("@/components/ui/primitives/WelcomeModal"), { ssr: false });

export default function Navbar({ unreadLeads = 0 }: { unreadLeads?: number } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { showLoginModal, setShowLoginModal, showWelcome, setShowWelcome } = useUserAuth();
  const { theme, setTheme, mounted } = useTheme();
  const { user, isLoggedIn, isLoading } = useUserAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock document scroll without layout shift when menu is open
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const navLinks = [
    { name: "Home", id: "/", num: "01" },
    { name: "Workouts", id: "/workouts", num: "02" },
    { name: "Diet Planner", id: "/fuel", num: "03" },
    { name: "Calculators", id: "/calculators", num: "04" },
    { name: "Pricing", id: "/pricing", num: "05" },
    { name: "Quotes", id: "/quotes", num: "06" },
    { name: "Trophy Room", id: "/trophy-room", num: "07" },
  ];

  const handleMenuClick = (id: string) => {
    router.push(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Editorial Apple-Grade Navigation Header */}
      <header
        className={`sticky top-0 left-0 right-0 z-[110] select-none transition-colors duration-200 ${
          isOpen || isScrolled
            ? "bg-surface-canvas border-b border-surface-border/80 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left: Brand Wordmark */}
            <Link
              href="/"
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            >
              <div className="text-base sm:text-xl font-bold tracking-tight text-hi group-hover:text-accent transition-colors duration-150">
                BROTHER&apos;S <span className="text-accent">FITNESS</span>
              </div>
            </Link>

            {/* Right: 5 Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Option 1: Theme Switcher */}
              <button
                onClick={() => setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system")}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated active:scale-90 transition-all duration-150 shadow-sm"
                aria-label="Toggle theme"
              >
                <div className="w-4 h-4 text-hi">
                  {!mounted ? (
                    <Monitor className="w-full h-full" />
                  ) : theme === "system" ? (
                    <Monitor className="w-full h-full" />
                  ) : theme === "dark" ? (
                    <Moon className="w-full h-full" />
                  ) : (
                    <Sun className="w-full h-full" />
                  )}
                </div>
              </button>

              {/* Option 2: Instagram */}
              <a
                href="https://www.instagram.com/brothers_fitness_17"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated active:scale-90 transition-all duration-150 shadow-sm"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-mid hover:text-hi transition-colors" />
              </a>

              {/* Option 3: WhatsApp Coach */}
              <a
                href="https://wa.me/919131179343"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated active:scale-90 transition-all duration-150 shadow-sm"
                aria-label="WhatsApp Coach"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              </a>

                  {/* Option 4: User Auth / Profile */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isLoggedIn) {
                        setShowProfileModal(true);
                      } else {
                        setShowLoginModal(true);
                      }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated active:scale-90 transition-all duration-150 shadow-sm overflow-hidden"
                    aria-label="Profile"
                  >
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 rounded-full skeleton" />
                    ) : isLoggedIn && user?.photo_url ? (
                      <Image
                        src={user.photo_url}
                        alt="Profile"
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-hi" />
                    )}
                  </button>

              {/* Option 5: Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150 shadow-sm ${
                  isOpen
                    ? "bg-accent text-white"
                    : "bg-surface-card border border-surface-border text-hi hover:bg-surface-elevated"
                }`}
                aria-label="Toggle Menu"
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  {isOpen ? (
                    <X className="w-full h-full transition-transform duration-200" />
                  ) : (
                    <Menu className="w-full h-full transition-transform duration-200" />
                  )}
                </div>
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* Solid Opaque Full-Screen Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-surface-canvas pt-16 sm:pt-20 overflow-y-auto overscroll-contain w-full h-[100dvh]"
            role="dialog"
            aria-modal="true"
          >
            {/* Staggered Navigation Body */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 md:py-16">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                
                {/* Left Column: Big Staggered Links */}
                <div className="lg:col-span-7 space-y-1">
                  <span className="text-xs font-mono uppercase tracking-widest text-accent mb-4 block font-semibold">
                    NAVIGATION INDEX
                  </span>

                  <div className="space-y-2">
                    {navLinks.map((item) => {
                      const isActive = pathname === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.id)}
                          className="group w-full py-3 sm:py-4 flex items-center justify-between border-b border-surface-border/60 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4 sm:gap-6">
                            <span className="text-xs font-mono text-mid group-hover:text-accent transition-colors">
                              {item.num}
                            </span>
                            <span
                              className={`text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight transition-colors duration-150 ${
                                isActive
                                  ? "text-accent"
                                  : "text-hi group-hover:text-accent group-hover:translate-x-1"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>

                          <ArrowUpRight
                            className={`w-5 h-5 transition-transform duration-200 ${
                              isActive
                                ? "text-accent"
                                : "text-mid/40 group-hover:text-accent group-hover:translate-x-1 group-hover:-translate-y-1"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: People & Direct Access Rows in Matching Editorial Style */}
                <div className="lg:col-span-5 space-y-1 pt-4 lg:pt-0">
                  <span className="text-xs font-mono uppercase tracking-widest text-accent mb-4 block font-semibold">
                    DIRECTORY &amp; DIRECT ACCESS
                  </span>

                  <div className="space-y-2">
                    {/* 01 Aman Shrivastava */}
                    <div className="group w-full py-3.5 sm:py-4 flex items-center justify-between border-b border-surface-border/60 text-left transition-colors">
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0 pr-2">
                        <span className="text-xs font-mono text-mid group-hover:text-accent transition-colors flex-shrink-0">
                          01
                        </span>
                        <div className="truncate">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-hi group-hover:text-accent transition-colors block truncate">
                            Aman Shrivastava
                          </span>
                          <span className="text-xs text-mid truncate block mt-0.5">
                            Founder &bull; Head Coach
                          </span>
                        </div>
                      </div>

                      {/* Action Icons (Logo Only) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <a
                          href="tel:+919131179343"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-accent active:scale-90 transition-all text-hi shadow-sm"
                          aria-label="Call Aman"
                          title="Call Aman"
                        >
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://wa.me/919131179343"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-[#25D366] active:scale-90 transition-all text-[#25D366] shadow-sm"
                          aria-label="WhatsApp Aman"
                          title="WhatsApp Aman"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://www.instagram.com/aman_shrivastavaaa72"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-accent active:scale-90 transition-all text-mid hover:text-hi shadow-sm"
                          aria-label="Instagram Aman"
                          title="Instagram Aman"
                        >
                          <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                      </div>
                    </div>

                    {/* 02 Pradeep Shrivastava */}
                    <div className="group w-full py-3.5 sm:py-4 flex items-center justify-between border-b border-surface-border/60 text-left transition-colors">
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0 pr-2">
                        <span className="text-xs font-mono text-mid group-hover:text-accent transition-colors flex-shrink-0">
                          02
                        </span>
                        <div className="truncate">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-hi group-hover:text-accent transition-colors block truncate">
                            Pradeep Shrivastava
                          </span>
                          <span className="text-xs text-mid truncate block mt-0.5">
                            Co-Founder &bull; Senior Trainer
                          </span>
                        </div>
                      </div>

                      {/* Action Icons (Logo Only) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <a
                          href="tel:+919131272754"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-accent active:scale-90 transition-all text-hi shadow-sm"
                          aria-label="Call Pradeep"
                          title="Call Pradeep"
                        >
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://wa.me/919131272754"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-[#25D366] active:scale-90 transition-all text-[#25D366] shadow-sm"
                          aria-label="WhatsApp Pradeep"
                          title="WhatsApp Pradeep"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://www.instagram.com/brothers_fitness_17"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-accent active:scale-90 transition-all text-mid hover:text-hi shadow-sm"
                          aria-label="Instagram Pradeep"
                          title="Instagram Pradeep"
                        >
                          <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                      </div>
                    </div>

                    {/* 03 Anurag Mishra */}
                    <div className="group w-full py-3.5 sm:py-4 flex items-center justify-between border-b border-surface-border/60 text-left transition-colors">
                      <div className="flex items-center gap-4 sm:gap-6 min-w-0 pr-2">
                        <span className="text-xs font-mono text-mid group-hover:text-accent transition-colors flex-shrink-0">
                          03
                        </span>
                        <div className="truncate">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-hi group-hover:text-accent transition-colors block truncate">
                            Anurag Mishra
                          </span>
                          <span className="text-xs text-mid truncate block mt-0.5">
                            Platform Developer &bull; Architect
                          </span>
                        </div>
                      </div>

                      {/* Action Icons (Logo Only: WhatsApp, Call, Insta, GitHub) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <a
                          href="tel:+919302786886"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-accent active:scale-90 transition-all text-hi shadow-sm"
                          aria-label="Call Developer"
                          title="Call Developer"
                        >
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://wa.me/919302786886"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-[#25D366] active:scale-90 transition-all text-[#25D366] shadow-sm"
                          aria-label="WhatsApp Developer"
                          title="WhatsApp Developer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://www.instagram.com/4nur4gmishr4?igsh=MTZkb3N6NDNhc2kwaQ=="
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-accent active:scale-90 transition-all text-mid hover:text-hi shadow-sm"
                          aria-label="Instagram Developer"
                          title="Instagram Developer"
                        >
                          <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                        <a
                          href="https://github.com/4nur4gmishr4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated hover:border-hi active:scale-90 transition-all text-mid hover:text-hi shadow-sm"
                          aria-label="GitHub Developer"
                          title="GitHub Developer"
                        >
                          <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </>
  );
}
