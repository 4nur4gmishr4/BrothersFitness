"use client";

import { useEffect, ReactNode, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/admin-auth-context";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { adminFetch } from "@/lib/admin-api";
import { useSidebar } from "@/components/ui/sidebar";

import MorphingInfinity from "@/components/ui/loaders/MorphingInfinity";

export { useSidebar };

const fetcher = async (url: string) => {
  const res = await adminFetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  const { data } = useSWR(isAdmin ? "/api/admin/leads" : null, fetcher, {
    refreshInterval: 30000,
  });

  const unreadLeads = useMemo(() => {
    if (!data?.leads) return 0;
    let read: string[] = [];
    try {
      if (typeof window !== "undefined") {
        read = JSON.parse(localStorage.getItem("brofit_admin_read_leads") || "[]");
      }
    } catch {}
    return data.leads.filter((l: { id: string }) => !read.includes(l.id)).length;
  }, [data]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center gap-4">
        <MorphingInfinity className="w-12 h-12 text-accent" />
        <div className="text-faint tracking-wider font-semibold text-xs animate-pulse">
          Signing in to admin dashboard...
        </div>
      </div>
    );
  }

  return <AdminSidebar unreadLeads={unreadLeads}>{children}</AdminSidebar>;
}

export default AdminLayout;
