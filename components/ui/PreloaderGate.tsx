"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import SmartPreloaderWrapper from "./SmartPreloaderWrapper";

/**
 * Renders the full-screen SmartPreloader only on the two routes that need it:
 *   - "/" (public home page)
 *   - "/admin/login" (admin sign-in screen)
 *
 * All other routes (admin pages, feature pages, API routes) skip it entirely
 * so the 1.6s cinematic preloader doesn't block every admin navigation.
 */
function PreloaderGateInner() {
  const pathname = usePathname();
  const shouldShow = pathname === "/" || pathname === "/admin/login";
  if (!shouldShow) return null;
  return <SmartPreloaderWrapper />;
}

export default function PreloaderGate() {
  return (
    <Suspense fallback={null}>
      <PreloaderGateInner />
    </Suspense>
  );
}
