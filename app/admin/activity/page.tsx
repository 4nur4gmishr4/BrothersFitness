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
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { PageHeader, StatCard, EmptyState, AdminLoader } from "@/components/admin/AdminUI";
import { adminFetch } from "@/lib/admin-api";
import CountUp from "@/components/ui/text/CountUp";
import LiveBeacon from "@/components/ui/primitives/LiveBeacon";

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

const FILTERS = [
  { label: "All Events", key: "all" },
  { label: "Created", key: "CREATE" },
  { label: "Updated", key: "UPDATE" },
  { label: "Deleted", key: "DELETE" },
  { label: "Auth", key: "AUTH" },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionStyle(type: string): {
  icon: typeof Plus;
  status: "active" | "success" | "alert" | "idle";
  badge: string;
  label: string;
} {
  switch (type) {
    case "CREATE":
      return {
        icon: Plus,
        status: "active",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        label: "CREATED",
      };
    case "UPDATE":
      return {
        icon: Edit2,
        status: "idle",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        label: "UPDATED",
      };
    case "DELETE":
      return {
        icon: Trash2,
        status: "alert",
        badge: "bg-red-500/10 text-red-400 border-red-500/30",
        label: "DELETED",
      };
    case "LOGIN":
    case "LOGOUT":
      return {
        icon: ShieldCheck,
        status: "success",
        badge: "bg-surface-elevated text-mid border-surface-border",
        label: type,
      };
    default:
      return {
        icon: FileText,
        status: "idle",
        badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
        label: type,
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

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch(`/api/admin/activity-logs?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: LogEntry[] = (data.logs || []).slice().sort(
        (a: LogEntry, b: LogEntry) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
    const map: Record<string, number> = {};
    for (const l of logs) {
      map[l.action_type] = (map[l.action_type] || 0) + 1;
    }
    return map;
  }, [logs]);

  const filtered = useMemo(() => {
    let list = logs;
    if (actionFilter !== "all") {
      list = list.filter((l) => l.action_type === actionFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          (l.member_name || "").toLowerCase().includes(q) ||
          (l.action_type || "").toLowerCase().includes(q) ||
          (l.ip_address || "").toLowerCase().includes(q) ||
          JSON.stringify(l.details || {}).toLowerCase().includes(q)
      );
    }
    return list;
  }, [logs, actionFilter, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
      <PageHeader
        title="Activity Audit Log"
        subtitle="Clean immutable chronological record of all member registrations, modifications, and security events."
        icon={Clock}
        actions={
          <button
            type="button"
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-low" />
            <span>Refresh</span>
          </button>
        }
      />

      {loading ? (
        <AdminLoader text="Loading audit stream…" />
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <div className="font-semibold text-lg text-red-500 mb-1">Failed to load audit logs</div>
          <div className="text-sm text-zinc-400 mb-4">{error}</div>
          <button
            type="button"
            onClick={fetchLogs}
            className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-xs font-medium text-hi"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Summary KPI Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            <StatCard
              label="Total Events"
              value={<CountUp to={logs.length} />}
              sublabel="All recorded actions"
              icon={FileText}
              variant="info"
            />
            <StatCard
              label="Member Creates"
              value={<CountUp to={counts.CREATE || 0} />}
              sublabel="New registrations"
              icon={Plus}
              variant="success"
              onClick={() => setActionFilter("CREATE")}
            />
            <StatCard
              label="Profile Updates"
              value={<CountUp to={counts.UPDATE || 0} />}
              sublabel="Plan & detail edits"
              icon={Edit2}
              variant="accent"
              onClick={() => setActionFilter("UPDATE")}
            />
            <StatCard
              label="Deletions"
              value={<CountUp to={counts.DELETE || 0} />}
              sublabel="Removed records"
              icon={Trash2}
              variant="danger"
              onClick={() => setActionFilter("DELETE")}
            />
          </div>

          {/* Clean Audit Timeline Container */}
          <div className="rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
            
            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-surface-border pb-4">
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActionFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                      actionFilter === f.key
                        ? "bg-surface-elevated text-hi font-semibold border border-surface-border shadow-sm"
                        : "text-mid hover:text-hi hover:bg-surface-elevated/60 border border-transparent"
                    }`}
                  >
                    {f.label} {f.key !== "all" && counts[f.key] ? `(${counts[f.key]})` : ""}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-low absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, IP, action…"
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl pl-9 pr-4 py-2 placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium"
                />
              </div>
            </div>

            {/* Timeline Stream */}
            {filtered.length === 0 ? (
              <EmptyState title="No matching events" description="No audit log entries matched your filter." />
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-surface-border">
                {filtered.map((log) => {
                  const style = getActionStyle(log.action_type);
                  const isExpanded = expandedId === log.id;

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Node Icon Pin */}
                      <div className="absolute -left-6 sm:-left-8 top-1.5 flex items-center justify-center">
                        <LiveBeacon status={style.status} size="sm" />
                      </div>

                      {/* Event Row Box */}
                      <div className="rounded-2xl border border-surface-border bg-surface-elevated/40 p-4 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all hover:bg-surface-elevated/70 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${style.badge}`}
                            >
                              {style.label}
                            </span>
                            {log.member_name ? (
                              <span className="text-xs font-semibold text-hi flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-mid" />
                                {log.member_name}
                              </span>
                            ) : (
                              <span className="text-xs text-mid font-medium">System Action</span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-mid shrink-0">
                            {log.ip_address && (
                              <span className="hidden sm:inline text-xs text-faint tabular-nums font-medium">
                                IP: {log.ip_address}
                              </span>
                            )}
                            <span className="text-xs text-mid tabular-nums font-medium">{formatTime(log.created_at)}</span>
                            {log.details ? (
                              <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                className="p-1 rounded hover:bg-surface-elevated text-mid hover:text-hi transition-colors"
                                title="Inspect payload"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Expandable JSON Detail Payload */}
                        {isExpanded && log.details ? (
                          <div className="mt-3 pt-3 border-t border-surface-border">
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-faint mb-1">
                              Action Metadata Payload
                            </div>
                            <pre className="text-xs bg-surface-soft border border-surface-border rounded-xl p-3 text-hi overflow-x-auto font-sans leading-relaxed">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
