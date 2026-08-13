"use client";

import { ReactNode, Suspense } from "react";
import { usePathname } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

/**
 * Route-group shell for all /admin/* pages.
 *
 * The login page MUST bypass AdminLayout — the guard inside AdminLayout
 * redirects unauthenticated users to /admin/login, which would create an
 * infinite redirect loop if the login page itself were wrapped in the guard.
 *
 * usePathname() requires a Suspense boundary when used in a layout during
 * static generation, so we split into an inner component.
 */
function AdminShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return <AdminLayout>{children}</AdminLayout>;
}

export default function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminShellInner>{children}</AdminShellInner>
    </Suspense>
  );
}
