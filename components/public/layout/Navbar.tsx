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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@/components/ui/primitives/Portal";
import { AnimatedProfile } from "@/components/ui/icons";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const ProfileModal = dynamic(() => import("@/components/ui/primitives/ProfileModal"), { ssr: false });
const LoginModal = dynamic(() => import("@/components/ui/primitives/LoginModal"), { ssr: false });
const WelcomeModal = dynamic(() => import("@/components/ui/primitives/WelcomeModal"), { ssr: false });

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user, isLoggedIn, isLoading, showLoginModal, setShowLoginModal, showWelcome, setShowWelcome } = useUserAuth();
  const { theme, setTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 15);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock document scroll without layout shift when menu is open
  useEffect(() => {
    if (isOpen) {
      lockScroll("navbar-mobile-menu");
      document.body.classList.add("mobile-menu-open");
    } else {
      unlockScroll("navbar-mobile-menu");
      document.body.classList.remove("mobile-menu-open");
    }
    window.dispatchEvent(new CustomEvent("brofit-nav-toggle", { detail: { isOpen } }));
    return () => {
      unlockScroll("navbar-mobile-menu");
      document.body.classList.remove("mobile-menu-open");
      window.dispatchEvent(new CustomEvent("brofit-nav-toggle", { detail: { isOpen: false } }));
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const navLinks = [
    { name: "Home", id: "/", num: "01" },
    { name: "Workouts", id: "/workouts", num: "02" },
    { name: "Diet Planner", id: "/fuel", num: "03" },
    { name: "Calculators", id: "/calculators", num: "04" },
    { name: "Pricing", id: "/pricing", num: "05" },
    { name: "Quotes", id: "/quotes", num: "06" },
    { name: "Awards", id: "/trophy-room", num: "07" },
  ];

  const handleMenuClick = (id: string) => {
    setIsOpen(false);
    router.push(id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  return (
    <>
      {/* Editorial Apple-Grade Navigation Header - Permanently Fixed */}
      <header
        className={`fixed top-0 left-0 right-0 z-[200] w-full select-none transition-colors duration-200 ${
          isOpen
            ? "bg-surface-canvas border-b border-surface-border shadow-xs"
            : isScrolled
            ? "bg-surface-canvas/95 backdrop-blur-md border-b border-surface-border/80 shadow-xs"
            : "bg-surface-canvas/80 backdrop-blur-md border-b border-surface-border/40"
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
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-hi hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-90 transition-all duration-150 shadow-sm"
                aria-label="Brother's Fitness Instagram"
                title="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4 transition-colors" />
              </a>

              {/* Option 3: WhatsApp Inquiry */}
              <a
                href="https://wa.me/919131179343"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-hi hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-90 transition-all duration-150 shadow-sm"
                aria-label="Chat on WhatsApp"
                title="Chat on WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 transition-colors" />
              </a>

                  {/* Option 4: User Auth / Profile */}
                  <div className="relative">
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
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border hover:bg-surface-elevated active:scale-90 transition-all duration-150 shadow-sm overflow-hidden relative cursor-pointer"
                      aria-label="Profile"
                      title={isLoggedIn ? `Logged in as ${user?.full_name || user?.email}` : "Sign In with Google"}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 rounded-full skeleton" />
                      ) : isLoggedIn && user?.photo_url ? (
                        <Image
                          src={user.photo_url}
                          alt={user.full_name || "Profile Photo"}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : isLoggedIn ? (
                        <div className="w-full h-full rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs uppercase">
                          {user?.full_name ? user.full_name.charAt(0) : "U"}
                        </div>
                      ) : (
                        <AnimatedProfile size={18} className="text-hi" />
                      )}
                    </button>
                    {isLoggedIn && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-status-success ring-2 ring-surface-card pointer-events-none" />
                    )}
                  </div>

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
      {/* Spacer to preserve normal document flow beneath permanently fixed header */}
      <div className="h-16 sm:h-20 shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Solid Opaque Full-Screen Navigation Menu mounted to Body via Portal */}
      <AnimatePresence>
        {isOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed top-16 sm:top-20 inset-x-0 bottom-0 z-[190] bg-surface-canvas overflow-y-auto overscroll-contain touch-pan-y w-full h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] flex flex-col scrollbar-hide"
              role="dialog"
              aria-modal="true"
            >
              {/* Staggered Navigation Body */}
              <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-10 md:py-14">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                
                {/* Left Column: Big Staggered Links */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Mobile Quick Profile / Sign-in Card */}
                  {isLoggedIn && user ? (
                    <div
                      onClick={() => {
                        setIsOpen(false);
                        setShowProfileModal(true);
                      }}
                      className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3 hover:border-accent transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-black border border-white/10 shrink-0">
                          {user.photo_url ? (
                            <Image
                              src={user.photo_url}
                              alt={user.full_name || "Profile Photo"}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                              {user.full_name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-hi truncate group-hover:text-accent transition-colors">
                            {user.full_name || "Valued Member"}
                          </p>
                          <p className="text-xs text-mid truncate">
                            {user.email} &bull; <span className="text-accent font-semibold">{user.daily_credits} Credits</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full shrink-0">
                        Edit Profile
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setIsOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3 hover:border-accent transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <AnimatedProfile size={22} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-hi">Member Sign In</p>
                          <p className="text-xs text-mid">Sign in with Google for AI credits</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white bg-accent px-3 py-1.5 rounded-full shrink-0">
                        Sign In
                      </span>
                    </div>
                  )}

                  <span className="text-xs uppercase tracking-widest text-accent block font-semibold pt-2">
                    ALL PAGES
                  </span>

                  <nav className="space-y-2" aria-label="Main Navigation">
                    {navLinks.map((item) => {
                      const isActive = pathname === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.id)}
                          className="group w-full py-3 sm:py-4 flex items-center justify-between border-b border-surface-border/60 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4 sm:gap-6">
                            <span className="text-xs text-mid group-hover:text-accent transition-colors font-medium">
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
                  </nav>
                </div>

                {/* Right Column: People & Direct Access with Coaches + Separate System Architect */}
                <div className="lg:col-span-5 space-y-6 pt-4 lg:pt-0">
                  
                  {/* Part 1: Gym Coaches */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
                      <span className="text-xs uppercase tracking-widest text-accent font-semibold">
                        GYM COACHES &amp; TRAINERS
                      </span>
                      <span className="text-[11px] text-mid font-medium">2 Coaches</span>
                    </div>

                    <div className="space-y-3">
                      {/* 01 Aman Shrivastava */}
                      <div className="group w-full pb-3 border-b border-surface-border/60 flex items-center justify-between gap-3 text-left transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                          {/* Pebble Shaped Image Avatar */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[22px] overflow-hidden border border-surface-border bg-surface-soft shrink-0 shadow-sm relative group-hover:border-accent group-hover:scale-105 transition-all duration-200">
                            <Image
                              src="/assets/aman.jpeg"
                              alt="Aman Shrivastava"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="truncate">
                            <span className="text-base sm:text-lg font-bold tracking-tight text-hi group-hover:text-accent transition-colors block truncate">
                              Aman Shrivastava
                            </span>
                            <span className="text-xs text-mid truncate block mt-0.5 font-medium">
                              Founder &bull; Head Coach
                            </span>
                          </div>
                        </div>

                        {/* 3 Action Buttons: Call (slight blue hover), WhatsApp (slight green hover), Insta (slight pink hover) */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <a
                            href="tel:+919131179343"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#007AFF] hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 active:scale-90 transition-all shadow-sm"
                            aria-label="Call Aman"
                            title="Call Aman"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href="https://wa.me/919131179343"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-90 transition-all shadow-sm"
                            aria-label="WhatsApp Aman"
                            title="WhatsApp Aman"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </a>
                          <a
                            href="https://www.instagram.com/aman_shrivastavaaa72"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-90 transition-all shadow-sm"
                            aria-label="Instagram Aman"
                            title="Instagram Aman"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* 02 Pradeep Shrivastava */}
                      <div className="group w-full flex items-center justify-between gap-3 text-left transition-colors">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                          {/* Pebble Shaped Image Avatar */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[22px] overflow-hidden border border-surface-border bg-surface-soft shrink-0 shadow-sm relative group-hover:border-accent group-hover:scale-105 transition-all duration-200">
                            <Image
                              src="/assets/pradeep.jpeg"
                              alt="Pradeep Shrivastava"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="truncate">
                            <span className="text-base sm:text-lg font-bold tracking-tight text-hi group-hover:text-accent transition-colors block truncate">
                              Pradeep Shrivastava
                            </span>
                            <span className="text-xs text-mid truncate block mt-0.5 font-medium">
                              Co-Founder &bull; Senior Trainer
                            </span>
                          </div>
                        </div>

                        {/* 3 Action Buttons: Call, WhatsApp, Insta */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <a
                            href="tel:+919131272754"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#007AFF] hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 active:scale-90 transition-all shadow-sm"
                            aria-label="Call Pradeep"
                            title="Call Pradeep"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href="https://wa.me/919131272754"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-90 transition-all shadow-sm"
                            aria-label="WhatsApp Pradeep"
                            title="WhatsApp Pradeep"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </a>
                          <a
                            href="https://www.instagram.com/brothers_fitness_17"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-90 transition-all shadow-sm"
                            aria-label="Instagram Pradeep"
                            title="Instagram Pradeep"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Individual System Architect Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
                      <span className="text-xs uppercase tracking-widest text-accent font-semibold">
                        SYSTEM ARCHITECT &amp; DEVELOPER
                      </span>
                      <span className="text-[11px] text-mid font-medium">Engineering</span>
                    </div>

                    <div className="group w-full flex items-center justify-between gap-3 text-left transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                        {/* Pebble Shaped Image Avatar */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[22px] overflow-hidden border border-surface-border bg-surface-soft shrink-0 shadow-sm relative group-hover:border-accent group-hover:scale-105 transition-all duration-200">
                          <Image
                            src="https://github.com/4nur4gmishr4.png"
                            alt="Anurag Mishra"
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="truncate">
                          <span className="text-base sm:text-lg font-bold tracking-tight text-hi group-hover:text-accent transition-colors block truncate">
                            Anurag Mishra
                          </span>
                          <span className="text-xs text-mid truncate block mt-0.5 font-medium">
                            System Architect &bull; Full Stack
                          </span>
                        </div>
                      </div>

                      {/* 4 Action Buttons: Call (blue), WhatsApp (green), Insta (pink), GitHub (purplish blue) */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <a
                          href="tel:+919302786886"
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#007AFF] hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 active:scale-90 transition-all shadow-sm"
                          aria-label="Call Anurag"
                          title="Call Anurag"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href="https://wa.me/919302786886"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-90 transition-all shadow-sm"
                          aria-label="WhatsApp Anurag"
                          title="WhatsApp Anurag"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                        </a>
                        <a
                          href="https://www.instagram.com/4nur4gmishr4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-90 transition-all shadow-sm"
                          aria-label="Instagram Anurag"
                          title="Instagram Anurag"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                        <a
                          href="https://github.com/4nur4gmishr4"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-card border border-surface-border text-mid hover:text-[#8b5cf6] hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/10 active:scale-90 transition-all shadow-sm"
                          aria-label="GitHub Anurag"
                          title="GitHub Anurag"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </>
  );
}
