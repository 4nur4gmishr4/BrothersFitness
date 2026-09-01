"use client";

import { useEffect, useRef } from "react";

/**
 * Modal accessibility and scroll-lock helper:
 * 1. Closes the dialog on Escape key.
 * 2. Locks body scroll so the background page cannot be scrolled while modal is active.
 * 3. Returns accessibility ARIA props.
 */
export function useModalDismiss(onClose: () => void) {
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseRef.current();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    return {
        role: "dialog" as const,
        "aria-modal": true,
        "aria-label": "Dialog",
    };
}
