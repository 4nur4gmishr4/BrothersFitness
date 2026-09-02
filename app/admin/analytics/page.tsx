"use client";

import { useMemo, useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  Users,
  AlertTriangle,
  AlertCircle,
  PieChart,
  ArrowUpDown,
  BarChart3,
  Calendar,
  LineChart,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  SectionCard,
  EmptyState,
  AdminLoader,
} from "@/components/admin/AdminUI";
import CountUp from "@/components/ui/text/CountUp";
import SpotlightCard from "@/components/ui/animations/SpotlightCard";
import { useAllMembers, useAdminStats } from "@/hooks/use-admin-stats";
import { getPlanPrice } from "@/lib/config";
import { parseLocalDate } from "@/lib/member-utils";
import { cn } from "@/lib/utils";
import LiveBeacon from "@/components/ui/primitives/LiveBeacon";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminAnalyticsPage() {
  const { members, loading, error, refresh } = useAllMembers();
  const stats = useAdminStats(members);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"amount" | "count">("amount");
  const [chartType, setChartType] = useState<"bars" | "curve">("bars");
  const [barMetric, setBarMetric] = useState<"all" | "revenue" | "count">("all");
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const revenueByMonth = useMemo(() => {
    const byMonth: Record<
      string,
      { amount: number; count: number; members: Array<{ id: string; name: string | null; plan: string | null; price: number }> }
    > = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[k] = { amount: 0, count: 0, members: [] };
    }
    for (const m of members) {
      if (!m.membership_start) continue;
      const sd = parseLocalDate(m.membership_start);
      if (!sd) continue;
      const k = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[k]) byMonth[k] = { amount: 0, count: 0, members: [] };
      const price = getPlanPrice(m.membership_type);
      byMonth[k].amount += price;
      byMonth[k].count += 1;
      byMonth[k].members.push({
        id: m.id,
        name: m.full_name,
        plan: m.membership_type,
        price,
      });
    }
    return Object.entries(byMonth).map(([key, v]) => {
      const [y, mo] = key.split("-");
      return {
        key,
        label: MONTH_NAMES[Number(mo) - 1] + " " + y.slice(2),
        shortLabel: MONTH_NAMES[Number(mo) - 1],
        amount: v.amount,
        count: v.count,
        members: v.members,
      };
    });
  }, [members]);

  const maxMonthAmount = Math.max(1, ...revenueByMonth.map((r) => r.amount));
  const maxMonthCount = Math.max(1, ...revenueByMonth.map((r) => r.count));
  const totalRevenue12m = revenueByMonth.reduce((s, r) => s + r.amount, 0);
  const totalJoinings12m = revenueByMonth.reduce((s, r) => s + r.count, 0);
  const avgJoiningPrice = totalJoinings12m > 0 ? Math.round(totalRevenue12m / totalJoinings12m) : 0;

  const planDistribution = useMemo(() => {
    type PlanKey = "15 Days" | "1 Month" | "Monthly" | "3 Months" | "Quarterly" | "6 Months" | "Half-Yearly" | string;
    const counts: Record<PlanKey, number> = {};
    const revenue: Record<PlanKey, number> = {};
    for (const m of members) {
      const p = m.membership_type || "Monthly";
      counts[p] = (counts[p] || 0) + 1;
      revenue[p] = (revenue[p] || 0) + getPlanPrice(p);
    }
    const list = Object.keys(counts)
      .map((plan) => ({
        plan,
        count: counts[plan],
        revenue: revenue[plan] || 0,
      }))
      .sort((a, b) => (sortBy === "amount" ? b.revenue - a.revenue : b.count - a.count));
    const totalCount = list.reduce((s, x) => s + x.count, 0) || 1;
    const totalRev = list.reduce((s, x) => s + x.revenue, 0) || 1;
    return list.map((x) => ({
      ...x,
      pctCount: (x.count / totalCount) * 100,
      pctRev: (x.revenue / totalRev) * 100,
    }));
  }, [members, sortBy]);

  const cohortStatus = useMemo(() => {
    const last6 = revenueByMonth.slice(-6);
    return last6.map((mo) => {
      let active = 0,
        expiring = 0,
        expired = 0;
      for (const m of members) {
        if (!m.membership_start) continue;
        const sd = parseLocalDate(m.membership_start);
        if (!sd) continue;
        const k = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}`;
        if (k !== mo.key) continue;
        const s = (() => {
          const e = m.membership_end;
          if (!e) return "active";
          const end = parseLocalDate(e);
          if (!end) return "active";
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff < 0) return "expired";
          if (diff <= 7) return "expiring";
          return "active";
        })();
        if (s === "active") active++;
        else if (s === "expiring") expiring++;
        else expired++;
      }
      return {
        key: mo.key,
        label: mo.label,
        active,
        expiring,
        expired,
        total: active + expiring + expired,
      };
    });
  }, [revenueByMonth, members]);

  const maxCohort = Math.max(1, ...cohortStatus.map((c) => c.total));
  const activeMonthKey = hoveredMonth || selectedMonth;
  const activeMonthData = activeMonthKey ? revenueByMonth.find((r) => r.key === activeMonthKey) : null;

  // Generate smooth SVG curve coordinates for area graph
  const chartPoints = useMemo(() => {
    const width = 1000;
    const height = 220;
    const padding = 30;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const coords = revenueByMonth.map((d, i) => {
      const x = padding + (i / (revenueByMonth.length - 1)) * chartW;
      const y = height - padding - (d.amount / maxMonthAmount) * chartH;
      return { x, y, data: d };
    });

    if (coords.length < 2) return { pathD: "", areaD: "", coords: [] };

    // Build smooth cubic bezier curve path
    let pathD = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const baseline = height - padding;
    const areaD = `${pathD} L ${lastX},${baseline} L ${firstX},${baseline} Z`;

    return { pathD, areaD, coords };
  }, [revenueByMonth, maxMonthAmount]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
      <PageHeader
        title="Analytics & Financials"
        subtitle="Clean overview of monthly revenue streams, membership cohorts, and plan volume."
        icon={BarChart3}
      />

      {loading ? (
        <AdminLoader text="Calculating financial metrics…" />
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <div className="font-semibold text-lg text-red-500 mb-1">Failed to load analytics</div>
          <div className="text-sm text-zinc-400 mb-4">{error}</div>
          <button
            type="button"
            onClick={refresh}
            className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-xs font-medium text-hi"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 4 Clean Metric Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="12M Total Revenue"
              value={<CountUp to={totalRevenue12m} prefix="₹" />}
              sublabel={`${totalJoinings12m} joinings recorded`}
              icon={IndianRupee}
              variant="success"
            />
            <StatCard
              label="Active Base"
              value={<CountUp to={stats.active + stats.expiring} />}
              sublabel={`${stats.total} total · ${stats.expired} expired`}
              icon={Users}
              variant="info"
            />
            <StatCard
              label="Avg Ticket / Join"
              value={<CountUp to={avgJoiningPrice} prefix="₹" />}
              sublabel="Average joining value"
              icon={TrendingUp}
              variant="accent"
            />
            <StatCard
              label="Renewal Exposure"
              value={<CountUp to={stats.growth.projectedRevenue} prefix="₹" />}
              sublabel={`${stats.expiring} plans expiring in ≤7d`}
              icon={AlertTriangle}
              variant="warning"
            />
          </div>

          {/* Clean Interactive Revenue Graph */}
          {/* Clean Interactive Month-by-Month Analytics Graph */}
          <SpotlightCard
            spotlightColor="rgba(16, 185, 129, 0.12)"
            className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-xl backdrop-blur-md"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-mid flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Month-by-Month Performance</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-hi mt-1 tabular-nums">
                  {activeMonthData ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ₹{activeMonthData.amount.toLocaleString("en-IN")}
                      <span className="text-xs text-mid font-normal ml-2">
                        ({activeMonthData.label} · {activeMonthData.count} joinings)
                      </span>
                    </span>
                  ) : (
                    <span>
                      ₹{totalRevenue12m.toLocaleString("en-IN")}
                      <span className="text-xs text-mid font-normal ml-2">
                        (12M Total · {totalJoinings12m} joinings)
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* View & Metric Switchers */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Metric Selector for Bars */}
                {chartType === "bars" && (
                  <div className="inline-flex items-center p-0.5 rounded-xl border border-surface-border bg-surface-elevated/70 shadow-sm text-xs">
                    <button
                      type="button"
                      onClick={() => setBarMetric("all")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-medium transition-colors",
                        barMetric === "all"
                          ? "bg-surface-card text-hi font-semibold shadow-xs"
                          : "text-low hover:text-mid"
                      )}
                    >
                      Dual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarMetric("revenue")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                        barMetric === "revenue"
                          ? "bg-surface-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                          : "text-low hover:text-mid"
                      )}
                    >
                      <LiveBeacon status="active" size="xs" />
                      <span>Revenue</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBarMetric("count")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                        barMetric === "count"
                          ? "bg-surface-card text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                          : "text-low hover:text-mid"
                      )}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Joinings</span>
                    </button>
                  </div>
                )}

                {/* Chart Style Switcher (Bars vs Area Curve) */}
                <div className="inline-flex items-center p-0.5 rounded-xl border border-surface-border bg-surface-elevated/70 shadow-sm text-xs">
                  <button
                    type="button"
                    onClick={() => setChartType("bars")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                      chartType === "bars"
                        ? "bg-surface-card text-hi font-semibold shadow-xs"
                        : "text-low hover:text-mid"
                    )}
                    title="Animated Monthly Bar Graph"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Bar Graph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("curve")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                      chartType === "curve"
                        ? "bg-surface-card text-hi font-semibold shadow-xs"
                        : "text-low hover:text-mid"
                    )}
                    title="Continuous Revenue Curve"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Curve</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Render Selected Chart: Animated Month-by-Month Bars vs SVG Area Curve */}
            {chartType === "bars" ? (
              <div className="relative w-full">
                {/* Y-Axis Reference Guidelines */}
                <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                  <div className="border-b border-dashed border-current w-full flex items-center justify-between text-[10px] tabular-nums font-medium text-faint">
                    <span>₹{maxMonthAmount.toLocaleString("en-IN")}</span>
                    <span>{maxMonthCount} joinings</span>
                  </div>
                  <div className="border-b border-dashed border-current w-full" />
                  <div className="border-b border-dashed border-current w-full" />
                  <div className="border-b border-surface-border w-full" />
                </div>

                {/* 12-Month Animated Bar Columns */}
                <div className="relative h-64 sm:h-72 grid grid-cols-12 gap-1 sm:gap-2.5 items-end pt-8 pb-1 px-1 z-10">
                  {revenueByMonth.map((d) => {
                    const isSelected = selectedMonth === d.key;
                    const isHovered = hoveredMonth === d.key;
                    const isHighlighted = isSelected || isHovered;
                    const revHeight = (d.amount / maxMonthAmount) * 100;
                    const countHeight = (d.count / maxMonthCount) * 100;

                    return (
                      <div
                        key={d.key}
                        className="h-full flex flex-col justify-end items-center relative group/col cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(d.key)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        onClick={() => setSelectedMonth(selectedMonth === d.key ? null : d.key)}
                      >
                        {/* Hover / Active Floating Tooltip */}
                        {isHighlighted && (
                          <div className="absolute -top-14 z-30 px-2.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px] font-semibold whitespace-nowrap shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
                            <span>₹{d.amount.toLocaleString("en-IN")}</span>
                            <span className="text-[9px] opacity-80 font-normal">{d.count} joinings</span>
                            <div className="w-2 h-2 rotate-45 bg-zinc-900 dark:bg-white absolute -bottom-1" />
                          </div>
                        )}

                        {/* Bars Container */}
                        <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-1.5 px-0.5">
                          {/* Revenue Bar (Emerald) */}
                          {(barMetric === "all" || barMetric === "revenue") && (
                            <div className="flex-1 h-full flex items-end justify-center max-w-[24px]">
                              <div
                                style={{
                                  height: isAnimated ? `${Math.max(d.amount > 0 ? 5 : 0, revHeight)}%` : "0%",
                                }}
                                className={cn(
                                  "w-full rounded-t-lg sm:rounded-t-xl transition-all duration-700 ease-out shadow-sm",
                                  d.amount > 0
                                    ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400"
                                    : "bg-surface-elevated/40 h-1 rounded-full",
                                  isHighlighted
                                    ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30 brightness-110"
                                    : "opacity-90 group-hover/col:opacity-100 group-hover/col:brightness-105"
                                )}
                              />
                            </div>
                          )}

                          {/* Joinings Bar (Blue) */}
                          {(barMetric === "all" || barMetric === "count") && (
                            <div className="flex-1 h-full flex items-end justify-center max-w-[24px]">
                              <div
                                style={{
                                  height: isAnimated ? `${Math.max(d.count > 0 ? 5 : 0, countHeight)}%` : "0%",
                                }}
                                className={cn(
                                  "w-full rounded-t-lg sm:rounded-t-xl transition-all duration-700 ease-out shadow-sm",
                                  d.count > 0
                                    ? "bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400"
                                    : "bg-surface-elevated/40 h-1 rounded-full",
                                  isHighlighted
                                    ? "ring-2 ring-blue-400 shadow-lg shadow-blue-500/30 brightness-110"
                                    : "opacity-80 group-hover/col:opacity-100 group-hover/col:brightness-105"
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* Month Label */}
                        <span
                          className={cn(
                            "mt-2 text-[10px] sm:text-xs tracking-tight transition-colors truncate text-center font-medium",
                            isHighlighted
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-faint group-hover/col:text-hi"
                          )}
                        >
                          {d.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Smooth SVG Area Graph Canvas */
              <div className="relative w-full h-64 sm:h-72">
                <svg
                  viewBox="0 0 1000 220"
                  preserveAspectRatio="none"
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    {/* Glowing Emerald Gradient for Area */}
                    <linearGradient id="emeraldGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="80%" stopColor="#10B981" stopOpacity="0.02" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                    {/* Subtle Grid Pattern */}
                    <pattern id="gridPattern" width="100" height="40" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="1000" y2="0" stroke="rgba(128,128,128,0.12)" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* Background Grid Lines */}
                  <rect width="1000" height="220" fill="url(#gridPattern)" />

                  {/* Area Fill */}
                  <path d={chartPoints.areaD} fill="url(#emeraldGlow)" />

                  {/* Line Path */}
                  <path
                    d={chartPoints.pathD}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  />

                  {/* Data Points */}
                  {chartPoints.coords.map((pt) => {
                    const isHovered = activeMonthKey === pt.data.key;
                    return (
                      <g key={pt.data.key} className="cursor-pointer">
                        {/* Interactive Touch Target */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="16"
                          fill="transparent"
                          onMouseEnter={() => setHoveredMonth(pt.data.key)}
                          onMouseLeave={() => setHoveredMonth(null)}
                          onClick={() => setSelectedMonth(selectedMonth === pt.data.key ? null : pt.data.key)}
                        />
                        {/* Visual Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "6" : "3.5"}
                          fill={isHovered ? "#10B981" : "#10B981"}
                          stroke="currentColor"
                          strokeWidth="2"
                          className="transition-all duration-200 pointer-events-none text-surface-card"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Month Labels Bar Below Chart */}
                <div className="flex justify-between items-center pt-2 px-2 border-t border-surface-border mt-1">
                  {revenueByMonth.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedMonth(selectedMonth === d.key ? null : d.key)}
                      onMouseEnter={() => setHoveredMonth(d.key)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className={`text-xs transition-colors ${
                        activeMonthKey === d.key ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-faint hover:text-hi font-medium"
                      }`}
                    >
                      {d.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drilldown Drawer for Selected Month */}
            {selectedMonth && activeMonthData && (
              <div className="mt-6 pt-5 border-t border-surface-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-wider text-hi font-semibold flex items-center gap-2">
                    <LiveBeacon status="active" size="xs" />
                    <span>{activeMonthData.label} — Joinings Breakdown</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth(null)}
                    className="text-xs text-mid hover:text-hi font-medium"
                  >
                    Close ×
                  </button>
                </div>
                {activeMonthData.members.length === 0 ? (
                  <EmptyState title="No joinings recorded" description="No registrations in this month." />
                ) : (
                  <div className="rounded-2xl border border-surface-border overflow-hidden bg-surface-elevated/40">
                    <table className="min-w-full w-full border-collapse">
                      <thead>
                        <tr className="bg-surface-elevated text-left">
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-faint">
                            Member Name
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-faint hidden sm:table-cell">
                            Plan
                          </th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-faint text-right">
                            Revenue (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {activeMonthData.members.map((m) => (
                          <tr key={m.id} className="hover:bg-surface-elevated/60 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-hi font-medium">{m.name || "—"}</td>
                            <td className="px-4 py-2.5 text-xs text-mid hidden sm:table-cell font-medium">
                              {m.plan}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold text-right tabular-nums">
                              ₹{m.price.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </SpotlightCard>

          {/* Plan Distribution & Cohort Health Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Plan Distribution Card */}
            <SectionCard
              title="Plan Distribution"
              subtitle={sortBy === "amount" ? "Ranked by revenue contribution" : "Ranked by member count"}
              icon={PieChart}
              action={
                <button
                  type="button"
                  onClick={() => setSortBy((s) => (s === "amount" ? "count" : "amount"))}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Sort: {sortBy === "amount" ? "Revenue" : "Count"}</span>
                </button>
              }
            >
              {planDistribution.length === 0 ? (
                <EmptyState icon={PieChart} title="No plan data" />
              ) : (
                <ul className="space-y-4">
                  {planDistribution.map((p) => (
                    <li key={p.plan}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-hi font-medium">{p.plan}</span>
                        <div className="text-right tabular-nums">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{p.revenue.toLocaleString("en-IN")}</span>
                          <span className="text-faint ml-2">({p.count} members)</span>
                        </div>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-surface-elevated border border-surface-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                          style={{ width: `${sortBy === "amount" ? p.pctRev : p.pctCount}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Cohort Health Card */}
            <SectionCard
              title="Cohort Retention Health"
              subtitle="Current status breakdown across joining cohorts"
              icon={Users}
            >
              {cohortStatus.every((c) => c.total === 0) ? (
                <EmptyState icon={Users} title="No cohort data" />
              ) : (
                <div className="space-y-4">
                  {cohortStatus.map((c) => (
                    <div key={c.key}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-hi font-medium">{c.label}</span>
                        <div className="flex items-center gap-3 text-xs tabular-nums font-medium">
                          <span className="text-emerald-600 dark:text-emerald-400">{c.active} Active</span>
                          <span className="text-amber-600 dark:text-amber-400">{c.expiring} Expiring</span>
                          <span className="text-red-600 dark:text-red-400">{c.expired} Expired</span>
                        </div>
                      </div>
                      <div className="relative h-2.5 rounded-full bg-surface-elevated border border-surface-border flex overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(c.active / maxCohort) * 100}%` }}
                        />
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${(c.expiring / maxCohort) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(c.expired / maxCohort) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-faint border-t border-surface-border">
                    <LiveBeacon status="active" label="Active" size="xs" />
                    <LiveBeacon status="alert" label="Expiring ≤7d" size="xs" />
                    <LiveBeacon status="idle" label="Expired" size="xs" />
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
