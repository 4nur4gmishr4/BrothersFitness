"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  FileText,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronRight,
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
import { adminFetch } from "@/lib/admin-api";
import { formatDate } from "@/lib/member-utils";

interface LogEntry {
  id: string;
  action_type: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | string;
  member_name?: string | null;
  member_id?: string | null;
  admin_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details: unknown;
  created_at: string;
}

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All actions" },
  { key: "CREATE", label: "Member created" },
  { key: "UPDATE", label: "Member updated" },
  { key: "DELETE", label: "Member deleted" },
  { key: "LOGIN", label: "Admin login" },
  { key: "LOGOUT", label: "Admin logout" },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionMeta(type: string) {
  switch (type) {
    case "CREATE":
      return {
        icon: Plus,
        tone: "success" as const,
        prefix: "+",
        label: "CREATE",
      };
    case "UPDATE":
      return {
        icon: Edit2,
        tone: "info" as const,
        prefix: "~",
        label: "UPDATE",
      };
    case "DELETE":
      return {
        icon: Trash2,
        tone: "danger" as const,
        prefix: "×",
        label: "DELETE",
      };
    case "LOGIN":
      return {
        icon: ShieldAlert,
        tone: "accent" as const,
        prefix: "→",
        label: "LOGIN",
      };
    case "LOGOUT":
      return {
        icon: ShieldAlert,
        tone: "neutral" as const,
        prefix: "←",
        label: "LOGOUT",
      };
    default:
      return {
        icon: FileText,
        tone: "neutral" as const,
        prefix: "•",
        label: String(type || "OTHER"),
      };
  }
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch(`/api/admin/activity-logs?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: LogEntry[] = (data.logs || []).slice().sort(
        (a: LogEntry, b: LogEntry) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLogs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: logs.length };
    for (const l of logs) {
      const t = l.action_type || "OTHER";
      c[t] = (c[t] || 0) + 1;
    }
    return c;
  }, [logs]);

  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return logs.filter((l) => new Date(l.created_at).getTime() >= cutoff).length;
  }, [logs]);

  const filtered = useMemo(() => {
    let list = logs;
    if (actionFilter !== "all")
      list = list.filter((l) => l.action_type === actionFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => {
        const haystacks = [
          l.member_name,
          l.action_type,
          l.admin_id,
          l.ip_address,
          typeof l.details === "string" ? l.details : JSON.stringify(l.details ?? ""),
        ];
        return haystacks.some((h) =>
          String(h || "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [logs, actionFilter, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto">
      <PageHeader
        title="Activity Log"
        subtitle="Immutable audit trail of every admin action — member creates, edits, deletes, and admin session events."
        icon={Clock}
        actions={
          <button
            type="button"
            onClick={fetchLogs}
            className="btn-ghost text-xs min-h-[40px]"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <StatCard
          label="Total Events"
          value={logs.length.toLocaleString()}
          sublabel="All history"
          icon={FileText}
          variant="info"
        />
        <StatCard
          label="Last 7 Days"
          value={last7.toLocaleString()}
          sublabel="Recent activity"
          icon={Clock}
          variant="success"
        />
        <StatCard
          label="Creates"
          value={(counts.CREATE || 0).toLocaleString()}
          sublabel="Member registrations"
          variant="accent"
          onClick={() => setActionFilter("CREATE")}
        />
        <StatCard
          label="Deletes"
          value={(counts.DELETE || 0).toLocaleString()}
          sublabel="Destructive actions"
          variant="danger"
          onClick={() => setActionFilter("DELETE")}
        />
      </div>

      <SectionCard
        title="Event stream"
        subtitle={
          actionFilter === "all"
            ? `Showing ${filtered.length} of ${logs.length} events — newest first`
            : `${actionFilter} — ${filtered.length} event${filtered.length === 1 ? "" : "s"}`
        }
        icon={Clock}
      >
        {loading ? (
          <DataTableSkeleton cols={5} rows={12} />
        ) : error ? (
          <div className="hairline border-status-danger/30 bg-status-danger/5 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-3" />
            <div className="font-display uppercase text-lg text-status-danger mb-1">
              Failed to load activity
            </div>
            <div className="text-sm text-mid mb-4">{error}</div>
            <button type="button" onClick={fetchLogs} className="btn-secondary text-xs">
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:items-center">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search member name, details, IP…"
                className="flex-1"
              />
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className="btn-secondary text-xs min-h-[40px] w-full sm:w-auto gap-2"
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                >
                  Action: <span className="font-mono">{actionFilter}</span>
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
                      className="absolute right-0 mt-2 z-40 hairline surface-modal w-64 overflow-hidden shadow-lg"
                    >
                      {FILTERS.map((f) => (
                        <button
                          type="button"
                          key={f.key}
                          onClick={() => {
                            setActionFilter(f.key);
                            setFilterOpen(false);
                          }}
                          role="option"
                          aria-selected={actionFilter === f.key}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left label-text uppercase tracking-wider transition-colors hairline-b last:hairline-b-0 ${
                            actionFilter === f.key
                              ? "bg-accent-muted text-hi"
                              : "hover:bg-surface-elevated text-mid"
                          }`}
                        >
                          <span>{f.label}</span>
                          <span className="font-mono text-[0.65rem] opacity-70">
                            {counts[f.key] ?? 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {(actionFilter !== "all" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setActionFilter("all");
                    setSearch("");
                  }}
                  className="btn-ghost text-xs text-status-warning hover:text-status-warning"
                >
                  Clear filters
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title={
                  logs.length === 0
                    ? "No activity recorded yet"
                    : "No events match your filters"
                }
                description={
                  logs.length === 0
                    ? "Member changes and admin logins will appear here as they happen."
                    : "Try resetting filters or broadening your search."
                }
                action={
                  actionFilter !== "all" || search ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionFilter("all");
                        setSearch("");
                      }}
                      className="btn-secondary text-xs"
                    >
                      Reset Filters
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="-mx-4 sm:-mx-5 divide-y divide-surface-border overflow-hidden">
                {filtered.map((l) => {
                  const meta = actionMeta(l.action_type);
                  const Icon = meta.icon;
                  const expanded = expandedId === l.id;
                  const detailsText =
                    l.details === null || l.details === undefined
                      ? ""
                      : typeof l.details === "string"
                      ? l.details
                      : JSON.stringify(l.details, null, 2);
                  return (
                    <div key={l.id} className="px-4 sm:px-5 py-3 group">
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() =>
                          setExpandedId(expanded ? null : l.id)
                        }
                        role="button"
                        aria-expanded={expanded}
                      >
                        <div
                          className={`w-9 h-9 hairline flex items-center justify-center shrink-0 mt-0.5 ${
                            meta.tone === "success"
                              ? "bg-status-success/10 text-status-success border-status-success/30"
                              : meta.tone === "info"
                              ? "bg-status-info/10 text-status-info border-status-info/30"
                              : meta.tone === "danger"
                              ? "bg-status-danger/10 text-status-danger border-status-danger/30"
                              : meta.tone === "accent"
                              ? "bg-accent/10 text-accent border-accent/30"
                              : "bg-surface-elevated text-low"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              tone={
                                meta.tone === "accent" || meta.tone === "neutral"
                                  ? "neutral"
                                  : meta.tone
                              }
                              prefix={meta.prefix}
                              label={meta.label}
                            />
                            <span className="text-sm text-hi font-medium truncate">
                              {l.member_name ||
                                (l.action_type === "LOGIN" || l.action_type === "LOGOUT"
                                  ? `Admin session`
                                  : "Unknown subject")}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[0.7rem] text-low font-mono">
                            <span>{formatTime(l.created_at)}</span>
                            {l.admin_id && <span>admin: {l.admin_id.slice(0, 8)}</span>}
                            {l.ip_address && <span>IP: {l.ip_address}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expanded ? null : l.id);
                            }}
                            className="p-1.5 text-low hover:text-hi hover:bg-surface-elevated transition-colors"
                            aria-label={expanded ? "Collapse details" : "Expand details"}
                            title="Toggle details"
                          >
                            {expanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {expanded && detailsText && (
                        <div className="mt-3 ml-12">
                          <pre className="text-[0.7rem] text-mid surface-canvas hairline p-3 overflow-x-auto font-mono whitespace-pre-wrap break-words leading-relaxed">
                            {detailsText}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
