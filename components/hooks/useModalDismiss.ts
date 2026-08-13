"use client";

import { useEffect, useRef } from "react";

/**
 * M33 — modal accessibility: closes the dialog on Escape, matching the
 * backdrop-click dismiss every modal already has. The callback is kept in a
 * ref so the window listener registers exactly once regardless of how often
 * the parent recreates `onClose`. Returns props to spread onto the dialog
 * element so it is announced as a modal dialog.
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

    return {
        role: "dialog" as const,
        "aria-modal": true,
        "aria-label": "Dialog",
    };
}
