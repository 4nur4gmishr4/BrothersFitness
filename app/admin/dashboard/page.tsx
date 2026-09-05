"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberPhotoModal, { MemberPhotoImage } from "@/components/admin/MemberPhotoModal";
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
  TrendingUp,
} from "lucide-react";
import {
  StatCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  EmptyState,
  AdminLoader,
} from "@/components/admin/AdminUI";
import CountUp from "@/components/ui/text/CountUp";
import SpotlightCard from "@/components/ui/animations/SpotlightCard";
import StarBorder from "@/components/ui/animations/StarBorder";
import {
  useAllMembers,
  useAdminStats,
} from "@/hooks/use-admin-stats";
import { formatDate, getMemberStatus } from "@/lib/member-utils";
import { openWhatsApp } from "@/lib/admin-api";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { members, loading, error, refresh } = useAllMembers();
  const stats = useAdminStats(members);
  const [viewingImage, setViewingImage] = useState<MemberPhotoImage | null>(null);

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="At-a-glance overview of your gym operations. Monitor memberships, track revenue, and act on time-sensitive alerts."
        icon={LayoutDashboard}
        actions={
          <>
            <button
              type="button"
              onClick={quickExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
              title="Export all members as CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-low" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/admin/members?new=1"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Member</span>
            </Link>
          </>
        }
      />

      {loading ? (
        <AdminLoader text="Syncing operations data…" />
      ) : error ? (
        <div className="rounded-2xl border border-status-danger/30 bg-status-danger/5 p-6 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <div className="font-semibold text-lg text-status-danger mb-1">
            Failed to load dashboard
          </div>
          <div className="text-sm text-mid mb-4">{error}</div>
          <button
            type="button"
            onClick={refresh}
            className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-hi transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main KPI Stat Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Members"
              value={<CountUp to={stats.total} />}
              sublabel="Registered to date"
              icon={Users}
              variant="info"
              onClick={() => router.push("/admin/members")}
            />
            <StatCard
              label="Active Members"
              value={<CountUp to={stats.active} />}
              sublabel={`${pct(stats.active, stats.total)} of total`}
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              label="Expiring Soon"
              value={<CountUp to={stats.expiring} />}
              sublabel="Within next 7 days"
              icon={AlertTriangle}
              variant="warning"
              onClick={() => router.push("/admin/members?filter=expiring")}
            />
            <StatCard
              label="Expired Plans"
              value={<CountUp to={stats.expired} />}
              sublabel="Past renewal date"
              icon={AlertCircle}
              variant="danger"
              onClick={() => router.push("/admin/members?filter=expired")}
            />

            {/* Estimated Membership Revenue Banner with SpotlightCard */}
            <div className="col-span-2 lg:col-span-4">
              <SpotlightCard
                spotlightColor="rgba(229, 9, 20, 0.08)"
                className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6 transition-all duration-200 cursor-pointer hover:border-surface-border/80 shadow-sm backdrop-blur-sm group"
                onClick={() => router.push("/admin/analytics")}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-surface-border bg-surface-elevated text-hi shrink-0 shadow-sm">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="uppercase tracking-wider text-[11px] font-semibold text-faint">
                        Estimated Membership Revenue
                      </div>
                      <div className="mt-1 font-bold tracking-tight text-3xl sm:text-4xl text-hi leading-none tabular-nums">
                        <CountUp to={stats.revenue.total} prefix="₹" />
                      </div>
                      <div className="mt-1.5 text-xs text-mid">
                        Active + expiring plans combined
                      </div>
                      {(stats.growth.thisMonth !== 0 ||
                        stats.growth.lastMonth !== 0) && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-mid bg-surface-elevated border border-surface-border px-2.5 py-0.5 rounded-full">
                          <TrendingUp className="w-3.5 h-3.5 text-accent" />
                          <span>{stats.growth.thisMonth} new this month</span>
                          {stats.growth.lastMonth > 0 && (
                            <span className="text-faint">
                              (vs {stats.growth.lastMonth} last)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto">
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
              </SpotlightCard>
            </div>
          </div>

          {/* Time-Sensitive Operations Grid */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            
            {/* Birthdays Today */}
            {stats.alerts.birthdaysToday.length > 0 ? (
              <StarBorder color="rgba(16, 185, 129, 0.5)" speed="5s" className="xl:col-span-1">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-border mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg border border-surface-border bg-surface-elevated flex items-center justify-center text-hi shadow-sm">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm sm:text-base text-hi leading-tight">
                          Today&apos;s Birthdays
                        </h2>
                        <p className="text-xs text-mid">1-click WhatsApp greeting</p>
                      </div>
                    </div>
                    <StatusBadge
                      tone="neutral"
                      prefix="•"
                      label={`${stats.alerts.birthdaysToday.length} today`}
                      shiny={true}
                    />
                  </div>
                  <ul className="divide-y divide-surface-border">
                    {stats.alerts.birthdaysToday.map((m) => (
                      <li key={m.id} className="py-2.5 flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl border border-surface-border bg-surface-elevated overflow-hidden shrink-0 relative shadow-sm ${
                            m.photo_url ? "cursor-zoom-in hover:ring-2 hover:ring-accent transition-all" : ""
                          }`}
                          onClick={() => {
                            if (m.photo_url) {
                              setViewingImage({
                                url: m.photo_url,
                                name: m.full_name,
                                subtitle: `${m.membership_type || "Member"} · Birthday Today 🎂`,
                              });
                            }
                          }}
                          title={m.photo_url ? "Click to view photo" : undefined}
                        >
                          {m.photo_url ? (
                            <Image
                              src={m.photo_url}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-mid">
                              {initials(m.full_name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-hi truncate">{m.full_name}</div>
                          <div className="text-xs text-mid">
                            {m.membership_type || "Member"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              m.mobile,
                              `🎂 Happy Birthday, ${m.full_name || "there"}! 🎉\n\nBrother's Fitness wishes you a power-packed year ahead! Keep crushing those goals! 💪\n\n- Team Brother's Fitness`
                            )
                          }
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Wish</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </StarBorder>
            ) : (
              <SectionCard
                title="Today's Birthdays"
                subtitle="Send personalised wishes in one click"
                icon={Gift}
                className="xl:col-span-1"
              >
                <EmptyState
                  icon={Gift}
                  title="No birthdays today"
                  description="Next time a member has a birthday, they'll appear here ready for a quick WhatsApp wish."
                />
              </SectionCard>
            )}

            {/* Expiring Today */}
            {stats.alerts.expiringToday.length > 0 ? (
              <StarBorder color="rgba(229, 9, 20, 0.5)" speed="4s" className="xl:col-span-1">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-border mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg border border-surface-border bg-surface-elevated flex items-center justify-center text-hi shadow-sm">
                        <CalendarClock className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm sm:text-base text-hi leading-tight">
                          Expiring Today
                        </h2>
                        <p className="text-xs text-mid">Immediate renewal follow-up</p>
                      </div>
                    </div>
                    <StatusBadge
                      tone="danger"
                      prefix="!"
                      label={`${stats.alerts.expiringToday.length} critical`}
                    />
                  </div>
                  <ul className="divide-y divide-surface-border">
                    {stats.alerts.expiringToday.map((m) => (
                      <li key={m.id} className="py-2.5 flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl border border-surface-border bg-surface-elevated overflow-hidden shrink-0 relative shadow-sm ${
                            m.photo_url ? "cursor-zoom-in hover:ring-2 hover:ring-accent transition-all" : ""
                          }`}
                          onClick={() => {
                            if (m.photo_url) {
                              setViewingImage({
                                url: m.photo_url,
                                name: m.full_name,
                                subtitle: `${m.membership_type || "Member"} · Expiring Today ⚠️`,
                              });
                            }
                          }}
                          title={m.photo_url ? "Click to view photo" : undefined}
                        >
                          {m.photo_url ? (
                            <Image
                              src={m.photo_url}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-mid">
                              {initials(m.full_name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-hi truncate">{m.full_name}</div>
                          <div className="text-xs text-mid">
                            {m.membership_type || "Member"} · Plan ends today
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              m.mobile,
                              `🚨 Hi ${m.full_name || "there"}! Your Brother's Fitness gym membership ends today (${m.membership_end ? formatDate(m.membership_end) : "today"}). Renew now to continue your workout streak without break! 💪\n\n- Team Brother's Fitness`
                            )
                          }
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </StarBorder>
            ) : (
              <SectionCard
                title="Expiring Today"
                subtitle="Members whose plan ends today - renew or remind"
                icon={CalendarClock}
                className="xl:col-span-1"
              >
                <EmptyState
                  icon={CheckCircle2}
                  title="No plans expire today"
                  description="Great - all members on track. Check Expiring Soon for the 7-day outlook."
                />
              </SectionCard>
            )}

            {/* Upcoming 7 Days */}
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
                <div className="space-y-4">
                  {stats.alerts.expiringSoon.length > 0 && (
                    <div>
                      <div className="uppercase tracking-wider text-[11px] font-semibold text-faint mb-2">
                        Expiring plans
                      </div>
                      <ul className="divide-y divide-surface-border">
                        {stats.alerts.expiringSoon.slice(0, 4).map((m) => (
                          <li
                            key={`exp-${m.id}`}
                            className="py-2 flex items-center gap-3"
                          >
                            <span
                              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold tabular-nums border ${
                                (m.daysRemaining ?? 0) <= 2
                                   ? "bg-status-warning/10 text-status-warning border-status-warning/30"
                                  : "bg-surface-elevated text-mid border-surface-border"
                              }`}
                            >
                              {m.daysRemaining}d
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-hi truncate">
                                {m.full_name}
                              </div>
                              <div className="text-xs text-low">
                                Ends {formatDate(m.membership_end)}
                              </div>
                            </div>
                          </li>
                        ))}
                        {stats.alerts.expiringSoon.length > 4 && (
                          <li className="pt-2 pb-0.5">
                            <Link
                              href="/admin/members?filter=expiring"
                              className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
                            >
                              View all {stats.alerts.expiringSoon.length} expiring →
                            </Link>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {stats.alerts.upcomingBirthdays.length > 0 && (
                    <div className={stats.alerts.expiringSoon.length > 0 ? "pt-2 border-t border-surface-border/60" : ""}>
                      <div className="uppercase tracking-wider text-[11px] font-semibold text-faint mb-2">
                        Upcoming birthdays
                      </div>
                      <ul className="divide-y divide-surface-border">
                        {stats.alerts.upcomingBirthdays.slice(0, 4).map((m) => (
                          <li
                            key={`bday-${m.id}`}
                            className="py-2 flex items-center gap-3"
                          >
                            <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold tabular-nums border bg-status-success/10 text-status-success border-status-success/30">
                              {m.daysUntil}d
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-hi truncate">
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

          {/* Incomplete Profiles */}
          {stats.alerts.incomplete.length > 0 && (
            <SectionCard
              title="Profiles with missing details"
              subtitle="Complete these to track progress, send birthday wishes, and keep records accurate"
              icon={AlertTriangle}
              action={
                <Link
                  href="/admin/members?filter=incomplete"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Open filter ({stats.alerts.incomplete.length}) →
                </Link>
              }
            >
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stats.alerts.incomplete.slice(0, 8).map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/members?edit=${m.id}`}
                    className="group rounded-xl border border-surface-border bg-surface-elevated/80 p-3 flex items-center gap-3 hover:border-accent transition-all hover:shadow-sm"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg border border-surface-border bg-surface-card overflow-hidden shrink-0 relative shadow-sm ${
                        m.photo_url ? "cursor-zoom-in hover:ring-2 hover:ring-accent transition-all" : ""
                      }`}
                      onClick={(e) => {
                        if (m.photo_url) {
                          e.preventDefault();
                          e.stopPropagation();
                          setViewingImage({
                            url: m.photo_url,
                            name: m.full_name,
                            subtitle: `${m.membership_type || "Member"} · Missing details`,
                          });
                        }
                      }}
                      title={m.photo_url ? "Click to view photo" : undefined}
                    >
                      {m.photo_url ? (
                        <Image
                          src={m.photo_url}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-status-warning">
                          {initials(m.full_name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-hi truncate group-hover:text-accent transition-colors">
                        {m.full_name}
                      </div>
                      <div className="text-xs text-low truncate">
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
      <MemberPhotoModal
        image={viewingImage}
        onClose={() => setViewingImage(null)}
      />
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
    <div className="rounded-xl border border-surface-border bg-surface-elevated/70 p-3 shadow-sm">
      <div className="uppercase tracking-wider text-[10px] font-semibold text-faint">
        {label}
      </div>
      <div className="mt-1 font-bold tracking-tight text-base sm:text-lg text-hi leading-none tabular-nums">
        <CountUp to={value} prefix="₹" />
      </div>
      <div className="mt-1 text-[11px] text-mid">
        {count} member{count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function initials(name: string | null): string {
  const parts = String(name || "").trim().split(/\s+/);
  if (!parts[0]) return "-";
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
