"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Flame, Dumbbell } from "lucide-react";
import Carousel, { type CarouselItem } from "@/components/ui/carousel/Carousel";

interface OfferSlide extends CarouselItem {
  tag: string;
  sub: string;
  image: string;
  href: string;
  ctaText: string;
}

const OFFER_ITEMS: OfferSlide[] = [
  {
    id: "trial-pass",
    title: "Free Trial",
    sub: "3 Days Full Access",
    description: "3 Days Free",
    tag: "VIP Pass",
    image: "/assets/offer-free-trial.webp",
    href: "#splits",
    ctaText: "Claim",
    icon: <Sparkles className="w-3.5 h-3.5 text-accent" />,
  },
  {
    id: "ai-fuel",
    title: "Smart Fuel",
    sub: "Custom Meal Plan",
    description: "AI Diet",
    tag: "AI Diet",
    image: "/assets/offer-ai-fuel.webp",
    href: "/fuel",
    ctaText: "Create",
    icon: <Flame className="w-3.5 h-3.5 text-accent" />,
  },
  {
    id: "workout-library",
    title: "Workout Vault",
    sub: "1,300+ Guides",
    description: "All Exercises",
    tag: "Library",
    image: "/assets/offer-workout-vault.webp",
    href: "/workouts",
    ctaText: "Explore",
    icon: <Dumbbell className="w-3.5 h-3.5 text-accent" />,
  },
];

const getInitialWidth = () => {
  if (typeof window === "undefined") return 1180;
  const w = window.innerWidth;
  if (w >= 1600) return 1280;
  if (w >= 1440) return 1180;
  if (w >= 1200) return 1060;
  if (w >= 1024) return 920;
  if (w >= 768) return 680;
  if (w >= 480) return 440;
  return Math.min(w - 28, 360);
};

export default function MobileOfferCarousel() {
  const [carouselWidth, setCarouselWidth] = useState<number>(getInitialWidth);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const updateWidth = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCarouselWidth(getInitialWidth());
      }, 60);
    };

    window.addEventListener("resize", updateWidth, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return (
    <div className="w-full max-w-full xl:max-w-[1440px] 2xl:max-w-[1520px] mx-auto flex flex-col items-center">
      {/* High-Converting Customer Attraction Header (Scaled for Mobile and Laptop) */}
      <div className="w-full text-center px-4 mb-4 md:mb-6 space-y-1.5">
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl uppercase tracking-wider text-hi">
          START FOR <span className="text-accent">FREE</span> TODAY
        </h2>

        <p className="text-xs md:text-sm text-mid max-w-lg mx-auto leading-relaxed">
          Test our gym floor, build custom meal plans, or explore 1,300+ exercises with expert coach guidance.
        </p>
      </div>

      {/* Wide Responsive 3D Carousel (End to End on Laptop, Tactile 3D on Mobile) */}
      <div className="w-full flex justify-center">
        <Carousel
          items={OFFER_ITEMS}
          baseWidth={carouselWidth}
          autoplay={true}
          autoplayDelay={3600}
          pauseOnHover={false}
          loop={true}
          round={false}
          className="w-full px-0"
          renderItem={(item, index, itemWidth) => {
            const offer = item as OfferSlide;
            return (
              <div
                className="w-full rounded-2xl bg-surface-card border border-surface-border/90 overflow-hidden shadow-2xl flex flex-col group transition-all"
                style={{ width: itemWidth }}
              >
                {/* 3D Illustration Visual (Cinematic Widescreen on Laptop) */}
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[22/9] bg-[#0c0c0e] overflow-hidden">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    priority={index === 0}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 720px, 1100px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent opacity-75" />
                </div>

                {/* Clean 1-2 Word Text Bar & Action (Generous Spacing on Laptop) */}
                <div className="p-3.5 px-4 md:p-5 md:px-7 flex items-center justify-between gap-3 bg-surface-card border-t border-surface-border/40">
                  <div>
                    <h3 className="font-display text-lg md:text-2xl lg:text-3xl uppercase tracking-wide text-hi leading-tight">
                      {offer.title}
                    </h3>
                    <p className="text-xs md:text-sm text-mid font-medium tracking-wide mt-0.5">
                      {offer.sub}
                    </p>
                  </div>

                  <Link
                    href={offer.href}
                    className="inline-flex items-center gap-1.5 px-4 md:px-7 py-2 md:py-3.5 rounded-full bg-accent text-white text-xs md:text-sm font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0"
                  >
                    <span>{offer.ctaText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </Link>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
