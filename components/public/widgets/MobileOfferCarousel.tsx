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

export default function MobileOfferCarousel() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* High-Converting Customer Attraction Header (Clean, Non-Pulsating, Professional) */}
      <div className="w-full text-center px-4 mb-3.5 space-y-1.5">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-surface-card/90 border border-surface-border text-mid text-[11px] font-semibold tracking-wide shadow-xs">
          <span className="text-accent font-bold">100% Free</span>
          <span className="text-surface-border">•</span>
          <span>Zero Obligation</span>
          <span className="text-surface-border">•</span>
          <span>No Joining Fee</span>
        </div>

        <h2 className="font-display text-2xl uppercase tracking-wider text-hi">
          START FOR <span className="text-accent">FREE</span> TODAY
        </h2>

        <p className="text-xs text-mid max-w-sm mx-auto leading-relaxed">
          Test our gym floor, build custom meal plans, or explore 1,300+ exercises with expert coach guidance.
        </p>
      </div>

      {/* Edge-to-Edge Stretched Responsive Carousel */}
      <div className="w-full flex justify-center">
        <Carousel
          items={OFFER_ITEMS}
          baseWidth={0}
          autoplay={true}
          autoplayDelay={3600}
          pauseOnHover={true}
          loop={true}
          round={false}
          className="w-full px-1"
          renderItem={(item, index, itemWidth) => {
            const offer = item as OfferSlide;
            return (
              <div
                className="w-full rounded-2xl bg-surface-card border border-surface-border/90 overflow-hidden shadow-xl flex flex-col group transition-all"
                style={{ width: itemWidth }}
              >
                {/* 3D Illustration Visual */}
                <div className="relative w-full aspect-[16/9] bg-[#0c0c0e] overflow-hidden">
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    fill
                    priority={index === 0}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 440px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent opacity-75" />

                  {/* Minimalist Tag Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-accent uppercase tracking-wider shadow-sm">
                    {offer.icon}
                    <span>{offer.tag}</span>
                  </div>
                </div>

                {/* Clean 1-2 Word Text Bar & Action */}
                <div className="p-3.5 px-4 flex items-center justify-between gap-3 bg-surface-card border-t border-surface-border/40">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-wide text-hi leading-tight">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-mid font-medium tracking-wide mt-0.5">
                      {offer.sub}
                    </p>
                  </div>

                  <Link
                    href={offer.href}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm shrink-0"
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
    </div>
  );
}
