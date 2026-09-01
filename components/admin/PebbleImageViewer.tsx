"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export interface PebbleImage {
  url: string;
  name?: string | null;
  subtitle?: string | null;
}

interface PebbleImageViewerProps {
  image: PebbleImage | null;
  onClose: () => void;
}

export function PebbleImageViewer({ image, onClose }: PebbleImageViewerProps) {
  useEffect(() => {
    if (!image) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={image.name ? `${image.name} photo` : "Full image view"}
    >
      {/* Top-Right Dedicated Pebble Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white border border-white/20 flex items-center justify-center transition-all shadow-2xl cursor-pointer"
        aria-label="Close image viewer"
        title="Close (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Pebble Shaped Full Image Frame */}
      <div
        className="relative max-w-md w-full max-h-[85vh] aspect-[3/4] sm:aspect-[4/5] rounded-[3rem] overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-950 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={image.url}
          alt={image.name || "Member photo"}
          fill
          sizes="(max-width: 768px) 90vw, 500px"
          className="object-cover select-none"
          priority
        />

        {/* Ambient Gradient Overlays for High-End Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Bottom Information Pill */}
        {image.name && (
          <div className="absolute bottom-5 left-5 right-5 z-10 p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-between shadow-lg">
            <div className="min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">
                {image.name}
              </div>
              {image.subtitle && (
                <div className="text-xs text-white/70 truncate mt-0.5 font-medium">
                  {image.subtitle}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/70 bg-white/10 px-2.5 py-1 rounded-full shrink-0">
              Photo View
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PebbleImageViewer;
