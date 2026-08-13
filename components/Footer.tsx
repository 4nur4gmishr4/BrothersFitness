"use client";

import { MapPin, Phone, Mail, Sparkles, FolderOpen, Code, Instagram } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
const taglines = [
  "PAIN IS TEMPORARY. PRIDE IS FOREVER.",
  "JOIN THE BROTHERHOOD.",
  "NO PAIN, NO GAIN.",
];

export default function Footer() {
  const [currentTagline, setCurrentTagline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Workouts", href: "/workouts" },
    { name: "Diet Planner", href: "/fuel" },
    { name: "Calculators", href: "/calculators" },
    { name: "Pricing", href: "/pricing" },
    { name: "Quotes", href: "/quotes" },
  ];

  const devPhone = "9302786886";
  const devWhatsApp = "919302786886";

  return (
    <footer className="bg-surface-canvas text-hi py-16 md:py-20 relative overflow-hidden border-t border-accent/20">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(var(--accent-color) 1px, transparent 1px), linear-gradient(90deg, var(--accent-color) 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {/* Brand */}
          <div className="p-6 border border-surface-border bg-surface-card relative group">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent opacity-50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent opacity-50" />
            <h3 className="heading-display text-2xl text-hi mb-4 tracking-widest">
              BROTHER&apos;S<br/><span className="text-accent">FITNESS</span>
            </h3>
            <div className="min-h-[1.5rem] mb-6">
              <p className="body-text text-[10px] text-accent font-mono uppercase tracking-widest">
                {taglines[currentTagline]}
              </p>
            </div>
            <Link href="/quotes" className="btn-primary w-full justify-center text-xs tracking-wider">
              <Sparkles className="w-3 h-3" /> GET STARTED
            </Link>
          </div>

          {/* Quick links */}
          <div className="p-6 border border-surface-border bg-surface-card">
            <h4 className="text-[10px] uppercase tracking-widest text-faint mb-4 font-mono">
              QUICK LINKS
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-xs font-mono text-mid hover:text-accent transition-colors duration-200"
                  >
                    <div className="w-3 h-3 opacity-50">
                      <FolderOpen className="w-full h-full text-hi group-hover:scale-110 group-hover:text-accent transition-all duration-300" />
                    </div>
                    {link.name.toUpperCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="p-6 border border-surface-border bg-surface-card">
            <h4 className="text-[10px] uppercase tracking-widest text-faint mb-4 font-mono">
              CONTACT US
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-xs font-mono text-mid">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <span>LAKHNADON, MP, 480886</span>
              </li>
              <li className="flex items-start gap-3 text-xs font-mono text-mid">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <a href="tel:+919131179343" className="hover:text-accent transition-colors">
                    +91 91311 79343 (AMAN)
                  </a>
                  <a href="tel:+919131272754" className="hover:text-accent transition-colors">
                    +91 91312 72754 (PRADEEP)
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-xs font-mono text-mid">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <a href="mailto:brothersfitnesszone@gmail.com" className="hover:text-accent transition-colors break-all">
                  BROTHERSFITNESSZONE@GMAIL.COM
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="p-6 border border-surface-border bg-surface-card">
            <h4 className="text-[10px] uppercase tracking-widest text-faint mb-4 font-mono">
              HOURS
            </h4>
            <div className="space-y-4 text-xs font-mono text-mid">
              <div className="p-3 border border-surface-border/50 bg-surface-soft">
                <p className="text-faint mb-1">MON - SAT</p>
                <p className="text-accent">06:00 - 22:00</p>
              </div>
              <div className="p-3 border border-status-danger/20 bg-status-danger/5">
                <p className="text-faint mb-1">SUNDAY</p>
                <p className="text-status-danger animate-pulse">OFFLINE</p>
              </div>
            </div>
          </div>
        </div>

        {/* 
          Unique Developer Credits Section 
          Hyper-focused layout for Anurag Mishra
        */}
        <div className="mt-12 p-1 relative group overflow-hidden">
          {/* Animated gradient border wrapper */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-transparent to-accent opacity-20 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative bg-surface-soft border border-accent/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 border border-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(215,25,33,0.3)]">
                <div className="w-6 h-6">
                  <Code className="w-full h-full text-accent group-hover:scale-110 transition-all duration-300" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-1">
                  DEVELOPER
                </p>
                <h4 className="heading-display text-xl md:text-2xl text-hi tracking-widest">
                  ANURAG MISHRA
                </h4>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${devWhatsApp}?text=Hi%20Anurag,%20I%20saw%20your%20work%20on%20Brothers%20Fitness.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-surface-card border border-surface-border hover:border-accent hover:bg-accent/10 flex items-center justify-center transition-all duration-300"
                title="Connect via WhatsApp"
              >
                <div className="w-6 h-6 opacity-70 group-hover:opacity-100">
                  <Mail className="w-full h-full text-hi group-hover:text-accent group-hover:scale-110 transition-all duration-300" />
                </div>
              </a>
              <a
                href="https://www.instagram.com/4nur4gmishr4?igsh=MTZkb3N6NDNhc2kwaQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-surface-card border border-surface-border hover:border-accent hover:bg-accent/10 flex items-center justify-center transition-all duration-300"
                title="Follow on Instagram"
              >
                <div className="w-6 h-6 opacity-70 group-hover:opacity-100">
                  <Instagram className="w-full h-full text-hi group-hover:text-accent group-hover:scale-110 transition-all duration-300" />
                </div>
              </a>
              <a
                href={`tel:${devPhone}`}
                className="w-12 h-12 bg-surface-card border border-surface-border hover:border-accent hover:bg-accent/10 flex items-center justify-center transition-all duration-300"
                title="Direct Comms"
              >
                <Phone className="w-5 h-5 text-mid group-hover:text-accent" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-faint tracking-widest uppercase">
            Â© 2026 BROTHER&apos;S FITNESS [ PLATFORM LIVE ]
          </p>
          <p className="text-[10px] font-mono text-faint tracking-widest uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            LAKHNADON BRANCH OPEN
          </p>
        </div>
      </div>
    </footer>
  );
}



