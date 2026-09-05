"use client";

import React from "react";
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
    sub: "3 Days",
    description: "3 Days Free",
    tag: "VIP Pass",
    image: "/assets/offer-free-trial.webp",
    href: "#splits",
    ctaText: "Claim",
    icon: <Sparkles className="w-3 h-3 text-accent" />,
  },
  {
    id: "ai-fuel",
    title: "Smart Fuel",
    sub: "Meal Plan",
    description: "AI Diet",
    tag: "AI Diet",
    image: "/assets/offer-ai-fuel.webp",
    href: "/fuel",
    ctaText: "Create",
    icon: <Flame className="w-3 h-3 text-accent" />,
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
    icon: <Dumbbell className="w-3 h-3 text-accent" />,
  },
];

export default function MobileOfferCarousel() {
  return (
    <div className="w-full">
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
            Free Gym Perks
          </span>
        </div>
        <span className="text-[10px] text-faint font-medium">Swipe</span>
      </div>

      <Carousel
        items={OFFER_ITEMS}
        baseWidth={350}
        autoplay={true}
        autoplayDelay={3600}
        pauseOnHover={true}
        loop={true}
        round={false}
        className="px-0 py-1"
        renderItem={(item, index, itemWidth) => {
          const offer = item as OfferSlide;
          return (
            <div
              className="w-full rounded-2xl bg-surface-card border border-surface-border/90 overflow-hidden shadow-xl flex flex-col group transition-all"
              style={{ width: itemWidth }}
            >
              {/* Minimalist 3D Illustration Banner */}
              <div className="relative w-full aspect-[16/9] bg-[#0c0c0e] overflow-hidden">
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  priority={index === 0}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="350px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent opacity-80" />

                {/* Minimalist Tag Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-accent uppercase tracking-wider shadow-sm">
                  {offer.icon}
                  <span>{offer.tag}</span>
                </div>
              </div>

              {/* Spacious 1-2 Word Text Bar & Action */}
              <div className="p-3.5 px-4 flex items-center justify-between gap-3 bg-surface-card">
                <div>
                  <h3 className="font-display text-base uppercase tracking-wide text-hi leading-tight">
                    {offer.title}
                  </h3>
                  <p className="text-[11px] text-mid font-medium tracking-wide">
                    {offer.sub}
                  </p>
                </div>

                <Link
                  href={offer.href}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0"
                >
                  <span>{offer.ctaText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
