"use client";

import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import SpotlightCard from "@/components/ui/animations/SpotlightCard";
import MorphingInfinity from "@/components/ui/loaders/MorphingInfinity";

type Variant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon?: LucideIcon;
  variant?: Variant;
  trend?: { value: number; label?: string };
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<
  Variant,
  { ring: string; text: string; bg: string; iconBg: string; spotlight: string }
> = {
  neutral: {
    ring: "border-surface-border hover:border-zinc-400 dark:hover:border-zinc-700",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-surface-elevated text-mid border-surface-border",
    spotlight: "rgba(255, 255, 255, 0.04)",
  },
  success: {
    ring: "border-surface-border hover:border-emerald-500/40",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    spotlight: "rgba(16, 185, 129, 0.08)",
  },
  warning: {
    ring: "border-surface-border hover:border-amber-500/40",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    spotlight: "rgba(245, 158, 11, 0.08)",
  },
  danger: {
    ring: "border-surface-border hover:border-red-500/40",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    spotlight: "rgba(239, 68, 68, 0.08)",
  },
  info: {
    ring: "border-surface-border hover:border-blue-500/40",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    spotlight: "rgba(59, 130, 246, 0.08)",
  },
  accent: {
    ring: "border-surface-border hover:border-red-500/50",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    spotlight: "rgba(229, 9, 20, 0.08)",
  },
};

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = "neutral",
  trend,
  className = "",
  onClick,
}: StatCardProps) {
  const s = variantStyles[variant];

  return (
    <SpotlightCard
      spotlightColor={s.spotlight}
      className={`rounded-2xl border ${s.ring} ${s.bg} p-4 sm:p-5 w-full text-left transition-all duration-200 shadow-sm backdrop-blur-sm ${
        onClick
          ? "cursor-pointer hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-border"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="uppercase tracking-wider text-[11px] font-semibold text-faint whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </div>
          <div className="mt-1.5 font-bold tracking-tight text-hi tabular-nums">
            <span className="text-2xl sm:text-3xl leading-none">{value}</span>
          </div>
          {sublabel && (
            <div className="mt-1.5 text-xs text-mid truncate font-medium">{sublabel}</div>
          )}
          {trend && (
            <div className="mt-1.5 text-xs font-medium text-mid">
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}
              {trend.label ? ` ${trend.label}` : ""}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${s.iconBg}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "info" | "accent";

export function StatusBadge({
  tone = "neutral",
  prefix,
  label,
  className = "",
}: {
  tone?: StatusBadgeTone;
  prefix?: string;
  label: string;
  className?: string;
  shiny?: boolean;
}) {
  const toneClasses: Record<StatusBadgeTone, string> = {
    success: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    warning: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    danger: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30",
    neutral: "text-mid bg-surface-elevated border-surface-border",
    info: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
    accent: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneClasses[tone]} shadow-sm ${className}`}
    >
      {prefix && <span aria-hidden="true">{prefix}</span>}
      <span>{label}</span>
    </span>
  );
}

export function AdminButton({
  children,
  onClick,
  variant = "secondary",
  className = "",
  type = "button",
  disabled = false,
  title,
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "whatsapp" | "call" | "danger";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  title?: string;
  icon?: LucideIcon;
}) {
  const styles: Record<string, string> = {
    primary: "bg-red-600 hover:bg-red-500 text-white font-semibold shadow-sm active:scale-95",
    whatsapp: "bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm active:scale-95",
    call: "bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm active:scale-95",
    secondary: "bg-surface-card hover:bg-surface-elevated border border-surface-border text-mid hover:text-hi transition-colors shadow-sm font-medium",
    danger: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold transition-colors",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl border border-surface-border bg-surface-card flex items-center justify-center shrink-0 text-accent shadow-sm">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h1 className="font-bold tracking-tight text-xl sm:text-2xl text-hi leading-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs sm:text-sm text-mid max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border p-8 sm:p-12 bg-surface-card/60 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl border border-surface-border bg-surface-elevated flex items-center justify-center mx-auto mb-3 text-low shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="font-semibold text-base text-hi mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-mid max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4 inline-flex">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function DataTableSkeleton({
  cols = 4,
  rows = 5,
}: {
  cols?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card overflow-hidden shadow-sm">
      <div
        className="bg-surface-elevated px-4 py-3 grid gap-3 border-b border-surface-border"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-1/2 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="px-4 py-3 grid gap-3 border-b border-surface-border last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-surface-border bg-surface-card shadow-sm ${className}`}>
      <header className="px-5 py-4 border-b border-surface-border flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-lg border border-surface-border bg-surface-elevated flex items-center justify-center shrink-0 text-accent shadow-sm">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight text-sm sm:text-base text-hi leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-mid mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-low pointer-events-none z-10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-surface-soft border border-surface-border rounded-xl pl-10 pr-4 py-2 text-xs text-hi placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium"
      />
    </div>
  );
}

export function AdminLoader({
  text = "Loading…",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center gap-3.5 ${className}`}>
      <MorphingInfinity className="w-10 h-10 text-accent" />
      <span className="text-xs uppercase tracking-wider font-semibold text-faint animate-pulse">
        {text}
      </span>
    </div>
  );
}

