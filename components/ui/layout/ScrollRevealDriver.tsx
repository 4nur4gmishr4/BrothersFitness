"use client";

import { useEffect } from "react";
import { resetScrollLock } from "@/lib/scroll-lock";

/**
 * Global scroll-reveal driver. Watches every [data-reveal] element and
 * flips it to .reveal-in once it enters the viewport. Elements above the
 * fold resolve on first paint (observer fires immediately), so there's no
 * flash-then-hide. Respects prefers-reduced-motion at the CSS layer - this
 * component only toggles the class; the transition is gated by media query.
 *
 * Mount once (inside PageWrapper); it covers all pages it wraps.
 */
export default function ScrollRevealDriver() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    resetScrollLock();
    if (!("IntersectionObserver" in window)) {
      // No observer support - reveal everything instantly.
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("reveal-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    const observeAll = () =>
      document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

    observeAll();

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

export { ScrollRevealDriver };
