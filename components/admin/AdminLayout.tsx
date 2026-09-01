"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/lib/auth-context";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useSidebar } from "@/components/ui/sidebar";

import MorphingInfinity from "@/components/ui/loaders/MorphingInfinity";

export { useSidebar };

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();
  const [unreadLeads, setUnreadLeads] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;

    const check = async () => {
      try {
        const token = sessionStorage.getItem("admin_token");
        if (!token) return;
        const res = await fetch("/api/admin/leads", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const leads = data.leads || [];
        let read: string[] = [];
        try {
          read = JSON.parse(localStorage.getItem("brofit_admin_read_leads") || "[]");
        } catch {}
        setUnreadLeads(leads.filter((l: { id: string }) => !read.includes(l.id)).length);
      } catch {}
    };

    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [isAdmin]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-surface-canvas flex flex-col items-center justify-center gap-4">
        <MorphingInfinity className="w-12 h-12 text-accent" />
        <div className="text-faint font-mono uppercase tracking-widest font-semibold text-xs animate-pulse">
          Authenticating Console…
        </div>
      </div>
    );
  }

  return <AdminSidebar unreadLeads={unreadLeads}>{children}</AdminSidebar>;
}

export default AdminLayout;
