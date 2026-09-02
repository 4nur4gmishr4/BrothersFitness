"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserPlus,
  FileDown,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  MessageCircle,
  Phone,
  Receipt,
  RefreshCw,
  Grid3X3,
  List,
  Users,
  Send,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { GymMember } from "@/lib/supabase";
import {
  StatCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  EmptyState,
  SearchField,
  AdminLoader,
} from "@/components/admin/AdminUI";
import { useAllMembers } from "@/hooks/use-admin-stats";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { getMemberStatus, formatDate, parseLocalDate } from "@/lib/member-utils";
import {
  adminFetch,
  openWhatsApp,
} from "@/lib/admin-api";
import { getPlanPrice } from "@/lib/config";
import CountUp from "@/components/ui/text/CountUp";
import PebbleImageViewer, { PebbleImage } from "@/components/admin/PebbleImageViewer";
import { Portal } from "@/components/ui/primitives/Portal";

const MemberFormModal = dynamic(
  () => import("@/components/admin/MemberFormModal"),
  {
    loading: () => null,
    ssr: false,
  }
);

const MemberReceiptModal = dynamic(
  () => import("@/components/admin/MemberReceiptModal"),
  { ssr: false }
);

const BulkMessageModal = dynamic(
  () => import("@/components/admin/BulkMessageModal"),
  { ssr: false }
);

type FilterStatus =
  | "all"
  | "active"
  | "expiring"
  | "expired"
  | "incomplete";

type SortKey =
  | "newest"
  | "oldest"
  | "a-z"
  | "z-a"
  | "expiring-soon"
  | "expired-oldest";

type ViewMode = "table" | "card";

function initials(name: string | null): string {
  const parts = String(name || "").trim().split(/\s+/);
  if (!parts[0]) return "—";
  const a = parts[0][0];
  const b = parts[1]?.[0];
  return `${a}${b || ""}`.toUpperCase();
}

function hasIncompleteProfile(m: GymMember): boolean {
  return (
    !m.photo_url ||
    !m.date_of_birth ||
    !m.gender ||
    !m.height_cm ||
    !m.weight_kg ||
    !m.address
  );
}

function countIncompleteFields(m: GymMember): number {
  let n = 0;
  if (!m.photo_url) n++;
  if (!m.date_of_birth) n++;
  if (!m.gender) n++;
  if (!m.height_cm) n++;
  if (!m.weight_kg) n++;
  if (!m.address) n++;
  return n;
}

function csvSafeCell(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""');
  // Tab goes OUTSIDE the quotes: \t"content" — breaks formula parsing while
  // keeping the value properly double-quoted for CSV parsers.
  return /^[=+\-@\t\r\n]/.test(s) ? `\t"${s}"` : `"${s}"`;
}

export default function AdminMembersPage() {
  return (
    <Suspense fallback={null}>
      <AdminMembersPageInner />
    </Suspense>
  );
}

function AdminMembersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { members, loading, error, refresh, setMembers } = useAllMembers();

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<GymMember | null>(null);
  const [renewMode, setRenewMode] = useState(false);
  const [receiptFor, setReceiptFor] = useState<GymMember | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<PebbleImage | null>(null);
  const handledParamRef = useRef<string | null>(null);

  // Read URL params to deep-link: ?new=1, ?edit=id, ?renew=id, ?filter=expiring
  useEffect(() => {
    const f = searchParams.get("filter");
    if (
      f &&
      ["all", "active", "expiring", "expired", "incomplete"].includes(f)
    ) {
      setFilterStatus(f as FilterStatus);
    }
    const newParam = searchParams.get("new");
    const editId = searchParams.get("edit");
    const renewId = searchParams.get("renew");
    const paramKey = `${newParam || ""}_${editId || ""}_${renewId || ""}`;

    if (newParam === "1" && handledParamRef.current !== paramKey) {
      handledParamRef.current = paramKey;
      setEditingMember(null);
      setRenewMode(false);
      setShowForm(true);
    }
    if ((editId || renewId) && handledParamRef.current !== paramKey) {
      const id = (editId || renewId) as string;
      const m = members.find((x) => x.id === id);
      if (m) {
        handledParamRef.current = paramKey;
        setEditingMember(m);
        setRenewMode(!!renewId);
        setShowForm(true);
      }
    }
  }, [searchParams, members]);

  const counts = useMemo(() => {
    let active = 0,
      expiring = 0,
      expired = 0,
      incomplete = 0;
    for (const m of members) {
      const s = getMemberStatus(m.membership_end);
      if (s === "active") active++;
      else if (s === "expiring") expiring++;
      else expired++;
      if (hasIncompleteProfile(m)) incomplete++;
    }
    return { active, expiring, expired, incomplete, total: members.length };
  }, [members]);

  const filtered = useMemo(() => {
    let list = members;
    if (filterStatus === "active") {
      list = list.filter((m) => getMemberStatus(m.membership_end) === "active");
    } else if (filterStatus === "expiring") {
      list = list.filter(
        (m) => getMemberStatus(m.membership_end) === "expiring"
      );
    } else if (filterStatus === "expired") {
      list = list.filter((m) => getMemberStatus(m.membership_end) === "expired");
    } else if (filterStatus === "incomplete") {
      list = list.filter(hasIncompleteProfile);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => {
        return (
          (m.full_name || "").toLowerCase().includes(q) ||
          (m.mobile || "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          (m.address || "").toLowerCase().includes(q) ||
          (m.membership_type || "").toLowerCase().includes(q) ||
          (m.notes || "").toLowerCase().includes(q)
        );
      });
    }

    const copy = [...list];
    switch (sortKey) {
      case "oldest":
        copy.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "a-z":
        copy.sort((a, b) =>
          (a.full_name || "").localeCompare(b.full_name || "")
        );
        break;
      case "z-a":
        copy.sort((a, b) =>
          (b.full_name || "").localeCompare(a.full_name || "")
        );
        break;
      case "expiring-soon":
        copy.sort((a, b) => {
          const aEnd = a.membership_end ? new Date(a.membership_end).getTime() : Infinity;
          const bEnd = b.membership_end ? new Date(b.membership_end).getTime() : Infinity;
          return aEnd - bEnd;
        });
        break;
      case "expired-oldest":
        copy.sort((a, b) => {
          const aEnd = a.membership_end ? new Date(a.membership_end).getTime() : -Infinity;
          const bEnd = b.membership_end ? new Date(b.membership_end).getTime() : -Infinity;
          return bEnd - aEnd;
        });
        break;
      case "newest":
      default:
        copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return copy;
  }, [members, filterStatus, search, sortKey]);

  const expiringSummaryCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayCount = 0;
    let next7 = 0;
    let next30 = 0;
    for (const m of members) {
      if (!m.membership_end) continue;
      const end = parseLocalDate(m.membership_end);
      if (!end) continue;
      const d = Math.ceil((end.getTime() - today.getTime()) / 86400000);
      if (d === 0) todayCount++;
      if (d >= 0 && d <= 7) next7++;
      if (d >= 0 && d <= 30) next30++;
    }
    return { todayCount, next7, next30 };
  }, [members]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleExport = useCallback(() => {
    const headers = [
      "Full Name",
      "Mobile",
      "Gender",
      "DOB",
      "Height (cm)",
      "Weight (kg)",
      "Address",
      "Plan",
      "Start Date",
      "End Date",
      "Status",
      "Amount (₹)",
      "Created At",
      "Notes",
    ];
    const rows = filtered.map((m) => {
      const status = getMemberStatus(m.membership_end);
      return [
        m.full_name || "",
        m.mobile || "",
        m.gender || "",
        m.date_of_birth || "",
        m.height_cm ?? "",
        m.weight_kg ?? "",
        m.address || "",
        m.membership_type || "",
        m.membership_start || "",
        m.membership_end || "",
        status.toUpperCase(),
        getPlanPrice(m.membership_type),
        m.created_at ? m.created_at.split("T")[0] : "",
        m.notes || "",
      ];
    });
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map(csvSafeCell).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${filterStatus}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} member${rows.length === 1 ? "" : "s"}`);
  }, [filtered, filterStatus]);

  const openNew = () => {
    setEditingMember(null);
    setRenewMode(false);
    setShowForm(true);
  };

  const openEdit = (m: GymMember) => {
    setEditingMember(m);
    setRenewMode(false);
    setShowForm(true);
  };

  const openRenew = (m: GymMember) => {
    setEditingMember(m);
    setRenewMode(true);
    setShowForm(true);
  };

  const confirmDelete = (m: GymMember) => {
    setDeletingId(m.id);
    setDeleteConfirmText("");
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    if (deleteConfirmText.trim() !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await adminFetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMembers((prev) => prev.filter((m) => m.id !== deletingId));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(deletingId);
        return n;
      });
      toast.success("Member deleted");
      setDeletingId(null);
      setDeleteConfirmText("");
    } catch {
      toast.error("Failed to delete member");
    } finally {
      setIsDeleting(false);
    }
  };

  const bulkWhatsApp = () => {
    const chosen = members.filter((m) => selectedIds.has(m.id));
    if (chosen.length === 0) {
      toast.error("Select at least one member");
      return;
    }
    setShowBulk(true);
  };

  const onSaved = () => {
    refresh();
    clearSelection();
  };

  const deletingMember = deletingId
    ? members.find((m) => m.id === deletingId) || null
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Members"
        subtitle={`Manage ${counts.total} gym members. Register new joiners, renew plans, send receipts, and fix incomplete profiles.`}
        icon={Users}
        actions={
          <>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
              title="Refresh members list"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-low" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm disabled:opacity-50"
              title="Export filtered members as CSV"
              disabled={filtered.length === 0}
            >
              <FileDown className="w-3.5 h-3.5 text-low" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Member</span>
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total Members"
          value={<CountUp to={counts.total} />}
          sublabel={
            counts.total === 0
              ? "No members yet"
              : `Showing ${filtered.length} of ${counts.total}`
          }
          icon={Users}
          variant="info"
          onClick={() => {
            setFilterStatus("all");
            setSearch("");
          }}
        />
        <StatCard
          label="Active"
          value={<CountUp to={counts.active} />}
          sublabel={`${expiringSummaryCounts.next30} renew in next 30d`}
          variant="success"
          onClick={() => setFilterStatus("active")}
        />
        <StatCard
          label="Expiring Soon"
          value={<CountUp to={counts.expiring} />}
          sublabel={
            expiringSummaryCounts.todayCount > 0
              ? `${expiringSummaryCounts.todayCount} ending today — urgent`
              : "Next 7 days"
          }
          variant="warning"
          onClick={() => setFilterStatus("expiring")}
        />
        <StatCard
          label="Expired Plans"
          value={<CountUp to={counts.expired} />}
          sublabel={`${counts.incomplete} profiles incomplete`}
          variant="danger"
          onClick={() => setFilterStatus("expired")}
        />
      </div>

      <SectionCard
        title="Members Directory"
        subtitle={
          filterStatus !== "all"
            ? `Filter: ${filterStatus.toUpperCase()} · ${filtered.length} of ${counts.total}`
            : `Sort: ${sortKey} · ${filtered.length} of ${counts.total}`
        }
        icon={Users}
        action={
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-1 hairline surface-elevated p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 transition-colors ${
                  viewMode === "table"
                    ? "bg-surface-card text-hi"
                    : "text-low hover:text-mid"
                }`}
                aria-label="Table view"
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 transition-colors ${
                  viewMode === "card"
                    ? "bg-surface-card text-hi"
                    : "text-low hover:text-mid"
                }`}
                aria-label="Card view"
                title="Card view"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      >
        {loading ? (
          <AdminLoader text="Synchronizing member registry…" />
        ) : error ? (
          <div className="hairline border-status-danger/30 bg-status-danger/5 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
            <div className="font-semibold text-lg text-status-danger mb-1">
              Failed to load members
            </div>
            <div className="text-sm text-mid mb-4">{error}</div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-low" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-3 mb-4 lg:items-center">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search name, mobile, plan, address…"
                className="flex-1 min-w-0"
              />
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterOpen((v) => !v);
                      setSortOpen(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm relative"
                    aria-haspopup="listbox"
                    aria-expanded={filterOpen}
                  >
                    <Filter className="w-3.5 h-3.5 text-low" />
                    <span className="hidden sm:inline">Filter:</span>
                    <span className="capitalize font-semibold text-hi">{filterStatus}</span>
                    {filterStatus !== "all" && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
                    )}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                  {filterOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setFilterOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        role="listbox"
                        className="absolute right-0 mt-2 z-40 rounded-2xl border border-surface-border bg-surface-modal w-56 overflow-hidden shadow-2xl"
                      >
                        {(
                          [
                            ["all", "All Members", counts.total],
                            ["active", "Active", counts.active],
                            ["expiring", "Expiring (≤7d)", counts.expiring],
                            ["expired", "Expired", counts.expired],
                            [
                              "incomplete",
                              "Incomplete Profiles",
                              counts.incomplete,
                            ],
                          ] as [FilterStatus, string, number][]
                        ).map(([key, label, count]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setFilterStatus(key);
                              setFilterOpen(false);
                            }}
                            role="option"
                            aria-selected={filterStatus === key}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left font-medium transition-colors border-b border-surface-border last:border-b-0 ${
                              filterStatus === key
                                ? "bg-accent/10 text-accent font-semibold"
                                : "hover:bg-surface-elevated text-mid hover:text-hi"
                            }`}
                          >
                            <span>{label}</span>
                            <span className="text-xs opacity-70 tabular-nums">
                              {count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSortOpen((v) => !v);
                      setFilterOpen(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-low" />
                    <span className="hidden sm:inline">Sort</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                  {sortOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setSortOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        role="listbox"
                        className="absolute right-0 mt-2 z-40 rounded-2xl border border-surface-border bg-surface-modal w-64 overflow-hidden shadow-2xl"
                      >
                        {(
                          [
                            ["newest", "Newest first"],
                            ["oldest", "Oldest first"],
                            ["a-z", "Name A → Z"],
                            ["z-a", "Name Z → A"],
                            ["expiring-soon", "Expiring soonest first"],
                            ["expired-oldest", "Most recently expired"],
                          ] as [SortKey, string][]
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSortKey(key);
                              setSortOpen(false);
                            }}
                            role="option"
                            aria-selected={sortKey === key}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left font-medium transition-colors border-b border-surface-border last:border-b-0 ${
                              sortKey === key
                                ? "bg-accent/10 text-accent font-semibold"
                                : "hover:bg-surface-elevated text-mid hover:text-hi"
                            }`}
                          >
                            <span>{label}</span>
                            {sortKey === key && (
                              <ChevronRight className="w-3.5 h-3.5 text-accent" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {filterStatus !== "all" || search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus("all");
                      setSearch("");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-status-warning hover:text-status-warning transition-colors shadow-sm"
                    title="Clear filters and search"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                ) : null}
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="mb-4 rounded-2xl bg-accent/10 border border-accent/30 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3 shadow-sm">
                <span className="text-xs font-semibold text-accent shrink-0 tabular-nums">
                  {selectedIds.size} selected
                </span>
                <div className="flex-1 min-w-0" />
                <button
                  type="button"
                  onClick={bulkWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95"
                  title="Send WhatsApp message to selected members"
                >
                  <Send className="w-3 h-3" />
                  <span>Bulk WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
                >
                  <X className="w-3 h-3" />
                  <span>Deselect</span>
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title={
                  members.length === 0
                    ? "No members registered yet"
                    : "No members match your filters"
                }
                description={
                  members.length === 0
                    ? "Register your first member to begin tracking memberships and revenue."
                    : "Try clearing filters, adjusting the search query, or checking a different status."
                }
                action={
                  members.length === 0 ? (
                    <button
                      type="button"
                      onClick={openNew}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register First Member</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStatus("all");
                        setSearch("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
                    >
                      Reset Filters
                    </button>
                  )
                }
              />
            ) : viewMode === "table" ? (
              <MembersTableView
                members={filtered}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                selectAllVisible={selectAllVisible}
                onEdit={openEdit}
                onRenew={openRenew}
                onReceipt={setReceiptFor}
                onDelete={confirmDelete}
                onViewImage={setViewingImage}
              />
            ) : (
              <MembersCardView
                members={filtered}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                onEdit={openEdit}
                onRenew={openRenew}
                onReceipt={setReceiptFor}
                onDelete={confirmDelete}
                onViewImage={setViewingImage}
              />
            )}
          </>
        )}
      </SectionCard>

      {showForm && (
        <MemberFormModal
          open={showForm}
          member={editingMember}
          renew={renewMode}
          onClose={() => {
            setShowForm(false);
            if (searchParams.has("new") || searchParams.has("edit") || searchParams.has("renew")) {
              router.replace("/admin/members", { scroll: false });
            }
          }}
          onSaved={onSaved}
        />
      )}
      {receiptFor && (
        <MemberReceiptModal
          member={receiptFor}
          onClose={() => setReceiptFor(null)}
        />
      )}
      {showBulk && (
        <BulkMessageModal
          open={showBulk}
          recipients={members.filter((m) => selectedIds.has(m.id))}
          allMembers={members}
          onClose={() => setShowBulk(false)}
        />
      )}
      {deletingMember && (
        <DeleteConfirmDialog
          member={deletingMember}
          confirmText={deleteConfirmText}
          onConfirmText={setDeleteConfirmText}
          onCancel={() => {
            setDeletingId(null);
            setDeleteConfirmText("");
          }}
          onConfirm={executeDelete}
          isDeleting={isDeleting}
        />
      )}
      <PebbleImageViewer
        image={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
}

function statusBadgeFor(endDate: string | null) {
  const s = getMemberStatus(endDate);
  if (s === "active")
    return <StatusBadge tone="success" prefix="A:" label="ACTIVE" />;
  if (s === "expiring")
    return <StatusBadge tone="warning" prefix="W:" label="EXPIRING" />;
  return <StatusBadge tone="danger" prefix="E:" label="EXPIRED" />;
}

function getDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = parseLocalDate(endDate);
  if (!end) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

function MembersTableView({
  members,
  selectedIds,
  toggleSelect,
  selectAllVisible,
  onEdit,
  onRenew,
  onReceipt,
  onDelete,
  onViewImage,
}: {
  members: GymMember[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAllVisible: () => void;
  onEdit: (m: GymMember) => void;
  onRenew: (m: GymMember) => void;
  onReceipt: (m: GymMember) => void;
  onDelete: (m: GymMember) => void;
  onViewImage?: (img: PebbleImage) => void;
}) {
  const allChecked =
    members.length > 0 && members.every((m) => selectedIds.has(m.id));
  return (
    <div className="-mx-4 sm:-mx-5 overflow-x-auto">
      <table className="min-w-full w-full border-collapse">
        <thead>
          <tr className="surface-elevated text-left">
            <th className="sticky left-0 z-10 surface-elevated w-12 px-3 py-3 hairline-b">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={selectAllVisible}
                className="w-4 h-4 accent-accent"
                aria-label={allChecked ? "Deselect all" : "Select all visible"}
              />
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-xs text-faint">
              Member
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-xs text-faint hidden lg:table-cell">
              Plan
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-xs text-faint hidden md:table-cell">
              Start
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-xs text-faint">
              End
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-xs text-faint hidden sm:table-cell">
              Status
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-xs text-faint text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const checked = selectedIds.has(m.id);
            const days = getDaysRemaining(m.membership_end);
            const status = getMemberStatus(m.membership_end);
            return (
              <tr
                key={m.id}
                className={`group transition-colors ${
                  checked ? "bg-accent-muted/40" : "hover:bg-surface-elevated"
                }`}
              >
                <td className="sticky left-0 z-10 px-3 py-3 hairline-b surface-canvas group-hover:bg-surface-elevated [.bg-accent-muted/40_&]:bg-accent-muted/40">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(m.id)}
                    className="w-4 h-4 accent-accent"
                    aria-label={`Select ${m.full_name || "member"}`}
                  />
                </td>
                <td className="px-3 py-3 hairline-b align-middle min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl border border-surface-border bg-surface-elevated overflow-hidden shrink-0 relative ${
                        m.photo_url ? "cursor-zoom-in group/avatar hover:ring-2 hover:ring-accent transition-all shadow-sm" : ""
                      }`}
                      onClick={() => {
                        if (m.photo_url && onViewImage) {
                          onViewImage({
                            url: m.photo_url,
                            name: m.full_name,
                            subtitle: `${m.membership_type || "Member"} · ${m.mobile || ""}`,
                          });
                        }
                      }}
                      title={m.photo_url ? "Click to view full photo" : undefined}
                    >
                      {m.photo_url ? (
                        <Image
                          src={m.photo_url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover group-hover/avatar:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-mid">
                          {initials(m.full_name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onEdit(m)}
                        className="text-sm text-hi truncate font-semibold hover:text-accent text-left transition-colors cursor-pointer block max-w-full"
                        title="Click to edit member"
                      >
                        {m.full_name || <span className="text-faint">—</span>}
                      </button>
                      <div className="flex items-center gap-2 text-xs text-low flex-wrap font-medium">
                        {m.mobile ? (
                          <a
                            href={`tel:${m.mobile}`}
                            className="hover:text-accent whitespace-nowrap tabular-nums"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {m.mobile}
                          </a>
                        ) : (
                          <span className="text-faint">📞 —</span>
                        )}
                        {hasIncompleteProfile(m) && (
                          <span className="text-status-warning uppercase tracking-wider text-[11px] font-semibold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Incomplete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 hairline-b align-middle hidden lg:table-cell">
                  <div className="text-sm text-hi whitespace-nowrap font-medium">
                    {m.membership_type || "—"}
                  </div>
                  <div className="text-xs text-low font-medium tabular-nums">
                    ₹{getPlanPrice(m.membership_type).toLocaleString("en-IN")}
                  </div>
                </td>
                <td className="px-3 py-3 hairline-b align-middle hidden md:table-cell text-xs text-mid whitespace-nowrap tabular-nums">
                  {formatDate(m.membership_start)}
                </td>
                <td className="px-3 py-3 hairline-b align-middle whitespace-nowrap">
                  <div
                    className={`text-xs tabular-nums ${
                      days === null
                        ? "text-mid"
                        : days < 0
                        ? "text-status-danger font-medium"
                        : days <= 2
                        ? "text-status-warning font-semibold"
                        : days <= 7
                        ? "text-status-warning font-medium"
                        : "text-hi font-medium"
                    }`}
                  >
                    {formatDate(m.membership_end)}
                  </div>
                  {days !== null && (
                    <div className="text-xs text-low mt-0.5 tabular-nums">
                      {days < 0
                        ? `${Math.abs(days)}d overdue`
                        : days === 0
                        ? "ends today"
                        : `${days}d left`}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 hairline-b align-middle hidden sm:table-cell">
                  {statusBadgeFor(m.membership_end)}
                </td>
                <td className="px-3 py-3 hairline-b align-middle">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          m.mobile,
                          `Hi ${m.full_name || "there"}! 👋\n\nBrother's Fitness checking in. 💪\n\nYour plan status: ${status.toUpperCase()}${
                            m.membership_end
                              ? ` · valid until ${formatDate(m.membership_end)}`
                              : ""
                          }`
                        )
                      }
                      className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-mid hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 transition-colors shadow-sm"
                      title="Message via WhatsApp"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`tel:${m.mobile || ""}`}
                      className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-mid hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-colors shadow-sm"
                      title="Call member"
                      aria-label="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onReceipt(m)}
                      className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-mid hover:bg-surface-elevated hover:text-hi transition-colors shadow-sm"
                      title="Generate receipt"
                      aria-label="Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                    {status === "expired" || status === "expiring" ? (
                      <button
                        type="button"
                        onClick={() => onRenew(m)}
                        className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-mid hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 transition-colors shadow-sm"
                        title="Renew membership"
                        aria-label="Renew"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-mid hover:bg-surface-elevated hover:text-hi transition-colors shadow-sm"
                      title="Edit member"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m)}
                      className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-mid hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 transition-colors shadow-sm"
                      title="Delete member"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MembersCardView({
  members,
  selectedIds,
  toggleSelect,
  onEdit,
  onRenew,
  onReceipt,
  onDelete,
  onViewImage,
}: {
  members: GymMember[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  onEdit: (m: GymMember) => void;
  onRenew: (m: GymMember) => void;
  onReceipt: (m: GymMember) => void;
  onDelete: (m: GymMember) => void;
  onViewImage?: (img: PebbleImage) => void;
}) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((m) => {
        const checked = selectedIds.has(m.id);
        const days = getDaysRemaining(m.membership_end);
        const status = getMemberStatus(m.membership_end);

        return (
          <div
            key={m.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col bg-surface-card shadow-sm ${
              checked
                ? "ring-2 ring-accent border-accent"
                : "border-surface-border hover:border-zinc-400 dark:hover:border-zinc-700"
            }`}
          >
            {/* Card Header & Avatar */}
            <div className="p-3.5 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSelect(m.id)}
                className="mt-1 w-4 h-4 accent-accent rounded cursor-pointer shrink-0"
                aria-label={`Select ${m.full_name || "member"}`}
              />

              <div
                className={`w-14 h-14 rounded-2xl border border-surface-border bg-surface-elevated overflow-hidden shrink-0 relative shadow-inner ${
                  m.photo_url ? "cursor-zoom-in group/card-avatar hover:ring-2 hover:ring-accent transition-all" : ""
                }`}
                onClick={() => {
                  if (m.photo_url && onViewImage) {
                    onViewImage({
                      url: m.photo_url,
                      name: m.full_name,
                      subtitle: `${m.membership_type || "Member"} · ${m.mobile || ""}`,
                    });
                  }
                }}
                title={m.photo_url ? "Click to view full photo" : undefined}
              >
                {m.photo_url ? (
                  <Image
                    src={m.photo_url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover group-hover/card-avatar:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-mid">
                    {initials(m.full_name)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="text-sm font-semibold text-hi truncate leading-snug hover:text-accent text-left transition-colors cursor-pointer block max-w-full"
                      title="Click to edit member"
                    >
                      {m.full_name || "—"}
                    </button>
                    <a
                      href={`tel:${m.mobile || ""}`}
                      className="text-xs text-mid hover:text-accent transition-colors truncate block mt-0.5 font-medium"
                    >
                      {m.mobile || "No mobile"}
                    </a>
                  </div>
                  {statusBadgeFor(m.membership_end)}
                </div>

                {hasIncompleteProfile(m) && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>{countIncompleteFields(m)} missing</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Details & Validity Pill */}
            <div className="px-3.5 pb-3 flex-1 flex flex-col justify-end space-y-2">
              <div className="rounded-xl border border-surface-border bg-surface-elevated/60 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-faint uppercase tracking-wider text-[10px] font-semibold">
                    Plan Tier
                  </span>
                  <span className="text-hi font-semibold tabular-nums">
                    {m.membership_type || "—"} · ₹
                    {getPlanPrice(m.membership_type).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-faint uppercase tracking-wider text-[10px] font-semibold">
                    Validity
                  </span>
                  <span className="text-mid text-[11px] font-medium tabular-nums">
                    {formatDate(m.membership_start)} → {formatDate(m.membership_end)}
                  </span>
                </div>

                {days !== null && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-border">
                    <span className="text-faint uppercase tracking-wider text-[10px] font-semibold">
                      {days < 0 ? "Expired Status" : "Remaining Days"}
                    </span>
                    <span
                      className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                        days < 0
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                          : days === 0
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                          : days <= 2
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : days <= 7
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {days < 0
                        ? `${Math.abs(days)}d OVERDUE`
                        : days === 0
                        ? "ENDS TODAY"
                        : `${days}d left`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 6-Action Grayish Toolbar */}
            <div className="p-2.5 grid grid-cols-6 gap-1.5 border-t border-surface-border bg-surface-elevated/30">
              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    m.mobile,
                    `Hi ${m.full_name || "there"}! 👋\n\nBrother's Fitness checking in. 💪\n\nYour plan status: ${status.toUpperCase()}${
                      m.membership_end
                        ? ` · valid until ${formatDate(m.membership_end)}`
                        : ""
                    }`
                  )
                }
                className="p-2 rounded-xl bg-surface-card border border-surface-border text-mid hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 flex items-center justify-center transition-colors shadow-sm"
                title="Message on WhatsApp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>

              {m.mobile ? (
                <a
                  href={`tel:${m.mobile}`}
                  className="p-2 rounded-xl bg-surface-card border border-surface-border text-mid hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 flex items-center justify-center transition-colors shadow-sm"
                  title="Call Phone"
                  aria-label="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-2 rounded-xl bg-surface-card/40 border border-surface-border text-low opacity-40 flex items-center justify-center cursor-not-allowed"
                  title="No phone"
                  aria-label="No phone"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onReceipt(m)}
                className="p-2 rounded-xl bg-surface-card border border-surface-border text-mid hover:bg-surface-elevated hover:text-hi flex items-center justify-center transition-colors shadow-sm"
                title="Print / Export Receipt"
                aria-label="Receipt"
              >
                <Receipt className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onRenew(m)}
                className="p-2 rounded-xl bg-surface-card border border-surface-border text-mid hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors shadow-sm"
                title="Renew Plan"
                aria-label="Renew"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onEdit(m)}
                className="p-2 rounded-xl bg-surface-card border border-surface-border text-mid hover:bg-surface-elevated hover:text-hi flex items-center justify-center transition-colors shadow-sm"
                title="Edit Details"
                aria-label="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(m)}
                className="p-2 rounded-xl bg-surface-card border border-surface-border text-mid hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors shadow-sm"
                title="Delete Member"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeleteConfirmDialog({
  member,
  confirmText,
  onConfirmText,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  member: GymMember;
  confirmText: string;
  onConfirmText: (s: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const modalProps = useModalDismiss(onCancel);

  return (
    <Portal>
      <div
        className="fixed inset-0 h-[100dvh] w-screen bg-black/80 z-[200] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto overscroll-contain modal-overlay-in"
        onClick={onCancel}
      >
        <div
          {...modalProps}
          className="surface-modal border border-surface-border w-full max-w-md my-auto rounded-3xl overflow-hidden shadow-2xl modal-panel-in relative"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-labelledby="del-title"
          aria-describedby="del-desc"
        >
          <div className="hairline-b p-4 flex items-start gap-3 bg-status-danger/5">
            <div className="w-10 h-10 hairline bg-status-danger/10 border-status-danger/30 flex items-center justify-center shrink-0 text-status-danger">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="del-title"
                className="font-semibold text-base text-status-danger"
              >
                Permanently Delete Member
              </h2>
              <p id="del-desc" className="mt-1 text-xs text-low">
                This action cannot be undone. The member&apos;s row in the database and
                all associated data will be removed.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-low hover:text-hi hover:bg-surface-elevated"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 hairline-b surface-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 hairline surface-modal overflow-hidden shrink-0 relative">
                {member.photo_url ? (
                  <Image
                    src={member.photo_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-mid">
                    {initials(member.full_name)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-hi font-medium truncate">
                  {member.full_name || "Unnamed member"}
                </div>
                <div className="text-xs text-low font-medium">
                  <span className="tabular-nums">{member.mobile || "—"}</span> · {member.membership_type || "No plan"}
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label
                htmlFor="del-confirm"
                className="block uppercase tracking-wider text-xs font-semibold text-faint mb-1.5"
              >
                Type <span className="text-status-danger font-bold">DELETE</span>{" "}
                to confirm
              </label>
              <input
                id="del-confirm"
                type="text"
                autoFocus
                value={confirmText}
                onChange={(e) => onConfirmText(e.target.value)}
                className="input-field font-semibold text-status-danger placeholder:text-status-danger/40"
                placeholder="DELETE"
                autoComplete="off"
                disabled={isDeleting}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary flex-1 text-xs"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="btn-primary flex-1 text-xs bg-status-danger hover:bg-status-danger border-status-danger"
                disabled={isDeleting || confirmText.trim() !== "DELETE"}
              >
                {isDeleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-surface-border border-t-transparent rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
