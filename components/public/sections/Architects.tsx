"use client";

import TiltedCard from "@/components/ui/animations/TiltedCard";
import { AnimatedPhone, AnimatedWhatsApp } from "@/components/ui/icons";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.668.014-4.948.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const coaches = [
  {
    name: "Aman Shrivastava",
    role: "Founder & Head Coach",
    specialization: "Strength & Muscle Building",
    src: "/assets/aman.jpeg",
    phone: "+919131179343",
    instagram: "https://www.instagram.com/aman_shrivastavaaa72",
    whatsapp: "919131179343",
  },
  {
    name: "Pradeep Shrivastava",
    role: "Co-Founder & Senior Trainer",
    specialization: "Fast Fat Burn & Daily Fitness",
    src: "/assets/pradeep.jpeg",
    phone: "+919131272754",
    instagram: "https://www.instagram.com/brothers_fitness_17",
    whatsapp: "919131272754",
  },
];

export default function Architects() {
  return (
    <section id="architects" className="w-full h-full select-none">
      <div className="w-full">
        
        {/* Apple-style Clean Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">
              MEET THE COACHES
            </p>
            <h2 className="heading-display text-4xl md:text-5xl lg:text-6xl text-hi leading-[0.95] tracking-tight uppercase">
              MEET OUR GYM <span className="text-accent">COACHES</span>
            </h2>
          </div>
          
          <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-surface-border pl-4 md:pl-0 md:pr-4">
            <p className="text-sm font-medium text-hi">Friendly &amp; Helpful Gym Trainers</p>
            <p className="text-xs text-mid">Helping you get strong, eat healthy, and stay fit</p>
          </div>
        </div>

        {/* Directory Grid with Symmetric Matching Width & Length */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {coaches.map((c, idx) => (
            <div 
              key={c.name}
              data-reveal
              style={{ "--reveal-delay": `${idx * 150}ms` } as React.CSSProperties}
              className="w-full max-w-[460px] mx-auto flex flex-col gap-5"
            >
              {/* 1. Pure Clean Image 3D Tilted Card */}
              <div className="w-full">
                <TiltedCard
                  imageSrc={c.src}
                  altText={`${c.name} - ${c.role}`}
                  showTooltip={false}
                  showMobileWarning={false}
                  displayOverlayContent={false}
                  aspectSquare={true}
                  rotateAmplitude={10}
                  scaleOnHover={1.03}
                  className="w-full"
                />
              </div>

              {/* 2. Apple-Style Clean Symmetrical Divider Info Card */}
              <div className="w-full">
                <TiltedCard
                  aspectSquare={false}
                  rotateAmplitude={8}
                  scaleOnHover={1.02}
                  className="w-full"
                >
                  <div className="w-full p-6 sm:p-7 flex flex-col bg-surface-card rounded-2xl border border-surface-border transition-all duration-200 hover:border-surface-border/90 hover:bg-surface-card/95 shadow-sm">
                    
                    {/* Header Row: Name & Title (Equal Height with Apple Row Hover) */}
                    <div className="min-h-[58px] flex flex-col justify-center -mx-2 px-2 py-1 rounded-xl transition-colors duration-150 hover:bg-surface-elevated/40">
                      <h3 className="text-2xl sm:text-3xl font-bold text-hi tracking-tight leading-tight">
                        {c.name}
                      </h3>
                      <p className="text-sm font-medium text-accent mt-1">
                        {c.role}
                      </p>
                    </div>

                    {/* Apple Hairline Divider 1 (Exact Full Width) */}
                    <div className="w-full border-t border-surface-border/70 my-4" />

                    {/* Spec Row: Focus / Specialization (Equal Height with Apple Row Hover) */}
                    <div className="w-full flex justify-between items-center text-sm py-1.5 -mx-2 px-2 rounded-xl transition-colors duration-150 hover:bg-surface-elevated/40">
                      <span className="text-xs text-mid font-medium">Focus Area</span>
                      <span className="text-xs sm:text-sm font-semibold text-hi text-right">
                        {c.specialization}
                      </span>
                    </div>

                    {/* Apple Hairline Divider 2 (Exact Full Width) */}
                    <div className="w-full border-t border-surface-border/70 my-4" />

                    {/* Connect Actions Row: Monochrome Exact Shape Logos with iOS Tactile Hover/Active States */}
                    <div className="w-full flex items-center justify-end gap-2.5">
                      {/* Call Button (slight blue hover) */}
                      <a
                        href={`tel:${c.phone}`}
                        aria-label={`Call ${c.name}`}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mid hover:text-[#007AFF] hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 active:scale-95 transition-all duration-150 group shadow-sm"
                      >
                        <AnimatedPhone size={18} />
                      </a>

                      {/* Instagram Button (slight pink hover) */}
                      {c.instagram && (
                        <a
                          href={c.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${c.name} on Instagram`}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mid hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10 active:scale-95 transition-all duration-150 group shadow-sm"
                        >
                          <InstagramIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
                        </a>
                      )}

                      {/* WhatsApp Button (slight green hover) */}
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp}?text=Hi%20${encodeURIComponent(c.name)},%20I'm%20interested%20in%20joining%20Brother's%20Fitness!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${c.name} on WhatsApp`}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-elevated border border-surface-border text-mid hover:text-[#25D366] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 active:scale-95 transition-all duration-150 group shadow-sm"
                        >
                          <AnimatedWhatsApp size={18} />
                        </a>
                      )}
                    </div>

                  </div>
                </TiltedCard>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
