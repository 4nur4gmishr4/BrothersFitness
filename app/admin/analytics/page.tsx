"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  IndianRupee,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  PieChart,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  EmptyState,
  DataTableSkeleton,
} from "@/components/admin/AdminUI";
import { useAllMembers, useAdminStats } from "@/hooks/use-admin-stats";
import { PLAN_PRICES, getPlanPrice } from "@/lib/config";
import { formatDate, parseLocalDate } from "@/lib/member-utils";
import { AlertCircle as Alert } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminAnalyticsPage() {
  const { members, loading, error, refresh } = useAllMembers();
  const stats = useAdminStats(members);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"amount" | "count">("amount");

  const revenueByMonth = useMemo(() => {
    const byMonth: Record<string, { amount: number; count: number; members: Array<{ id: string; name: string | null; plan: string | null; price: number }> }> = {};
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
  const totalRevenue12m = revenueByMonth.reduce((s, r) => s + r.amount, 0);

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

  // Monthly active-inactive trend (current membership status by month of join)
  const cohortStatus = useMemo(() => {
    const last6 = revenueByMonth.slice(-6);
    return last6.map((mo) => {
      const joined = mo.members;
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
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const d = Math.ceil((end.getTime() - now.getTime()) / 86400000);
          if (d < 0) return "expired";
          if (d <= 7) return "expiring";
          return "active";
        })();
        if (s === "active") active++;
        else if (s === "expiring") expiring++;
        else expired++;
      }
      return { key: mo.key, label: mo.shortLabel, active, expiring, expired, total: active + expiring + expired };
    });
  }, [members, revenueByMonth]);

  const maxCohort = Math.max(1, ...cohortStatus.map((c) => c.total));

  const selectedMonthData = selectedMonth
    ? revenueByMonth.find((r) => r.key === selectedMonth)
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto">
      <PageHeader
        title="Analytics"
        subtitle="Revenue trends, plan breakdown, and cohort health across the full member history."
        icon={BarChart3}
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hairline surface-card p-4 sm:p-5 space-y-2">
                <div className="h-3 w-24 skeleton" />
                <div className="h-7 w-20 skeleton" />
              </div>
            ))}
          </div>
          <DataTableSkeleton cols={6} rows={10} />
        </div>
      ) : error ? (
        <div className="hairline border-status-danger/30 bg-status-danger/5 p-6 text-center">
          <Alert className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <div className="font-display uppercase text-lg text-status-danger mb-1">
            Failed to load analytics
          </div>
          <div className="text-sm text-mid mb-4">{error}</div>
          <button type="button" onClick={refresh} className="btn-secondary text-xs">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="12-Month Revenue"
              value={`₹${totalRevenue12m.toLocaleString("en-IN")}`}
              sublabel={`${revenueByMonth.reduce((s, r) => s + r.count, 0)} new joinings`}
              icon={IndianRupee}
              variant="success"
            />
            <StatCard
              label="Membership Base"
              value={(stats.active + stats.expiring).toLocaleString()}
              sublabel={`${stats.total} total · ${stats.expired} expired`}
              icon={Users}
              variant="info"
            />
            <StatCard
              label="Avg / Joining"
              value={
                revenueByMonth.reduce((s, r) => s + r.count, 0) > 0
                  ? `₹${Math.round(totalRevenue12m / Math.max(1, revenueByMonth.reduce((s, r) => s + r.count, 0))).toLocaleString("en-IN")}`
                  : "—"
              }
              sublabel="Revenue per new joining"
              icon={TrendingUp}
              variant="accent"
            />
            <StatCard
              label="Renewal Exposure"
              value={`₹${stats.growth.projectedRevenue.toLocaleString("en-IN")}`}
              sublabel={`${stats.expiring} plans expiring ≤7d`}
              icon={AlertTriangle}
              variant="warning"
            />
          </div>

          {/* Revenue bar chart */}
          <SectionCard
            title="Monthly Revenue (Last 12 Months)"
            subtitle={
              selectedMonthData
                ? `${selectedMonthData.label} — ₹${selectedMonthData.amount.toLocaleString("en-IN")} from ${selectedMonthData.count} joining${selectedMonthData.count === 1 ? "" : "s"}`
                : `Tap a month to see who joined`
            }
            icon={IndianRupee}
            action={
              <div className="flex items-center gap-2 text-xs font-mono text-low">
                <span className="w-3 h-3 bg-accent" /> Revenue
                <span className="w-3 h-3 surface-elevated hairline ml-3" /> Joining count
              </div>
            }
          >
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-56 mt-2 mb-4">
              {revenueByMonth.map((d) => {
                const revH = (d.amount / maxMonthAmount) * 100;
                const countMax = Math.max(...revenueByMonth.map((r) => r.count), 1);
                const countH = (d.count / countMax) * 100;
                const active = selectedMonth === d.key;
                return (
                  <button
                    type="button"
                    key={d.key}
                    onClick={() =>
                      setSelectedMonth(active ? null : d.key)
                    }
                    className={`relative flex-1 min-w-0 h-full flex flex-col items-stretch justify-end gap-1 group focus:outline-none`}
                    aria-label={`${d.label}: ₹${d.amount.toLocaleString("en-IN")} revenue, ${d.count} joinings`}
                  >
                    <div className="flex items-end justify-center gap-0.5 h-[calc(100%-1.5rem)] min-h-[40px]">
                      <div
                        className={`flex-1 min-w-[40%] max-w-[70%] transition-all duration-500 ease-out ${
                          active ? "bg-accent" : "bg-accent/60 group-hover:bg-accent"
                        }`}
                        style={{ height: `${Math.max(2, revH)}%` }}
                        title={`₹${d.amount.toLocaleString("en-IN")}`}
                      />
                      <div
                        className={`w-1.5 transition-all duration-500 ease-out ${
                          active ? "bg-accent/80" : "bg-surface-modal group-hover:bg-accent/40"
                        }`}
                        style={{ height: `${Math.max(2, countH)}%` }}
                        title={`${d.count} joinings`}
                      />
                    </div>
                    <div
                      className={`text-xs text-center font-mono ${
                        active ? "text-accent font-bold" : "text-faint"
                      }`}
                    >
                      {d.shortLabel}
                    </div>
                    {active && d.amount > 0 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 surface-modal hairline px-2 py-1 text-xs font-mono whitespace-nowrap z-10 text-hi">
                        ₹{d.amount.toLocaleString("en-IN")}
                        <span className="text-faint"> · {d.count}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedMonthData && (
              <div className="hairline-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="label-text uppercase tracking-wider text-xs text-hi">
                    {selectedMonthData.label} — joined this month
                  </h3>
                  <span className="text-xs font-mono text-low">
                    {selectedMonthData.members.length} member
                    {selectedMonthData.members.length === 1 ? "" : "s"}
                  </span>
                </div>
                {selectedMonthData.members.length === 0 ? (
                  <EmptyState
                    title="No new joinings"
                    description="No members registered in this month."
                  />
                ) : (
                  <div className="-mx-4 sm:-mx-5 overflow-x-auto">
                    <table className="min-w-full w-full border-collapse">
                      <thead>
                        <tr className="surface-elevated text-left">
                          <th className="px-3 py-2 hairline-b text-xs uppercase tracking-widest text-faint">
                            Name
                          </th>
                          <th className="px-3 py-2 hairline-b text-xs uppercase tracking-widest text-faint hidden sm:table-cell">
                            Plan
                          </th>
                          <th className="px-3 py-2 hairline-b text-xs uppercase tracking-widest text-faint text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMonthData.members.map((m) => (
                          <tr
                            key={m.id}
                            className="hover:bg-surface-elevated transition-colors"
                          >
                            <td className="px-3 py-2 hairline-b text-sm text-hi truncate max-w-[260px]">
                              {m.name || <span className="text-faint">—</span>}
                            </td>
                            <td className="px-3 py-2 hairline-b text-xs text-mid hidden sm:table-cell">
                              {m.plan}
                            </td>
                            <td className="px-3 py-2 hairline-b text-xs font-mono text-hi text-right">
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
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plan distribution */}
            <SectionCard
              title="Plan Distribution"
              subtitle={
                sortBy === "amount"
                  ? "Ranked by revenue contribution"
                  : "Ranked by member count"
              }
              icon={PieChart}
              action={
                <button
                  type="button"
                  onClick={() => setSortBy((s) => (s === "amount" ? "count" : "amount"))}
                  className="btn-ghost text-xs min-h-[32px] py-1"
                  title="Toggle sort"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Sort: {sortBy === "amount" ? "Revenue" : "Count"}
                </button>
              }
            >
              {planDistribution.length === 0 ? (
                <EmptyState icon={PieChart} title="No data" />
              ) : (
                <ul className="space-y-3">
                  {planDistribution.map((p) => (
                    <li key={p.plan}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-hi truncate">{p.plan}</span>
                          <span className="font-mono text-faint">×{p.count}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-hi font-mono">
                            ₹{p.revenue.toLocaleString("en-IN")}
                          </div>
                          <div className="text-xs font-mono text-faint">
                            {p.pctCount.toFixed(0)}% of members · {p.pctRev.toFixed(0)}% rev
                          </div>
                        </div>
                      </div>
                      <div className="relative h-4 surface-elevated hairline overflow-hidden">
                        <div
                          className="h-full bg-accent/80 transition-all duration-500"
                          style={{ width: `${sortBy === "amount" ? p.pctRev : p.pctCount}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 border-r border-status-info/50"
                          style={{
                            width: `${sortBy === "amount" ? p.pctCount : p.pctRev}%`,
                          }}
                          title={sortBy === "amount" ? "Count share (border) vs rev share (fill)" : "Rev share (border) vs count share (fill)"}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Cohort health */}
            <SectionCard
              title="Cohort Health (Last 6 Months)"
              subtitle="Breakdown of each joining cohort by their current membership status"
              icon={Users}
            >
              {cohortStatus.every((c) => c.total === 0) ? (
                <EmptyState icon={Users} title="No recent cohorts" />
              ) : (
                <div className="space-y-3">
                  {cohortStatus.map((c) => (
                    <div key={c.key}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-hi">{c.label}</span>
                          <span className="font-mono text-faint">n={c.total}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-status-success">{c.active}A</span>
                          <span className="text-status-warning">{c.expiring}E</span>
                          <span className="text-status-danger">{c.expired}X</span>
                        </div>
                      </div>
                      <div className="relative h-5 surface-elevated hairline flex overflow-hidden">
                        <div
                          className="h-full bg-status-success/80"
                          style={{ width: `${(c.active / maxCohort) * 100}%` }}
                          title={`Active: ${c.active}`}
                        />
                        <div
                          className="h-full bg-status-warning/80"
                          style={{ width: `${(c.expiring / maxCohort) * 100}%` }}
                          title={`Expiring: ${c.expiring}`}
                        />
                        <div
                          className="h-full bg-status-danger/80"
                          style={{ width: `${(c.expired / maxCohort) * 100}%` }}
                          title={`Expired: ${c.expired}`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-3 pt-2 text-xs font-mono text-low">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-status-success/80" /> Active
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-status-warning/80" /> Expiring ≤7d
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-status-danger/80" /> Expired
                    </span>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Top status summary row */}
          <div className="grid gap-4 md:grid-cols-3">
            <SectionCard title="Currently Active" icon={CheckCircle2} className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-status-success/10 text-status-success hairline border-status-success/30 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-display text-2xl text-hi">
                    {stats.active.toLocaleString()}
                  </div>
                  <div className="text-xs text-low">
                    {stats.total > 0
                      ? `${((stats.active / stats.total) * 100).toFixed(1)}% of all members`
                      : "No members yet"}
                  </div>
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Expiring (≤7 Days)" icon={AlertTriangle} className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-status-warning/10 text-status-warning hairline border-status-warning/30 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-display text-2xl text-hi">
                    {stats.expiring.toLocaleString()}
                  </div>
                  <div className="text-xs text-low">
                    ₹{stats.growth.projectedRevenue.toLocaleString("en-IN")} projected renewals
                  </div>
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Expired / Lapsed" icon={AlertCircle} className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-status-danger/10 text-status-danger hairline border-status-danger/30 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-display text-2xl text-hi">
                    {stats.expired.toLocaleString()}
                  </div>
                  <div className="text-xs text-low">
                    {stats.total > 0
                      ? `${((stats.expired / stats.total) * 100).toFixed(1)}% churned`
                      : "—"}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
