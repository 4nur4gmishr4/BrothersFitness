"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserPlus,
  FileDown,
  Search,
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
import Link from "next/link";
import type { GymMember } from "@/lib/supabase";
import {
  StatCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  EmptyState,
  DataTableSkeleton,
  SearchField,
  Skeleton,
} from "@/components/admin/AdminUI";
import { useAllMembers } from "@/lib/use-admin-stats";
import { getMemberStatus, formatDate, parseLocalDate } from "@/lib/member-utils";
import {
  adminFetch,
  openWhatsApp,
  buildWhatsAppUrl,
} from "@/lib/admin-api";
import { PLAN_PRICES, getPlanPrice } from "@/lib/config";

const MemberFormModal = dynamic(
  () => import("@/components/admin/MemberFormModal"),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    ),
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

  const [viewMode, setViewMode] = useState<ViewMode>("table");
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

  // Read URL params to deep-link: ?new=1, ?edit=id, ?renew=id, ?filter=expiring
  useEffect(() => {
    const f = searchParams.get("filter");
    if (
      f &&
      ["all", "active", "expiring", "expired", "incomplete"].includes(f)
    ) {
      setFilterStatus(f as FilterStatus);
    }
    if (searchParams.get("new") === "1") {
      setEditingMember(null);
      setRenewMode(false);
      setShowForm(true);
    }
    const editId = searchParams.get("edit");
    const renewId = searchParams.get("renew");
    if (editId || renewId) {
      const id = (editId || renewId) as string;
      // Wait for members to load, then match.
      const tryMatch = () => {
        const m = members.find((x) => x.id === id);
        if (m) {
          setEditingMember(m);
          setRenewMode(!!renewId);
          setShowForm(true);
        }
      };
      if (members.length > 0) tryMatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, members.length]);

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
    } catch (e) {
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto">
      <PageHeader
        title="Members"
        subtitle={`Manage ${counts.total} gym members. Register new joiners, renew plans, send receipts, and fix incomplete profiles.`}
        icon={Users}
        actions={
          <>
            <button
              type="button"
              onClick={refresh}
              className="btn-ghost text-xs min-h-[40px]"
              title="Refresh members list"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary text-xs min-h-[40px]"
              title="Export filtered members as CSV"
              disabled={filtered.length === 0}
            >
              <FileDown className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={openNew}
              className="btn-primary text-xs min-h-[40px]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Member
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total"
          value={counts.total.toLocaleString()}
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
          value={counts.active.toLocaleString()}
          sublabel={`${expiringSummaryCounts.next30} renew in next 30d`}
          variant="success"
          onClick={() => setFilterStatus("active")}
        />
        <StatCard
          label="Expiring Soon"
          value={counts.expiring.toLocaleString()}
          sublabel={
            expiringSummaryCounts.todayCount > 0
              ? `${expiringSummaryCounts.todayCount} ending today — urgent`
              : "Next 7 days"
          }
          variant="warning"
          onClick={() => setFilterStatus("expiring")}
        />
        <StatCard
          label="Expired"
          value={counts.expired.toLocaleString()}
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
          viewMode === "table" ? (
            <DataTableSkeleton cols={7} rows={8} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="hairline surface-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 skeleton" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-10" />
                </div>
              ))}
            </div>
          )
        ) : error ? (
          <div className="hairline border-status-danger/30 bg-status-danger/5 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
            <div className="font-display uppercase text-lg text-status-danger mb-1">
              Failed to load members
            </div>
            <div className="text-sm text-mid mb-4">{error}</div>
            <button onClick={refresh} className="btn-secondary text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
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
                    className="btn-secondary text-xs min-h-[40px] gap-2 relative"
                    aria-haspopup="listbox"
                    aria-expanded={filterOpen}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Filter:</span>
                    <span className="capitalize">{filterStatus}</span>
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
                        className="absolute right-0 mt-2 z-40 hairline surface-modal w-56 overflow-hidden shadow-lg"
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
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left label-text uppercase tracking-wider transition-colors hairline-b last:hairline-b-0 ${
                              filterStatus === key
                                ? "bg-accent-muted text-hi"
                                : "hover:bg-surface-elevated text-mid"
                            }`}
                          >
                            <span>{label}</span>
                            <span className="font-mono text-[0.65rem] opacity-70">
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
                    className="btn-secondary text-xs min-h-[40px] gap-2"
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
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
                        className="absolute right-0 mt-2 z-40 hairline surface-modal w-64 overflow-hidden shadow-lg"
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
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left label-text uppercase tracking-wider transition-colors hairline-b last:hairline-b-0 ${
                              sortKey === key
                                ? "bg-accent-muted text-hi"
                                : "hover:bg-surface-elevated text-mid"
                            }`}
                          >
                            <span>{label}</span>
                            {sortKey === key && (
                              <ChevronRight className="w-3 h-3 text-accent" />
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
                    className="btn-ghost text-xs min-h-[40px] text-status-warning hover:text-status-warning"
                    title="Clear filters and search"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="mb-4 hairline bg-accent-muted border-accent/40 px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="label-text uppercase tracking-wider text-[0.7rem] text-accent shrink-0">
                  {selectedIds.size} selected
                </span>
                <div className="flex-1 min-w-0" />
                <button
                  type="button"
                  onClick={bulkWhatsApp}
                  className="btn-secondary text-xs min-h-[34px] py-1"
                  title="Send WhatsApp message to selected members"
                >
                  <Send className="w-3 h-3" />
                  Bulk WhatsApp
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="btn-ghost text-xs min-h-[34px] py-1 text-mid hover:text-hi"
                >
                  <X className="w-3 h-3" />
                  Deselect
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
                    <button type="button" onClick={openNew} className="btn-primary text-xs">
                      <UserPlus className="w-3.5 h-3.5" />
                      Register First Member
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStatus("all");
                        setSearch("");
                      }}
                      className="btn-secondary text-xs"
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
          onClose={() => setShowForm(false)}
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
}: {
  members: GymMember[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAllVisible: () => void;
  onEdit: (m: GymMember) => void;
  onRenew: (m: GymMember) => void;
  onReceipt: (m: GymMember) => void;
  onDelete: (m: GymMember) => void;
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
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-[0.65rem] text-faint">
              Member
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-[0.65rem] text-faint hidden lg:table-cell">
              Plan
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-[0.65rem] text-faint hidden md:table-cell">
              Start
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-[0.65rem] text-faint">
              End
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-[0.65rem] text-faint hidden sm:table-cell">
              Status
            </th>
            <th className="px-3 py-3 hairline-b label-text uppercase tracking-widest text-[0.65rem] text-faint text-right">
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
                    <div className="w-10 h-10 hairline surface-modal overflow-hidden shrink-0 relative">
                      {m.photo_url ? (
                        <Image
                          src={m.photo_url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[0.7rem] font-mono text-low">
                          {initials(m.full_name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-hi truncate font-medium">
                        {m.full_name || <span className="text-faint">—</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[0.7rem] text-low flex-wrap">
                        {m.mobile ? (
                          <a
                            href={`tel:${m.mobile}`}
                            className="hover:text-accent whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {m.mobile}
                          </a>
                        ) : (
                          <span className="text-faint">📞 —</span>
                        )}
                        {hasIncompleteProfile(m) && (
                          <span className="text-status-warning label-text uppercase tracking-wider text-[0.6rem] flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Incomplete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 hairline-b align-middle hidden lg:table-cell">
                  <div className="text-sm text-hi whitespace-nowrap">
                    {m.membership_type || "—"}
                  </div>
                  <div className="text-[0.65rem] font-mono text-low">
                    ₹{getPlanPrice(m.membership_type).toLocaleString("en-IN")}
                  </div>
                </td>
                <td className="px-3 py-3 hairline-b align-middle hidden md:table-cell text-xs text-mid whitespace-nowrap font-mono">
                  {formatDate(m.membership_start)}
                </td>
                <td className="px-3 py-3 hairline-b align-middle whitespace-nowrap">
                  <div
                    className={`text-xs font-mono ${
                      days === null
                        ? "text-mid"
                        : days < 0
                        ? "text-status-danger"
                        : days <= 2
                        ? "text-status-warning font-bold"
                        : days <= 7
                        ? "text-status-warning"
                        : "text-hi"
                    }`}
                  >
                    {formatDate(m.membership_end)}
                  </div>
                  {days !== null && (
                    <div className="text-[0.6rem] font-mono text-low mt-0.5">
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
                  <div className="flex items-center justify-end gap-1">
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
                      className="p-2 text-low hover:text-status-success hover:bg-surface-card transition-colors"
                      title="Message via WhatsApp"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`tel:${m.mobile || ""}`}
                      className="p-2 text-low hover:text-status-info hover:bg-surface-card transition-colors"
                      title="Call member"
                      aria-label="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onReceipt(m)}
                      className="p-2 text-low hover:text-accent hover:bg-surface-card transition-colors"
                      title="Generate receipt"
                      aria-label="Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                    {status === "expired" || status === "expiring" ? (
                      <button
                        type="button"
                        onClick={() => onRenew(m)}
                        className="p-2 text-low hover:bg-accent hover:text-white transition-colors"
                        title="Renew membership"
                        aria-label="Renew"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="p-2 text-low hover:text-accent hover:bg-surface-card transition-colors"
                      title="Edit member"
                      aria-label="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m)}
                      className="p-2 text-low hover:text-status-danger hover:bg-status-danger/10 transition-colors"
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
}: {
  members: GymMember[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  onEdit: (m: GymMember) => void;
  onRenew: (m: GymMember) => void;
  onReceipt: (m: GymMember) => void;
  onDelete: (m: GymMember) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {members.map((m) => {
        const checked = selectedIds.has(m.id);
        const days = getDaysRemaining(m.membership_end);
        const status = getMemberStatus(m.membership_end);
        return (
          <div
            key={m.id}
            className={`hairline surface-card transition-colors overflow-hidden flex flex-col ${
              checked ? "ring-1 ring-accent border-accent/60" : ""
            }`}
          >
            <div className="p-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSelect(m.id)}
                className="mt-1 w-4 h-4 accent-accent shrink-0"
                aria-label={`Select ${m.full_name || "member"}`}
              />
              <div className="w-14 h-14 hairline surface-modal overflow-hidden shrink-0 relative">
                {m.photo_url ? (
                  <Image
                    src={m.photo_url}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-mono text-low">
                    {initials(m.full_name)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="text-sm text-hi truncate font-medium">
                      {m.full_name || "—"}
                    </div>
                    <a
                      href={`tel:${m.mobile || ""}`}
                      className="text-[0.7rem] text-low hover:text-accent"
                    >
                      {m.mobile || "No mobile"}
                    </a>
                  </div>
                  {statusBadgeFor(m.membership_end)}
                </div>
                {hasIncompleteProfile(m) && (
                  <div className="mt-1.5 flex items-center gap-1 text-[0.6rem] text-status-warning label-text uppercase tracking-wider">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {countIncompleteFields(m)} missing field
                    {countIncompleteFields(m) === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </div>

            <div className="px-3 pb-3 space-y-1.5 hairline-b">
              <div className="flex justify-between text-xs">
                <span className="text-faint label-text uppercase tracking-wider text-[0.6rem]">
                  Plan
                </span>
                <span className="text-hi whitespace-nowrap">
                  {m.membership_type || "—"} · ₹
                  {getPlanPrice(m.membership_type).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-faint label-text uppercase tracking-wider text-[0.6rem]">
                  Valid
                </span>
                <span className="text-mid font-mono whitespace-nowrap">
                  {formatDate(m.membership_start)} →{" "}
                  {formatDate(m.membership_end)}
                </span>
              </div>
              {days !== null && (
                <div className="flex justify-between text-xs">
                  <span className="text-faint label-text uppercase tracking-wider text-[0.6rem]">
                    {days < 0 ? "Overdue" : "Remaining"}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      days < 0
                        ? "text-status-danger"
                        : days === 0
                        ? "text-status-danger"
                        : days <= 2
                        ? "text-status-warning"
                        : days <= 7
                        ? "text-status-warning"
                        : "text-status-success"
                    }`}
                  >
                    {days < 0
                      ? `${Math.abs(days)}d past`
                      : days === 0
                      ? "TODAY"
                      : `${days}d`}
                  </span>
                </div>
              )}
            </div>

            <div className="p-2 grid grid-cols-6 gap-1">
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
                className="p-2 text-low hover:text-status-success hover:bg-surface-elevated flex items-center justify-center"
                title="WhatsApp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
              {m.mobile ? (
                <a
                  href={`tel:${m.mobile}`}
                  className="p-2 text-low hover:text-status-info hover:bg-surface-elevated flex items-center justify-center"
                  title="Call"
                  aria-label="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-2 text-low opacity-30 flex items-center justify-center cursor-not-allowed"
                  title="No phone number"
                  aria-label="No phone"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onReceipt(m)}
                className="p-2 text-low hover:text-accent hover:bg-surface-elevated flex items-center justify-center"
                title="Receipt"
                aria-label="Receipt"
              >
                <Receipt className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRenew(m)}
                className="p-2 text-low hover:text-accent hover:bg-surface-elevated flex items-center justify-center"
                title="Renew"
                aria-label="Renew"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(m)}
                className="p-2 text-low hover:text-accent hover:bg-surface-elevated flex items-center justify-center"
                title="Edit"
                aria-label="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(m)}
                className="p-2 text-low hover:text-status-danger hover:bg-status-danger/10 flex items-center justify-center"
                title="Delete"
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
  return (
    <div
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="surface-modal hairline w-full max-w-md"
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
              className="font-display uppercase tracking-wide text-base text-status-danger"
            >
              Permanently Delete Member
            </h2>
            <p id="del-desc" className="mt-1 text-xs text-low">
              This action cannot be undone. The member's row in the database and
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
                <div className="w-full h-full flex items-center justify-center text-[0.7rem] font-mono text-low">
                  {initials(member.full_name)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-hi font-medium truncate">
                {member.full_name || "Unnamed member"}
              </div>
              <div className="text-[0.7rem] text-low font-mono">
                {member.mobile || "—"} · {member.membership_type || "No plan"}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label
              htmlFor="del-confirm"
              className="block label-text uppercase tracking-wider text-[0.65rem] text-faint mb-1.5"
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
              className="input-field font-mono"
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
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  );
}
