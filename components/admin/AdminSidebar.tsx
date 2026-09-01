"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Clock,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/ui/providers/ThemeProvider";
import { preloadAdminData } from "@/hooks/use-admin-stats";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/lib/auth-context";

export type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badgeKey?: "unreadLeads";
  external?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      {
        label: "Members",
        icon: Users,
        href: "/admin/members",
      },
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard",
      },
      {
        label: "Analytics",
        icon: BarChart3,
        href: "/admin/analytics",
      },
      {
        label: "Messages",
        icon: Mail,
        href: "/admin/leads",
        badgeKey: "unreadLeads",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Audit Logs",
        icon: Clock,
        href: "/admin/activity",
      },
      {
        label: "Settings",
        icon: Settings,
        href: "/admin/settings",
      },
    ],
  },
];

const SidebarLogo = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
          <Link href="/admin/members" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
              <Shield className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-bold tracking-tight text-sm text-hi">
                Brother's Fitness
              </span>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  unreadLeads?: number;
}

const ALL_ADMIN_ROUTES = [
  "/admin/members",
  "/admin/dashboard",
  "/admin/analytics",
  "/admin/activity",
  "/admin/leads",
  "/admin/settings",
];

export const AppSidebar = ({ unreadLeads = 0, ...props }: AppSidebarProps) => {
  const pathname = usePathname();
  const { logout } = useAdmin();
  const router = useRouter();

  // Proactively warm up routes and member cache in parallel on mount for 0ms transitions
  React.useEffect(() => {
    try {
      preloadAdminData();
      ALL_ADMIN_ROUTES.forEach((r) => {
        router.prefetch(r);
      });
    } catch {}
  }, [router]);

  return (
    <Sidebar collapsible="icon" className="border-r border-surface-border bg-surface-card" {...props}>
      <SidebarHeader className="border-b border-surface-border p-3">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-2">
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.title} className="p-0">
            <SidebarGroupLabel className="uppercase tracking-wider text-[10px] font-semibold text-faint px-3 py-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const isLeads = item.badgeKey === "unreadLeads";
                  const badge = isLeads && unreadLeads > 0 ? unreadLeads : null;

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "transition-colors text-xs font-medium px-3 py-2.5 rounded-xl",
                          isActive
                            ? "bg-accent text-white hover:bg-accent-hover hover:text-white font-semibold shadow-sm border border-accent"
                            : "text-mid hover:text-hi hover:bg-surface-elevated"
                        )}
                      >
                        <Link
                          href={item.href}
                          prefetch={true}
                          onMouseEnter={() => {
                            if (!item.external) {
                              try {
                                router.prefetch(item.href);
                              } catch {}
                            }
                          }}
                          onTouchStart={() => {
                            if (!item.external) {
                              try {
                                router.prefetch(item.href);
                              } catch {}
                            }
                          }}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noreferrer" : undefined}
                          className="flex items-center gap-3 w-full"
                        >
                          <Icon className={cn("size-4 shrink-0", isActive ? "text-white" : "text-mid")} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>

                      {badge && (
                        <SidebarMenuBadge className={cn(
                          "font-semibold text-[10px] px-1.5 py-0.5 rounded-full tabular-nums",
                          isActive
                            ? "bg-white text-accent"
                            : "bg-accent text-white"
                        )}>
                          {badge > 99 ? "99+" : badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-surface-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout();
                router.replace("/");
              }}
              tooltip="Sign Out"
              className="text-mid hover:text-status-danger hover:bg-status-danger/10 text-xs font-medium transition-colors rounded-xl"
            >
              <LogOut className="size-4 shrink-0 text-status-danger" />
              <span className="truncate">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export interface AdminSidebarProps {
  children?: React.ReactNode;
  unreadLeads?: number;
  className?: string;
}

export const AdminSidebar = ({
  children,
  unreadLeads = 0,
  className,
}: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdmin();
  const { theme, setTheme, mounted } = useTheme();

  // Find active label for breadcrumb
  let activeLabel = "Console";
  for (const group of ADMIN_NAV_GROUPS) {
    const found = group.items.find((i) => i.href === pathname);
    if (found) {
      activeLabel = found.label;
      break;
    }
  }

  return (
    <SidebarProvider className={cn("surface-canvas text-hi", className)}>
      <AppSidebar unreadLeads={unreadLeads} />
      <SidebarInset className="min-w-0 bg-surface-canvas flex flex-col min-h-screen">
        {/* Sticky Admin Header Bar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-surface-border bg-surface-card/90 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 text-mid hover:text-hi" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 bg-surface-border"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/admin/members" className="flex items-center gap-1.5 text-mid hover:text-hi font-medium text-xs">
                    <Shield className="size-3.5 text-accent" />
                    <span>Admin</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-hi font-semibold text-xs">
                    {activeLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 3 Same Theme Options as Main Site (System / Light / Dark) */}
            {mounted && (
              <div className="inline-flex items-center p-0.5 rounded-xl border border-surface-border bg-surface-elevated/70 shadow-sm">
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    theme === "system"
                      ? "bg-surface-card text-hi font-semibold shadow-xs"
                      : "text-low hover:text-mid"
                  )}
                  title="System Auto Theme"
                  aria-label="System Theme"
                >
                  <Monitor className="size-3.5" />
                  <span className="hidden sm:inline">Auto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    theme === "light"
                      ? "bg-surface-card text-hi font-semibold shadow-xs text-amber-500"
                      : "text-low hover:text-mid"
                  )}
                  title="Light Theme"
                  aria-label="Light Theme"
                >
                  <Sun className="size-3.5" />
                  <span className="hidden sm:inline">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    theme === "dark"
                      ? "bg-surface-card text-hi font-semibold shadow-xs text-blue-400"
                      : "text-low hover:text-mid"
                  )}
                  title="Dark Theme"
                  aria-label="Dark Theme"
                >
                  <Moon className="size-3.5" />
                  <span className="hidden sm:inline">Dark</span>
                </button>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mid hover:text-hi hover:bg-surface-elevated rounded-xl border border-surface-border transition-colors shadow-sm"
              title="View Live Site"
            >
              <ExternalLink className="size-3 text-low" />
              <span className="hidden sm:inline">Live Site</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mid hover:text-status-danger hover:bg-status-danger/10 rounded-xl border border-surface-border transition-colors shadow-sm"
              title="Sign Out"
            >
              <LogOut className="size-3.5 text-status-danger" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Routed Content Area */}
        <main className={cn("flex-1 min-w-0", pathname === "/admin/leads" ? "p-0" : "p-4 sm:p-6 lg:p-8")}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const Sidebar1 = AdminSidebar;
export default AdminSidebar;
