"use client";

import { Instagram, MessageCircle } from "lucide-react";

export default function SocialBar() {
  return (
    <div className="fixed top-20 right-4 md:right-8 z-40 flex flex-col gap-3">
      {/* Instagram Button */}
      <a
        href="https://www.instagram.com/brothers_fitness_17?igsh=MW0xYmV2dHIzOHlneQ=="
        target="_blank"
        rel="noopener noreferrer"
        className="group relative surface-elevated hairline p-3.5 hover:border-accent transition-colors duration-fast"
        aria-label="Follow us on Instagram"
      >
        <Instagram className="w-5 h-5 text-mid group-hover:text-accent transition-colors duration-fast" />
        <span className="absolute -bottom-9 right-0 surface-modal hairline text-low text-xs font-mono px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-fast">
          Follow Us
        </span>
      </a>

      {/* WhatsApp Button */}
      <a
        href="https://chat.whatsapp.com/JuBvYwrjjPELfy7KlIUylI"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative surface-elevated hairline p-3.5 hover:border-accent transition-colors duration-fast"
        aria-label="Join our WhatsApp group"
      >
        <MessageCircle className="w-5 h-5 text-mid group-hover:text-accent transition-colors duration-fast" />
        <span className="absolute -bottom-9 right-0 surface-modal hairline text-low text-xs font-mono px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-fast">
          Join Group
        </span>
      </a>
    </div>
  );
}