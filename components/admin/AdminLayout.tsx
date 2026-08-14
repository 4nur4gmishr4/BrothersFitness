"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Mail,
  Clock,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/lib/auth-context";

type SidebarContextType = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside AdminLayout");
  return ctx;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Members",
    href: "/admin/members",
    icon: Users,
  },
  {
    label: "Leads Inbox",
    href: "/admin/leads",
    icon: Mail,
    badgeKey: "unreadLeads",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Activity Log",
    href: "/admin/activity",
    icon: Clock,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

function SidebarContent({
  onNavigate,
  unreadLeads,
}: {
  onNavigate?: () => void;
  unreadLeads: number;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-5 hairline-b flex items-center justify-center">
        <div className="w-10 h-10 surface-card hairline flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-accent" />
        </div>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const isLeads = item.label === "Leads Inbox";
          const badge = isLeads && unreadLeads > 0 ? unreadLeads : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 px-3 py-2.5 label-text uppercase tracking-wider transition-all duration-fast border ${
                active
                  ? "bg-accent-muted border-accent text-hi"
                  : "border-transparent text-mid hover:text-hi hover:bg-surface-card"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? "text-accent" : "text-low group-hover:text-mid"
                }`}
              />
              <span className="flex-1 truncate text-xs">{item.label}</span>
              {badge && (
                <span className="min-w-[1.25rem] h-5 px-1 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-accent" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, logout } = useAdmin();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="min-h-screen surface-canvas flex items-center justify-center">
        <div className="flex items-center gap-3 text-mid label-text uppercase tracking-widest">
          <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading Admin…
        </div>
      </div>
    );
  }

  return (
    <SidebarContext.Provider
      value={{
        open: sidebarOpen,
        toggle: () => setSidebarOpen((v) => !v),
        close: () => setSidebarOpen(false),
      }}
    >
      <div className="flex min-h-[100dvh] surface-canvas text-hi">
        <aside
          className="hidden md:flex md:w-64 lg:w-72 flex-col surface-card hairline-r fixed md:sticky top-0 h-[100dvh] shrink-0"
          aria-label="Admin navigation"
        >
          <SidebarContent unreadLeads={unreadLeads} />
        </aside>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/80"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 surface-card hairline-r transform transition-transform duration-normal ease-clickhouse ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Admin navigation"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 text-low hover:text-hi hover:bg-surface-elevated z-10"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent
            onNavigate={() => setSidebarOpen(false)}
            unreadLeads={unreadLeads}
          />
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 surface-card hairline-b">
            <div className="flex items-center gap-2 px-3 sm:px-5 h-14">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-low hover:text-hi hover:bg-surface-elevated shrink-0"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mr-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="heading-section text-xs sm:text-xs uppercase text-hi leading-none">Admin Console</span>
              </div>
              <div className="flex-1 min-w-0">
                <AdminBreadcrumbs />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.replace("/");
                  }}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 label-text uppercase tracking-wider text-xs text-mid hover:text-status-danger hover:bg-surface-elevated shrink-0"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

function AdminBreadcrumbs() {
  const pathname = usePathname();
  const match = NAV_ITEMS.find((i) => i.href === pathname);
  const label = match?.label || "Admin";

  return (
    <div className="flex items-center gap-2 text-xs text-mid">
      <span className="label-text uppercase tracking-wider text-faint hidden sm:inline">
        Admin
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-faint hidden sm:block" />
      <span className="label-text uppercase tracking-wider text-hi truncate">
        {label}
      </span>
    </div>
  );
}
