"use client";

import { MapPin, Phone, Mail, Sparkles, Instagram, MessageCircle } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const taglines = [
  "PAIN IS TEMPORARY. PRIDE IS FOREVER.",
  "JOIN THE BROTHERHOOD.",
  "NO PAIN, NO GAIN.",
  "TRAIN INSANE OR REMAIN THE SAME."
];

export default function Footer() {
  const [currentTagline, setCurrentTagline] = useState(0);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const quickLinks = [
    { name: "Operations", href: "#operations" },
    { name: "Protocol", href: "#protocol" },
    { name: "Architects", href: "#architects" },
    { name: "Fuel", href: "#fuel" },
    { name: "Payment", href: "#payment" },
    { name: "Diagnostics", href: "#diagnostics" },
    { name: "Contact", href: "#contact" },
    { name: "Quotes", href: "/quotes", external: true },
  ];

  const devPhone = "9302786886";
  const devWhatsApp = "919302786886";

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-black text-white py-12 md:py-16 relative overflow-hidden">
      {/* Background animation - desktop only */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(215, 25, 33, 0.1) 0px, transparent 2px, transparent 20px)"
          }}
          animate={{
            backgroundPosition: ["0px 0px", "0px 20px"]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h3
              className="text-2xl font-display font-black tracking-tight mb-4"
              animate={{
                textShadow: [
                  "0 0 0px rgba(215, 25, 33, 0)",
                  "0 0 20px rgba(215, 25, 33, 0.5)",
                  "0 0 0px rgba(215, 25, 33, 0)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              BROTHER&apos;S FITNESS
            </motion.h3>

            {/* Rotating Tagline */}
            <div className="h-12 mb-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTagline}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm text-gray-400 font-mono leading-relaxed"
                >
                  {taglines[currentTagline]}
                </motion.p>
              </AnimatePresence>
            </div>

            <Link href="/quotes">
              <motion.button
                className="flex items-center gap-2 px-5 py-3 bg-gym-red text-white text-xs font-mono uppercase tracking-wider hover:bg-white hover:text-black transition-colors w-full justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4" />
                Daily Fueling Quotes
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="label-text text-gym-red mb-4">
              QUICK LINKS
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  {link.external ? (
                    <Link href={link.href} target="_blank">
                      <motion.span
                        className="text-sm hover:text-gym-red transition-colors inline-block relative group cursor-pointer"
                        whileHover={{ x: 5 }}
                      >
                        {link.name}
                        <motion.span
                          className="absolute bottom-0 left-0 h-0.5 bg-gym-red"
                          initial={{ width: "0%" }}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.span>
                    </Link>
                  ) : (
                    <motion.a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(link.href);
                      }}
                      className="text-sm hover:text-gym-red transition-colors inline-block relative group cursor-pointer"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-gym-red"
                        initial={{ width: "0%" }}
                        whileHover={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.a>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="label-text text-gym-red mb-4">
              CONTACT INFO
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Lakhnadon, Madhya Pradesh, 480886</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+919131179343" className="hover:text-gym-red transition-colors">
                  +91 91311 79343
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:brothersfitnesszone@gmail.com" className="hover:text-gym-red transition-colors break-all">
                  brothersfitnesszone@gmail.com
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="label-text text-gym-red mb-4">
              HOURS
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-400">Mon - Sat</p>
                <p className="font-semibold">6:00 AM - 10:00 PM</p>
              </div>
              <div>
                <p className="text-gray-400">Sunday</p>
                <p className="font-semibold text-gym-red">CLOSED</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Developer Credits Section - Redesigned (Row Layout) */}
        <DeveloperSection devPhone={devPhone} devWhatsApp={devWhatsApp} />

        {/* Copyright */}
        <motion.div
          className="border-t border-white/10 pt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-mono text-gray-400">
              © 2024 BROTHER&apos;S FITNESS. ALL RIGHTS RESERVED.
            </p>
            <motion.p
              className="text-xs font-mono text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              EST. 2024 // GYM OS v1.0
            </motion.p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

function DeveloperSection({ devPhone, devWhatsApp }: { devPhone: string; devWhatsApp: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setIsLoading(false), 2000); // 2 second mock load
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      className="border-t border-white/10 pt-8 pb-10 flex justify-center mb-8"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="relative p-[1px] rounded-2xl overflow-hidden group w-full max-w-4xl transform scale-95 md:scale-100 origin-bottom">
        {/* Continuous Glowing Red Circular Running Border Animation */}
        <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_340deg,#D71921_360deg)] animate-[spin_4s_linear_infinite]" />

        {/* Inner black background */}
        <div className="absolute inset-[1px] bg-black rounded-2xl z-10" />

        <div className="relative z-20 bg-white/5 backdrop-blur-md rounded-2xl p-4 md:p-6 overflow-hidden min-h-[100px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                {/* Gym Themed Loader */}
                <div className="relative w-10 h-10">
                  <motion.div
                    className="absolute inset-0 border-2 border-white/10 border-t-gym-red rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 border-2 border-white/10 border-b-gym-red rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gym-red rounded-full animate-pulse" />
                  </div>
                </div>

                <p className="text-[10px] font-mono uppercase tracking-widest text-white/50 animate-pulse">
                  System Initializing...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 px-2"
              >
                {/* Left Side: Text */}
                <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
                  <h3 className="text-xs md:text-sm font-mono text-gray-400 uppercase tracking-wider">
                    Designed, Developed & Managed By <span className="text-gym-red mx-1 hidden md:inline">–</span>
                  </h3>
                  <h3 className="text-base md:text-lg font-display font-black text-white tracking-tight">
                    ANURAG MISHRA
                  </h3>
                </div>

                {/* Right Side: 3 Action Icons */}
                <div className="flex items-center gap-3">
                  {/* WhatsApp Button - Outline Style */}
                  <motion.a
                    href={`https://wa.me/${devWhatsApp}?text=Hi%20Anurag,%20I%20saw%20your%20work%20on%20Brothers%20Fitness.`}
                    target="_blank"
                    className="w-9 h-9 flex items-center justify-center border border-white/20 text-white hover:border-gym-red hover:text-gym-red hover:bg-white/5 transition-all rounded"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </motion.a>

                  {/* Instagram */}
                  <motion.a
                    href="https://www.instagram.com/4nur4gmishr4?igsh=MTZkb3N6NDNhc2kwaQ=="
                    target="_blank"
                    className="w-9 h-9 flex items-center justify-center border border-white/20 text-white hover:border-gym-red hover:text-gym-red hover:bg-white/5 transition-all rounded"
                    whileHover={{ scale: 1.15, rotate: -5 }}
                    whileTap={{ scale: 0.9 }}
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </motion.a>

                  {/* Phone */}
                  <motion.a
                    href={`tel:${devPhone}`}
                    className="w-9 h-9 flex items-center justify-center border border-white/20 text-white hover:border-gym-red hover:text-gym-red hover:bg-white/5 transition-all rounded"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    title="Call Now"
                  >
                    <Phone className="w-4 h-4" />
                  </motion.a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
