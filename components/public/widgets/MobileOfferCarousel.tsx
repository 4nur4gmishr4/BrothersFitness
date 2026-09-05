"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Flame, Dumbbell } from "lucide-react";
import Carousel, { type CarouselItem } from "@/components/ui/carousel/Carousel";

interface OfferSlide extends CarouselItem {
  tag: string;
  image: string;
  href: string;
  ctaText: string;
  badgeColor?: string;
}

const OFFER_ITEMS: OfferSlide[] = [
  {
    id: "trial-pass",
    title: "3 Days Free Trial Pass",
    description: "Try Brother's Fitness in Lakhnadon completely free. No fees, full iron floor access, and coach guidance.",
    tag: "100% Free Pass",
    image: "/assets/banner-free-trial.jpg",
    href: "#splits",
    ctaText: "Claim Free Trial",
    icon: <Sparkles className="w-3.5 h-3.5 text-accent" />,
  },
  {
    id: "ai-fuel",
    title: "Free AI Meal & Diet Maker",
    description: "Make custom desi high-protein diet charts and workout plans in 30 seconds for your exact fitness goal.",
    tag: "Free AI Tool",
    image: "/assets/banner-ai-fuel.jpg",
    href: "/fuel",
    ctaText: "Start AI Generator",
    icon: <Flame className="w-3.5 h-3.5 text-accent" />,
  },
  {
    id: "workout-library",
    title: "1,300+ Exercise Library",
    description: "Learn correct lifting form, targeted muscles, and easy step-by-step instructions for every exercise.",
    tag: "Free Exercise Vault",
    image: "/assets/banner-workout-vault.jpg",
    href: "/workouts",
    ctaText: "Explore Exercises",
    icon: <Dumbbell className="w-3.5 h-3.5 text-accent" />,
  },
];

export default function MobileOfferCarousel() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
            Free Gym Perks &amp; Tools
          </span>
        </div>
        <span className="text-[10px] text-faint font-medium">Swipe cards</span>
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
              className="w-full rounded-2xl bg-surface-card border border-surface-border/90 overflow-hidden shadow-lg flex flex-col group transition-all"
              style={{ width: itemWidth }}
            >
              {/* Banner Visual */}
              <div className="relative w-full aspect-[16/9] bg-surface-canvas overflow-hidden">
                <Image
                  src={offer.image}
                  alt={offer.title}
                  fill
                  priority={index === 0}
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="350px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-black/30 to-black/50" />

                {/* Tag Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-accent/40 text-[10px] font-bold text-accent uppercase tracking-wider shadow-sm">
                  {offer.icon}
                  <span>{offer.tag}</span>
                </div>
              </div>

              {/* Text & CTA */}
              <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-display text-lg uppercase tracking-wide text-hi line-clamp-1">
                    {offer.title}
                  </h3>
                  <p className="mt-1 text-xs text-mid leading-relaxed line-clamp-2">
                    {offer.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-border/50">
                  <Link
                    href={offer.href}
                    className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <span>{offer.ctaText}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
