"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Universal client-side Portal component.
 * Renders children directly onto `document.body` so `position: fixed` modals
 * always pin directly to the user's active viewport without being trapped
 * by transformed page wrappers, scroll containers, or layout insets.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export default Portal;
