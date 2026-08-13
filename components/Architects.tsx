"use client";

import Image from "next/image";
import { useState } from "react";
import { Scales } from "@/components/ui/scales";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

export default function Architects() {
  const [tappedCard, setTappedCard] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const trainers = [
    {
      name: "AMAN",
      role: "HEAD COACH // FOUNDER",
      spec: "STRENGTH & CONDITIONING",
      src: "/assets/aman.jpeg",
      id: "001",
      isMain: true,
      instagram: "https://www.instagram.com/aman_shrivastavaaa?igsh=MWJ5MHhodnJrY3BoNA==",
      whatsapp: "919131179343", // Added WhatsApp for Aman
    },
    {
      name: "PRADEEP",
      role: "SENIOR TRAINER",
      spec: "FUNCTIONAL & HIIT",
      src: "/assets/pradeep.jpeg",
      id: "002",
      isMain: false,
      instagram: "https://www.instagram.com/brothers_fitness_17", // Added Gym Insta for Pradeep
      whatsapp: "919131272754",
    },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      setRotation(prev => prev - 180);
    } else if (distance < -minSwipeDistance) {
      setRotation(prev => prev + 180);
    }
    
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const TrainerCard = ({ t, isInteractive }: { t: any, isInteractive: boolean }) => (
    <div
      className="surface-card hairline p-6 md:p-7 hover:border-accent transition-colors duration-fast h-full w-full bg-surface-canvas relative border border-surface-border flex flex-col justify-between"
    >
      {/* Photo with scales ruler frame */}
      <div
        className={`relative w-full aspect-[4/3] mb-6 ${isInteractive ? "cursor-pointer" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`View ${t.name}'s profile`}
        onClick={() => {
          if (isInteractive) setTappedCard(tappedCard === t.id ? null : t.id);
        }}
      >
        <div
          className="absolute -inset-y-3 -left-3 w-4 pointer-events-none md:-inset-y-6 md:-left-6 md:w-7"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
            maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <Scales orientation="vertical" size={8} color="rgba(215, 25, 33, 0.75)" />
        </div>
        <div
          className="absolute -inset-y-3 -right-3 w-4 pointer-events-none md:-inset-y-6 md:-right-6 md:w-7"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
            maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <Scales orientation="vertical" size={8} color="rgba(215, 25, 33, 0.75)" />
        </div>
        <div
          className="absolute -inset-x-3 -top-3 h-4 pointer-events-none md:-inset-x-6 md:-top-6 md:h-7"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <Scales orientation="horizontal" size={8} color="rgba(215, 25, 33, 0.75)" />
        </div>
        <div
          className="absolute -inset-x-3 -bottom-3 h-4 pointer-events-none md:-inset-x-6 md:-bottom-6 md:h-7"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
            maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <Scales orientation="horizontal" size={8} color="rgba(215, 25, 33, 0.75)" />
        </div>

        <div className="relative w-full h-full overflow-hidden surface-canvas">
          <div
            className={`relative w-full h-full transition-all duration-slow ${tappedCard === t.id || !isInteractive ? "grayscale-0" : "grayscale"}`}
          >
            <Image
              src={t.src}
              alt={`Trainer ${t.name}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10 flex flex-col h-full justify-between">
        <div className="text-center">
          <h3 className="heading-display text-2xl md:text-3xl text-hi tracking-wide">
            {t.name}
          </h3>
          <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-accent mt-1">
            {t.role}
          </p>
        </div>
        
        <div className="pt-3 border-t border-surface-border text-center">
          <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-mid">
            SPECIALIZATION //
          </p>
          <p className="body-text text-sm md:text-base text-hi mt-1">
            {t.spec}
          </p>
        </div>

        {/* BOTTOM MIDDLE SOCIALS */}
        <div className="flex items-center justify-center gap-4 pt-4 mt-auto">
          {t.instagram && (
            <a
              href={t.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-[#111] hover:bg-accent hover:text-white border border-surface-border transition-all duration-300 text-mid"
              aria-label={`Follow ${t.name} on Instagram`}
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
          )}
          {t.whatsapp && (
            <a
              href={`https://wa.me/${t.whatsapp}?text=Hi%20${t.name},%20I'm%20interested%20in%20joining%20Brother's%20Fitness!`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-[#111] hover:bg-accent hover:text-white border border-surface-border transition-all duration-300 text-mid"
              aria-label={`Contact ${t.name} on WhatsApp`}
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section id="architects" className="surface-canvas py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <p className="label-text text-accent mb-3">TRAINERS</p>
          <h2 className="heading-display text-4xl md:text-6xl mb-4 text-hi">
            OUR <span className="text-accent">TRAINERS</span>
          </h2>
          <p className="body-text text-mid">TRAINED. CERTIFIED. READY TO COACH YOU.</p>
        </div>

        {/* Swipe-to-Slide 3D Carousel (Mobile) */}
        <div className="md:hidden relative w-full h-[650px] flex items-center justify-center perspective-[1200px] overflow-hidden">
          <div 
            className="w-[85vw] h-full absolute transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${rotation}deg)`
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {trainers.map((t, index) => (
              <div 
                key={t.id}
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: `rotateY(${index * 180}deg) translateZ(${index === 0 ? '1px' : '-1px'})`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <TrainerCard t={t} isInteractive={false} />
              </div>
            ))}
          </div>
          
          {/* Swipe Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-50 pointer-events-none">
             <span className="text-[10px] font-mono text-mid tracking-widest">&larr; SWIPE &rarr;</span>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {trainers.map((t) => (
            <TrainerCard key={t.id} t={t} isInteractive={true} />
          ))}
        </div>
      </div>
    </section>
  );
}

