"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

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

const variantStyles: Record<Variant, { ring: string; text: string; bg: string; iconBg: string }> = {
  neutral: {
    ring: "border-surface-border",
    text: "text-hi",
    bg: "bg-surface-card",
    iconBg: "bg-surface-elevated text-low",
  },
  success: {
    ring: "border-status-success/30",
    text: "text-status-success",
    bg: "bg-surface-card",
    iconBg: "bg-status-success/10 text-status-success",
  },
  warning: {
    ring: "border-status-warning/30",
    text: "text-status-warning",
    bg: "bg-surface-card",
    iconBg: "bg-status-warning/10 text-status-warning",
  },
  danger: {
    ring: "border-status-danger/30",
    text: "text-status-danger",
    bg: "bg-surface-card",
    iconBg: "bg-status-danger/10 text-status-danger",
  },
  info: {
    ring: "border-status-info/30",
    text: "text-status-info",
    bg: "bg-surface-card",
    iconBg: "bg-status-info/10 text-status-info",
  },
  accent: {
    ring: "border-accent/30",
    text: "text-accent",
    bg: "bg-surface-card",
    iconBg: "bg-accent/10 text-accent",
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
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`hairline p-4 sm:p-5 ${s.bg} transition-colors duration-fast w-full text-left ${
        onClick ? "cursor-pointer hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" : ""
      } ${s.ring} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="label-text uppercase tracking-widest text-xs sm:text-xs text-faint whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </div>
          <div className={`mt-2 font-display ${s.text}`}>
            <span className="text-2xl sm:text-3xl leading-none">{value}</span>
          </div>
          {sublabel && (
            <div className="mt-1.5 text-xs text-low">{sublabel}</div>
          )}
          {trend && (
            <div
              className={`mt-1.5 text-xs font-mono uppercase tracking-wider ${
                trend.value >= 0 ? "text-status-success" : "text-status-danger"
              }`}
            >
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}
              {trend.label ? ` ${trend.label}` : ""}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 flex items-center justify-center shrink-0 hairline ${s.iconBg}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

type StatusBadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

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
}) {
  const toneClasses: Record<StatusBadgeTone, string> = {
    success:
      "text-status-success bg-status-success/10 border-status-success/30",
    warning:
      "text-status-warning bg-status-warning/10 border-status-warning/30",
    danger: "text-status-danger bg-status-danger/10 border-status-danger/30",
    neutral: "text-mid bg-surface-elevated border-surface-border",
    info: "text-status-info bg-status-info/10 border-status-info/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono uppercase tracking-widest font-bold border ${toneClasses[tone]} ${className}`}
    >
      {prefix && <span aria-hidden="true">{prefix}</span>}
      <span>{label}</span>
    </span>
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
            <div className="w-10 h-10 hairline surface-card flex items-center justify-center shrink-0 text-accent">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h1 className="font-display uppercase tracking-wide text-xl sm:text-2xl text-hi leading-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-2 text-sm text-mid max-w-3xl">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto justify-end">{actions}</div>
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
    <div className="hairline border-dashed p-8 sm:p-12 surface-card text-center">
      {Icon && (
        <div className="w-14 h-14 hairline surface-modal flex items-center justify-center mx-auto mb-4 text-low">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="font-display uppercase text-lg text-hi mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-low max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-5 inline-flex">{action}</div>}
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
    <div className="hairline surface-card overflow-hidden">
      <div className="surface-elevated px-4 py-3 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-1/2" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="px-4 py-3 grid gap-3 hairline-t"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4" />
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
    <section className={`hairline surface-card ${className}`}>
      <header className="px-4 sm:px-5 py-4 hairline-b flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-9 h-9 hairline surface-modal flex items-center justify-center shrink-0 text-accent">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-display uppercase tracking-wide text-sm sm:text-base text-hi leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-low mt-0.5">{subtitle}</p>
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
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-low pointer-events-none z-10"
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
        className="input-field !pl-9"
      />
    </div>
  );
}
