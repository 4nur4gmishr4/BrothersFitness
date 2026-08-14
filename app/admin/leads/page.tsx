"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail,
  Phone,
  Trash2,
  MessageCircle,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ChevronRight,
  User,
  Eye,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  StatCard,
  SectionCard,
  StatusBadge,
  EmptyState,
  DataTableSkeleton,
  SearchField,
  Skeleton,
} from "@/components/admin/AdminUI";
import { adminFetch, openWhatsApp } from "@/lib/admin-api";
import { formatDate } from "@/lib/member-utils";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

const READ_KEY = "brofit_admin_read_leads";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadRead = useCallback(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw);
      return new Set<string>(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, []);

  const saveRead = useCallback((ids: Set<string>) => {
    try {
      // Cap at 500 most recently added IDs to prevent unbounded localStorage growth
      const arr = Array.from(ids).slice(-500);
      localStorage.setItem(READ_KEY, JSON.stringify(arr));
    } catch {
      // Storage full or disabled — non-fatal, read status won't persist across reloads.
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch(`/api/admin/leads?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Lead[] = (data.leads || []).slice().sort(
        (a: Lead, b: Lead) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLeads(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setReadIds(loadRead());
    fetchLeads();
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") fetchLeads();
    }, 30000);
    return () => clearInterval(iv);
  }, [fetchLeads, loadRead]);

  const markRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveRead(next);
      return next;
    });
  };

  const markAllRead = () => {
    const allIds = new Set(leads.map((l) => l.id));
    setReadIds(allIds);
    saveRead(allIds);
    toast.success("Marked all as read");
  };

  const onSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
    markRead(id);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("HTTP error");
      setLeads((prev) => prev.filter((l) => l.id !== id));
      if (selectedId === id) setSelectedId(null);
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        saveRead(next);
        return next;
      });
      setDeletingId(null);
      toast.success("Lead deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const unreadCount = useMemo(
    () => leads.filter((l) => !readIds.has(l.id)).length,
    [leads, readIds]
  );

  const filtered = useMemo(() => {
    let list = leads;
    if (filter === "unread") list = list.filter((l) => !readIds.has(l.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          l.email.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, search, filter, readIds]);

  const selected = selectedId ? leads.find((l) => l.id === selectedId) || null : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
      <PageHeader
        title="Leads Inbox"
        subtitle="Messages from the contact form on your website. Reply via WhatsApp or call, or mark read as you work through them."
        icon={Inbox}
        actions={
          <>
            <button
              type="button"
              onClick={fetchLeads}
              className="btn-ghost text-xs min-h-[40px]"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={markAllRead}
              className="btn-secondary text-xs min-h-[40px]"
              disabled={unreadCount === 0}
              aria-disabled={unreadCount === 0}
              title="Mark all leads as read"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <StatCard
          label="Total Leads"
          value={leads.length.toLocaleString()}
          sublabel={loading ? "…" : "All time"}
          icon={Inbox}
          variant="info"
        />
        <StatCard
          label="Unread"
          value={unreadCount.toLocaleString()}
          sublabel={unreadCount > 0 ? "Needs attention" : "Inbox zero 🏆"}
          variant="warning"
          onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
        />
        <StatCard
          label="Last 7 Days"
          value={useMemo(() => {
            const cutoff = Date.now() - 7 * 86400000;
            return leads.filter((l) => new Date(l.created_at).getTime() >= cutoff).length;
          }, [leads]).toLocaleString()}
          sublabel="Recent submissions"
          variant="success"
        />
        <StatCard
          label="With Phone"
          value={useMemo(
            () => leads.filter((l) => l.phone && l.phone.replace(/\D/g, "").length >= 10).length,
            [leads]
          ).toLocaleString()}
          sublabel="Callable / WhatsApp-able"
          variant="accent"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-5 min-h-[500px]">
          <div className="lg:col-span-2 space-y-2">
            <DataTableSkeleton cols={2} rows={10} />
          </div>
          <div className="lg:col-span-3">
            <div className="hairline surface-card p-5 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full mt-4" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="hairline border-status-danger/30 bg-status-danger/5 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
          <div className="font-display uppercase text-lg text-status-danger mb-1">
            Failed to load inbox
          </div>
          <div className="text-sm text-mid mb-4">{error}</div>
          <button type="button" onClick={fetchLeads} className="btn-secondary text-xs">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5 min-h-[500px]">
          {/* List column */}
          <div className="lg:col-span-2 flex flex-col">
            <SectionCard
              title={filter === "all" ? "All Leads" : "Unread Leads"}
              subtitle={`${filtered.length} of ${leads.length}`}
              icon={Mail}
              className="flex-1 flex flex-col"
              action={
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:max-w-[260px]">
                    <SearchField
                      value={search}
                      onChange={setSearch}
                      placeholder="Search…"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as "all" | "unread")}
                      className="input-field text-xs appearance-none pr-8 cursor-pointer"
                      aria-label="Filter leads"
                    >
                      <option value="all">All</option>
                      <option value="unread">Unread only</option>
                    </select>
                  </div>
                </div>
              }
            >
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title={leads.length === 0 ? "No leads yet" : "No leads match"}
                  description={
                    leads.length === 0
                      ? "When visitors submit the contact form, they'll appear here."
                      : "Try clearing filters or search."
                  }
                />
              ) : (
                <ul className="-mx-4 sm:-mx-5 -my-4 sm:-my-5 divide-y divide-surface-border">
                  {filtered.map((l) => {
                    const isRead = readIds.has(l.id);
                    const isSel = l.id === selectedId;
                    return (
                      <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(l.id)}
                        className={`w-full text-left px-4 sm:px-5 py-3 sm:py-4 transition-colors flex items-start gap-3 group ${
                          isSel
                            ? "bg-accent-muted"
                            : isRead
                            ? "hover:bg-surface-elevated"
                            : "hover:bg-surface-elevated/60"
                        }`}
                        aria-current={isSel ? "true" : undefined}
                      >
                        <div className="w-8 h-8 hairline surface-modal flex items-center justify-center shrink-0 text-low mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`truncate text-sm ${
                                isRead ? "text-mid" : "text-hi font-bold"}`}
                            >
                              {l.name || "Anonymous"}
                            </span>
                            {!isRead && (
                              <span className="shrink-0 w-2 h-2 bg-accent rounded-full" />
                            )}
                          </div>
                          <div className="text-xs text-low truncate font-mono">
                            {l.phone || l.email || "no contact"}
                          </div>
                          <p className="text-xs text-faint mt-1 line-clamp-1">
                            {l.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-faint font-mono whitespace-nowrap">
                            {formatTime(l.created_at)}
                          </span>
                          <ChevronRight
                            className={`w-3 h-3 transition-opacity ${
                              isSel ? "opacity-100 text-accent" : "opacity-0 group-hover:opacity-100 text-low"
                            }`}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* Detail column */}
          <div className="lg:col-span-3">
            {selected ? (
              <SectionCard
                title={`Lead details`}
                subtitle={`Received ${formatDate(selected.created_at)} · ${formatTime(selected.created_at)}`}
                icon={Eye}
                className="h-full flex flex-col"
                action={
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {!readIds.has(selected.id) && (
                      <StatusBadge tone="warning" prefix="!" label="UNREAD" />
                    )}
                    {selected.phone && (
                      <>
                        <a
                          href={`tel:${selected.phone}`}
                          className="btn-ghost text-xs min-h-[34px] py-1"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              selected.phone,
                              `Hi ${selected.name || "there"}! 👋\n\nThanks for reaching out to Brother's Fitness. We got your message:\n\n"${selected.message}"\n\nHow can we help you get started? 💪`
                            )
                          }
                          className="btn-secondary text-xs min-h-[34px] py-1 text-status-success hover:text-status-success border-status-success/40 hover:bg-status-success/10"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>
                      </>
                    )}
                    {deletingId === selected.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(selected.id)}
                          className="btn-primary text-xs min-h-[34px] py-1 bg-status-danger hover:bg-status-danger border-status-danger"
                        >
                          <Trash2 className="w-3 h-3" /> Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="btn-ghost text-xs min-h-[34px] py-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(selected.id)}
                        className="btn-ghost text-xs min-h-[34px] py-1 text-status-danger hover:text-status-danger"
                        title="Delete lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                }
              >
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                        Full name
                      </div>
                      <div className="text-sm text-hi">
                        {selected.name || <span className="text-faint">—</span>}
                      </div>
                    </div>
                    <div>
                      <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                        Email
                      </div>
                      <div className="text-sm text-hi break-all">
                        {selected.email ? (
                          <a
                            href={`mailto:${selected.email}`}
                            className="hover:text-accent"
                          >
                            {selected.email}
                          </a>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                        Phone
                      </div>
                      <div className="text-sm text-hi font-mono">
                        {selected.phone ? (
                          <a href={`tel:${selected.phone}`} className="hover:text-accent">
                            {selected.phone}
                          </a>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                        Submitted
                      </div>
                      <div className="text-sm text-hi font-mono">
                        {new Date(selected.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="label-text uppercase tracking-widest text-xs text-faint mb-2">
                      Message
                    </div>
                    <div className="hairline surface-elevated p-4 text-sm text-hi whitespace-pre-wrap break-words leading-relaxed">
                      {selected.message || (
                        <span className="text-faint italic">No message body</span>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard
                title="Select a lead"
                subtitle="Click a lead on the left to view full details and reply"
                icon={Eye}
                className="h-full flex items-center justify-center min-h-[400px]"
              >
                <EmptyState
                  icon={Eye}
                  title="Nothing selected"
                  description="Pick any lead on the left — you'll see their message, contact details, and one-click reply actions here."
                />
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
