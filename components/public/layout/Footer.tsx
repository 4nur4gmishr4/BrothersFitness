"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Dumbbell,
  ExternalLink,
  Flame,
  Calculator,
  Trophy,
  Quote,
  CreditCard,
  Code2,
  Instagram,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedWhatsApp } from "@/components/ui/icons";

interface FooterLink {
  name: string;
  href: string;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterLogo {
  url: string;
  src: string;
  alt: string;
  title: string;
}

export interface FooterProps {
  logo?: FooterLogo;
  description?: string;
  sections?: FooterSection[];
  copyright?: string;
  className?: string;
}

const defaultBroFitSections: FooterSection[] = [
  {
    title: "Workouts & Food",
    links: [
      { name: "All Workouts", href: "/workouts", icon: Dumbbell },
      { name: "Meal Planner", href: "/fuel", icon: Flame },
      { name: "Body Calculators", href: "/calculators", icon: Calculator },
      { name: "Awards & Badges", href: "/trophy-room", icon: Trophy },
      { name: "Gym Passes & Prices", href: "/pricing", icon: CreditCard },
      { name: "Daily Motivation", href: "/quotes", icon: Quote },
    ],
  },
  {
    title: "Gym Location & Hours",
    links: [
      { name: "Near Civil Court, Seoni Road", href: "https://maps.google.com/?q=Brothers+Fitness+Lakhnadon", external: true, icon: MapPin },
      { name: "Mon – Sat: 6:00 AM – 10:00 PM", href: "https://maps.google.com/?q=Brothers+Fitness+Lakhnadon", external: true, icon: Clock },
      { name: "Women's Batch: 4:30 – 6:30 PM", href: "#timings", icon: Clock },
      { name: "Sunday: Rest Day (Closed)", href: "#timings", icon: Clock },
    ],
  },
  {
    title: "Coaches & Direct Contact",
    links: [
      { name: "Coach Aman: 91311 79343", href: "tel:+919131179343", external: true, icon: Phone },
      { name: "Coach Pradeep: 91312 72754", href: "tel:+919131272754", external: true, icon: Phone },
      { name: "Gym Email", href: "mailto:brothersfitnesszone@gmail.com", external: true, icon: Mail },
      { name: "Gym Instagram", href: "https://www.instagram.com/brothers_fitness_17", external: true, icon: Instagram },
    ],
  },
  {
    title: "Developer & Engineering",
    links: [
      { name: "Anurag Mishra (Lead Dev)", href: "https://github.com/4nur4gmishr4", external: true, icon: Code2 },
      { name: "GitHub Profile", href: "https://github.com/4nur4gmishr4", external: true, icon: Github },
      { name: "WhatsApp Developer", href: "https://wa.me/919302786886?text=Hi%20Anurag", external: true, icon: AnimatedWhatsApp },
      { name: "Developer Email", href: "mailto:anurag.mishra.core@gmail.com", external: true, icon: Mail },
    ],
  },
];

const defaultProps: FooterProps = {
  logo: {
    url: "/",
    src: "/assets/favicon.png",
    alt: "Brother's Fitness Logo",
    title: "Brother's Fitness",
  },
  description:
    "Easy gym workouts, custom meal plans, and simple fitness tools for Brother's Fitness in Lakhnadon.",
  sections: defaultBroFitSections,
  copyright: `© ${new Date().getFullYear()} BROTHER'S FITNESS • ALL RIGHTS RESERVED`,
};

export const Footer = (props: Partial<FooterProps>) => {
  const { logo, description, sections, copyright, className } = {
    ...defaultProps,
    ...props,
  };

  return (
    <footer className={cn("w-full bg-surface-canvas text-hi border-t border-surface-border py-12 sm:py-16 selection:bg-accent selection:text-white", className)}>
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20">
        
        {/* Main Grid: 2 columns on mobile (brand spanning 2, nav columns 2x2), 6 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-8 lg:gap-10">
          
          {/* Brand Info (Full width span-2 on mobile, 2 columns on desktop) */}
          <div className="col-span-2 lg:col-span-2 flex flex-col justify-between pb-4 lg:pb-0 border-b border-surface-border/50 lg:border-b-0">
            <div>
              <Link href={logo?.url || "/"} className="inline-flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-black border border-white/10 p-1.5 flex items-center justify-center shadow-md group-hover:border-accent transition-colors shrink-0">
                  <Image
                    src={logo?.src || "/assets/favicon.png"}
                    alt={logo?.alt || "Logo"}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-xl uppercase tracking-wider text-hi">
                    BROTHER&apos;S <span className="text-accent">FITNESS</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-faint mt-0.5 font-medium">
                    Lakhnadon &bull; Gym &amp; Fitness
                  </span>
                </div>
              </Link>

              <p className="mt-4 text-xs leading-relaxed text-mid max-w-sm">
                {description}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs uppercase tracking-wider font-bold bg-accent text-white hover:bg-accent-hover active:scale-95 transition-all shadow-md"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Join The Gym</span>
              </Link>

              <a
                href="mailto:brothersfitnesszone@gmail.com"
                className="p-2 rounded-md bg-surface-card border border-surface-border text-mid hover:text-accent hover:border-accent/40 hover:bg-accent/10 active:scale-95 transition-all shadow-xs flex items-center justify-center"
                aria-label="Gym Email"
                title="Email Gym (brothersfitnesszone@gmail.com)"
              >
                <Mail className="w-4 h-4 transition-colors" />
              </a>

              <a
                href="https://www.instagram.com/brothers_fitness_17"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-md bg-surface-card border border-surface-border text-mid hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-95 transition-all shadow-xs flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 transition-colors" />
              </a>

              <a
                href="https://wa.me/919131179343"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-md bg-surface-card border border-surface-border text-mid hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-95 transition-all shadow-xs flex items-center justify-center"
                aria-label="WhatsApp"
              >
                <AnimatedWhatsApp size={16} />
              </a>
            </div>
          </div>

          {/* Nav Columns (4 unique columns, 2x2 on mobile, 1 col each on desktop) */}
          {(sections ?? []).map((section, idx) => (
            <div key={idx} className="flex flex-col">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-hi flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {section.title}
              </h3>
              <ul className="space-y-3 text-xs text-mid">
                {section.links.map((link, linkIdx) => {
                  const Icon = link.icon;
                  const isExternal = link.external || link.href.startsWith("http") || link.href.startsWith("tel:") || link.href.startsWith("mailto:");

                  return (
                    <li key={linkIdx}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target={link.href.startsWith("http") ? "_blank" : undefined}
                          rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                          className="inline-flex items-center gap-2 text-mid hover:text-hi transition-colors group"
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 text-mid group-hover:text-hi shrink-0 transition-colors" />}
                          <span className="truncate">{link.name}</span>
                          {link.href.startsWith("http") && <ExternalLink className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-2 text-mid hover:text-hi transition-colors group"
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 text-mid group-hover:text-hi shrink-0 transition-colors" />}
                          <span>{link.name}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom Quick Action Dock: Center-aligned, simple, unique & tactile */}
        <div className="mt-10 pt-6 border-t border-surface-border/70 flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-surface-card border border-surface-border shadow-xs overflow-x-auto max-w-full">
            <a
              href="tel:+919131179343"
              className="px-3 py-2 rounded-xl bg-surface-soft border border-surface-border text-mid hover:text-[#007AFF] hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs shrink-0"
              title="Call Gym (+91 91311 79343)"
              aria-label="Call Gym"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            <a
              href="https://wa.me/919131179343"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-surface-soft border border-surface-border text-mid hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs shrink-0"
              title="WhatsApp Gym (+91 91311 79343)"
              aria-label="WhatsApp Gym"
            >
              <AnimatedWhatsApp size={14} />
              <span>WhatsApp</span>
            </a>

            <a
              href="https://www.instagram.com/brothers_fitness_17"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-surface-soft border border-surface-border text-mid hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs shrink-0"
              title="Gym Instagram (@brothers_fitness_17)"
              aria-label="Gym Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>

            <a
              href="https://github.com/4nur4gmishr4"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-surface-soft border border-surface-border text-mid hover:text-hi hover:border-hi/40 hover:bg-surface-elevated active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs shrink-0"
              title="GitHub Profile (Anurag Mishra)"
              aria-label="GitHub Profile"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            <a
              href="mailto:brothersfitnesszone@gmail.com"
              className="px-3 py-2 rounded-xl bg-surface-soft border border-surface-border text-mid hover:text-accent hover:border-accent/40 hover:bg-accent/10 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs shrink-0"
              title="Email Gym (brothersfitnesszone@gmail.com)"
              aria-label="Email Gym"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mail</span>
            </a>
          </div>
        </div>

        {/* Bottom Sub-strip */}
        <div className="mt-6 pt-4 border-t border-surface-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mid">
          <p className="flex items-center gap-2">
            <span>{copyright}</span>
          </p>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-surface-border text-hi text-[11px] font-semibold tracking-wide shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>Lakhnadon Branch Open</span>
            </div>

            <a
              href="https://wa.me/919302786886?text=Hi%20Anurag"
              target="_blank"
              rel="noreferrer"
              className="text-faint hover:text-[#8b5cf6] transition-colors"
            >
              Architect: Anurag Mishra
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
