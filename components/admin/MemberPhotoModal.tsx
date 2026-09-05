"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Portal } from "@/components/ui/primitives/Portal";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

export interface MemberPhotoImage {
  url: string;
  name?: string | null;
  subtitle?: string | null;
}

export type PebbleImage = MemberPhotoImage;

interface MemberPhotoModalProps {
  image: MemberPhotoImage | null;
  onClose: () => void;
}

export function MemberPhotoModal({ image, onClose }: MemberPhotoModalProps) {
  useEffect(() => {
    if (!image) return;
    lockScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 h-[100dvh] w-full z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto overscroll-contain scrollbar-hide modal-overlay-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={image.name ? `${image.name} photo` : "Full image view"}
      >
        {/* Top-Right Dedicated Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white border border-white/20 flex items-center justify-center transition-all shadow-2xl cursor-pointer"
          aria-label="Close image viewer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Unified Rounded-3xl Full Image Frame */}
        <div
          className="relative max-w-md w-full my-auto max-h-[85dvh] aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-950 flex flex-col items-center justify-center modal-panel-in"
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
    </Portal>
  );
}

export const PebbleImageViewer = MemberPhotoModal;
export default MemberPhotoModal;
