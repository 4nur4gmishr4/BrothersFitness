"use client";

import { useEffect, useRef } from "react";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

/**
 * Modal accessibility and scroll-lock helper:
 * 1. Closes the dialog on Escape key.
 * 2. Locks body scroll so the background page cannot be scrolled while modal is active.
 * 3. Returns accessibility ARIA props.
 */
export function useModalDismiss(onClose: () => void, enabled = false) {
    const onCloseRef = useRef(onClose);
    const idRef = useRef<string | null>(null);
    if (!idRef.current) {
        idRef.current = "modal-" + Math.random().toString(36).substring(2, 9);
    }

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!enabled) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseRef.current();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;
        const modalId = idRef.current || "modal";
        lockScroll(modalId);

        return () => {
            unlockScroll(modalId);
        };
    }, [enabled]);

    return {
        role: "dialog" as const,
        "aria-modal": true,
        "aria-label": "Dialog",
    };
}
