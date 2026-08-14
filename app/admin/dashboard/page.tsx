"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  IndianRupee,
  Gift,
  CalendarClock,
  UserPlus,
  FileDown,
  ShieldCheck,
  MessageCircle,
  Edit2,
  TrendingUp,
} from "lucide-react";
import {
  StatCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  EmptyState,
  DataTableSkeleton,
} from "@/components/admin/AdminUI";
import {
  useAllMembers,
  useAdminStats,
} from "@/hooks/use-admin-stats";
import { formatDate, parseLocalDate, getMemberStatus } from "@/lib/member-utils";
import { openWhatsApp } from "@/lib/admin-api";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { members, loading, error, refresh } = useAllMembers();
  const stats = useAdminStats(members);

  const quickExport = () => {
    const headers = [
      "Name",
      "Mobile",
      "Plan",
      "Start Date",
      "End Date",
      "Status",
    ];
    const safeCell = (val: string) => {
      // Escape internal double-quotes, then always wrap in quotes.
      // Prefix dangerous-first-char values with a single quote to prevent
      // CSV injection (formula evaluation in spreadsheets).
      let escaped = String(val ?? "").replace(/"/g, '""');
      if (/^[=+\-@\t\r\n]/.test(escaped)) {
        escaped = `'${escaped}`;
      }
      return `"${escaped}"`;
    };
    const rows = members.map((m) => [
      m.full_name || "",
      m.mobile || "",
      m.membership_type || "",
      m.membership_start || "",
      m.membership_end || "",
      getMemberStatus(m.membership_end).toUpperCase(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(safeCell).join(","))].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Members exported as CSV");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="At-a-glance overview of your gym operations. Monitor memberships, track revenue, and act on time-sensitive alerts."
        icon={LayoutDashboard}
        actions={
          <>
            <button
              type="button"
              onClick={quickExport}
              className="btn-secondary text-xs"
              title="Export all members as CSV"
            >
              <FileDown className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <Link href="/admin/members?new=1" className="btn-primary text-xs">
              <UserPlus className="w-3.5 h-3.5" />
              Register Member
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="hairline surface-card p-4 sm:p-5 space-y-2">
                <div className="h-3 w-24 skeleton" />
                <div className="h-7 w-16 skeleton" />
              </div>
            ))}
            <div className="col-span-2 lg:col-span-4 hairline surface-card p-4 sm:p-5 space-y-2">
              <div className="h-3 w-32 skeleton" />
              <div className="h-8 w-40 skeleton" />
              <div className="h-4 w-full skeleton mt-2" />
            </div>
          </div>
          <DataTableSkeleton cols={4} rows={6} />
        </div>
      ) : error ? (
        <div className="hairline border-status-danger/30 bg-status-danger/5 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <div className="font-display uppercase text-lg text-status-danger mb-1">
            Failed to load dashboard
          </div>
          <div className="text-sm text-mid mb-4">{error}</div>
          <button type="button" onClick={refresh} className="btn-secondary text-xs">
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Members"
              value={stats.total.toLocaleString()}
              sublabel="Registered to date"
              icon={Users}
              variant="info"
              onClick={() => router.push("/admin/members")}
            />
            <StatCard
              label="Active"
              value={stats.active.toLocaleString()}
              sublabel={`${pct(stats.active, stats.total)} of total`}
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              label="Expiring Soon"
              value={stats.expiring.toLocaleString()}
              sublabel="Within next 7 days"
              icon={AlertTriangle}
              variant="warning"
              onClick={() => router.push("/admin/members?filter=expiring")}
            />
            <StatCard
              label="Expired"
              value={stats.expired.toLocaleString()}
              sublabel="Past renewal date"
              icon={AlertCircle}
              variant="danger"
              onClick={() => router.push("/admin/members?filter=expired")}
            />

            <div className="col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={() => router.push("/admin/analytics")}
                className="hairline surface-card p-4 sm:p-6 transition-colors duration-fast cursor-pointer hover:border-accent group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center hairline bg-status-success/10 text-status-success shrink-0">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="label-text uppercase tracking-widest text-xs sm:text-xs text-faint">
                        Estimated Membership Revenue
                      </div>
                      <div className="mt-2 font-display text-3xl sm:text-4xl text-status-success leading-none">
                        ₹{stats.revenue.total.toLocaleString("en-IN")}
                      </div>
                      <div className="mt-1.5 text-xs text-low">
                        Active + expiring plans combined
                      </div>
                      {(stats.growth.thisMonth !== 0 ||
                        stats.growth.lastMonth !== 0) && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-status-success">
                          <TrendingUp className="w-3 h-3" />
                          {stats.growth.thisMonth} new this month
                          {stats.growth.lastMonth > 0 && (
                            <span className="text-low">
                              (vs {stats.growth.lastMonth} last)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full sm:w-auto">
                    <PlanRev
                      label="15 Days"
                      value={stats.revenue.fifteenDays}
                      count={stats.plans.fifteenDays}
                    />
                    <PlanRev
                      label="Monthly"
                      value={stats.revenue.monthly}
                      count={stats.plans.monthly}
                    />
                    <PlanRev
                      label="Quarterly"
                      value={stats.revenue.quarterly}
                      count={stats.plans.quarterly}
                    />
                    <PlanRev
                      label="Half-Yearly"
                      value={stats.revenue.halfYearly}
                      count={stats.plans.halfYearly}
                    />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <SectionCard
              title="Today's Birthdays"
              subtitle="Send personalised wishes in one click"
              icon={Gift}
              className="xl:col-span-1"
              action={
                stats.alerts.birthdaysToday.length > 0 ? (
                  <StatusBadge
                    tone="success"
                    prefix="•"
                    label={`${stats.alerts.birthdaysToday.length} today`}
                  />
                ) : undefined
              }
            >
              {stats.alerts.birthdaysToday.length === 0 ? (
                <EmptyState
                  icon={Gift}
                  title="No birthdays today"
                  description="Next time a member has a birthday, they'll appear here ready for a quick WhatsApp wish."
                />
              ) : (
                <ul className="divide-y divide-surface-border -mx-1">
                  {stats.alerts.birthdaysToday.map((m) => (
                    <li key={m.id} className="py-2.5 px-1 flex items-center gap-3">
                      <div className="w-9 h-9 hairline surface-modal overflow-hidden shrink-0 relative">
                        {m.photo_url ? (
                          <Image
                            src={m.photo_url}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-low">
                            {initials(m.full_name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-hi truncate">{m.full_name}</div>
                        <div className="text-xs text-low">
                          {m.membership_type || "Member"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(
                            m.mobile,
                            `🎂 Happy Birthday, ${m.full_name || "there"}! 🎉\n\nBrother's Fitness wishes you a power-packed year ahead! Keep crushing those goals! 💪\n\n- Team Brothers Fitness`
                          )
                        }
                        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs label-text uppercase tracking-wider hairline border-status-success/30 text-status-success hover:bg-status-success/10 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Wish
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Expiring Today"
              subtitle="Members whose plan ends today — renew or remind"
              icon={CalendarClock}
              className="xl:col-span-1"
              action={
                stats.alerts.expiringToday.length > 0 ? (
                  <StatusBadge
                    tone="danger"
                    prefix="!"
                    label={`${stats.alerts.expiringToday.length} critical`}
                  />
                ) : undefined
              }
            >
              {stats.alerts.expiringToday.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No plans expire today"
                  description="Great — all members on track. Check Expiring Soon for the 7-day outlook."
                />
              ) : (
                <ul className="divide-y divide-surface-border -mx-1">
                  {stats.alerts.expiringToday.map((m) => (
                    <li key={m.id} className="py-2.5 px-1 flex items-center gap-3">
                      <div className="w-9 h-9 hairline surface-modal overflow-hidden shrink-0 relative">
                        {m.photo_url ? (
                          <Image
                            src={m.photo_url}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-low">
                            {initials(m.full_name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-hi truncate flex items-center gap-1.5">
                          {m.full_name}
                          <span className="shrink-0">
                            <StatusBadge tone="danger" prefix="0d" label="ENDS" />
                          </span>
                        </div>
                        <div className="text-xs text-low">
                          {m.mobile} · {m.membership_type || "Plan"}
                        </div>
                      </div>
                      <Link
                        href={`/admin/members?renew=${m.id}`}
                        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs label-text uppercase tracking-wider bg-accent text-white hover:bg-accent-hover transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Renew
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Upcoming 7 Days"
              subtitle="Birthdays and expiring plans to plan around"
              icon={ShieldCheck}
              className="xl:col-span-1"
            >
              {stats.alerts.upcomingBirthdays.length === 0 &&
              stats.alerts.expiringSoon.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="All clear"
                  description="No upcoming birthdays or renewals in the next 7 days."
                />
              ) : (
                <div className="space-y-4 -mx-1">
                  {stats.alerts.expiringSoon.length > 0 && (
                    <div>
                      <div className="label-text uppercase tracking-widest text-xs text-low mb-2 px-1">
                        Expiring plans
                      </div>
                      <ul className="divide-y divide-surface-border">
                        {stats.alerts.expiringSoon.slice(0, 5).map((m) => (
                          <li
                            key={`exp-${m.id}`}
                            className="py-2 px-1 flex items-center gap-3"
                          >
                            <span
                              className={`shrink-0 w-9 h-9 flex items-center justify-center text-xs font-mono font-bold hairline ${
                                (m.daysRemaining ?? 0) <= 2
                                  ? "bg-status-warning/10 text-status-warning border-status-warning/30"
                                  : "bg-surface-elevated text-mid"
                              }`}
                            >
                              {m.daysRemaining}d
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-hi truncate">
                                {m.full_name}
                              </div>
                              <div className="text-xs text-low">
                                Ends {formatDate(m.membership_end)}
                              </div>
                            </div>
                          </li>
                        ))}
                        {stats.alerts.expiringSoon.length > 5 && (
                          <li className="pt-2 pb-0.5 px-1">
                            <Link
                              href="/admin/members?filter=expiring"
                              className="text-xs label-text uppercase tracking-wider text-accent hover:underline"
                            >
                              View all {stats.alerts.expiringSoon.length} →
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {stats.alerts.upcomingBirthdays.length > 0 && (
                    <div className={stats.alerts.expiringSoon.length > 0 ? "pt-1" : ""}>
                      <div className="label-text uppercase tracking-widest text-xs text-low mb-2 px-1">
                        Upcoming birthdays
                      </div>
                      <ul className="divide-y divide-surface-border">
                        {stats.alerts.upcomingBirthdays.slice(0, 5).map((m) => (
                          <li
                            key={`bday-${m.id}`}
                            className="py-2 px-1 flex items-center gap-3"
                          >
                            <span className="shrink-0 w-9 h-9 flex items-center justify-center text-xs font-mono font-bold hairline bg-status-success/10 text-status-success border-status-success/30">
                              {m.daysUntil}d
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-hi truncate">
                                {m.full_name}
                              </div>
                              <div className="text-xs text-low">
                                {formatDate(m.date_of_birth)}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {stats.alerts.incomplete.length > 0 && (
            <SectionCard
              title="Profiles with missing details"
              subtitle="Complete these to track progress, send birthday wishes, and keep records accurate"
              icon={AlertTriangle}
              action={
                <Link
                  href="/admin/members?filter=incomplete"
                  className="label-text uppercase tracking-wider text-xs text-accent hover:underline"
                >
                  Open filter →
                </Link>
              }
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stats.alerts.incomplete.slice(0, 8).map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/members?edit=${m.id}`}
                    className="group hairline surface-elevated p-3 flex items-center gap-3 hover:border-accent transition-colors"
                  >
                    <div className="w-9 h-9 hairline surface-modal overflow-hidden shrink-0 relative">
                      {m.photo_url ? (
                        <Image
                          src={m.photo_url}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-mono text-status-warning">
                          {initials(m.full_name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-hi truncate group-hover:text-accent transition-colors">
                        {m.full_name}
                      </div>
                      <div className="text-xs text-low">
                        {missingFields(m).join(" · ")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

function PlanRev({
  label,
  value,
  count,
}: {
  label: string;
  value: number;
  count: number;
}) {
  return (
    <div className="hairline bg-surface-elevated p-2.5 sm:p-3">
      <div className="label-text uppercase tracking-widest text-xs text-faint">
        {label}
      </div>
      <div className="mt-1 font-display text-base sm:text-lg text-hi leading-none">
        ₹{value.toLocaleString("en-IN")}
      </div>
      <div className="mt-0.5 text-xs text-low">
        {count} member{count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function initials(name: string | null): string {
  const parts = String(name || "").trim().split(/\s+/);
  if (!parts[0]) return "—";
  const a = parts[0][0];
  const b = parts[1]?.[0];
  return `${a}${b || ""}`.toUpperCase();
}

function pct(n: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function missingFields(m: {
  photo_url: string | null;
  date_of_birth: string | null;
  address: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}): string[] {
  const out: string[] = [];
  if (!m.photo_url) out.push("Photo");
  if (!m.date_of_birth) out.push("DOB");
  if (!m.gender) out.push("Gender");
  if (!m.height_cm) out.push("Height");
  if (!m.weight_kg) out.push("Weight");
  return out;
}
