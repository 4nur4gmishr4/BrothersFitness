"use client";

import { useState, useCallback } from "react";
import {
  Settings,
  Database,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  IndianRupee,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  SectionCard,
  StatCard,
  EmptyState,
} from "@/components/admin/AdminUI";
import { adminFetch } from "@/lib/admin-api";
import {
  PLAN_PRICES,
  MEMBERSHIP_PLAN_DETAILS,
  GYM_NAME,
  WHATSAPP_COUNTRY_CODE,
} from "@/lib/config";

export default function AdminSettingsPage() {
  const [backupState, setBackupState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [backupResult, setBackupResult] = useState<{
    total: number;
    filename: string;
    storageUrl?: string | null;
  } | null>(null);

  const runBackup = useCallback(async () => {
    setBackupState("running");
    setBackupResult(null);
    try {
      const res = await adminFetch("/api/admin/backup", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Trigger a browser download of the JSON
      const json = JSON.stringify(data.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || `backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupResult({
        total: data.total_members,
        filename: data.filename,
        storageUrl: data.storage_url,
      });
      setBackupState("done");
      toast.success(`Backup downloaded — ${data.total_members} members`);
    } catch (e) {
      setBackupState("error");
      toast.error("Backup failed — see console for details");
    }
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
      <PageHeader
        title="Settings"
        subtitle="System info, membership plan reference, data backup, and security overview."
        icon={Settings}
      />

      <div className="space-y-6">
        {/* Gym info */}
        <SectionCard title="Gym Profile" subtitle="Read-only business constants configured in lib/config.ts" icon={Info}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Gym name" value={GYM_NAME} />
            <InfoRow label="WhatsApp country code" value={`+${WHATSAPP_COUNTRY_CODE}`} />
            <InfoRow
              label="Admin session TTL"
              value="24 hours"
            />
          </div>
        </SectionCard>

        {/* Plan prices */}
        <SectionCard
          title="Membership Plans"
          subtitle="Canonical plan names and prices. Edit lib/config.ts to change them — changes take effect on next build."
          icon={IndianRupee}
        >
          <div className="-mx-4 sm:-mx-5 overflow-x-auto">
            <table className="min-w-full w-full border-collapse">
              <thead>
                <tr className="surface-elevated text-left">
                  <th className="px-4 sm:px-5 py-2.5 hairline-b label-text uppercase tracking-widest text-xs text-faint">
                    Plan display name
                  </th>
                  <th className="px-4 sm:px-5 py-2.5 hairline-b label-text uppercase tracking-widest text-xs text-faint">
                    Stored value (membership_type)
                  </th>
                  <th className="px-4 sm:px-5 py-2.5 hairline-b label-text uppercase tracking-widest text-xs text-faint text-right">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {MEMBERSHIP_PLAN_DETAILS.map((p) => (
                  <tr key={p.value} className="hairline-b last:hairline-b-0 hover:bg-surface-elevated transition-colors">
                    <td className="px-4 sm:px-5 py-3 text-sm text-hi">
                      {p.label}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-xs font-mono text-mid">
                      {p.value}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-sm font-mono text-hi text-right">
                      ₹{(PLAN_PRICES as Record<string, number>)[p.value]?.toLocaleString("en-IN") ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-faint">
            Legacy aliases (Monthly → 1 Month, Quarterly → 3 Months, Half-Yearly → 6 Months) map
            to the same price and are preserved for existing DB rows.
          </p>
        </SectionCard>

        {/* Backup */}
        <SectionCard
          title="Database Backup"
          subtitle="Download a full JSON snapshot of all member records. Also attempts to store a copy in the Supabase 'backups' bucket."
          icon={Database}
          action={
            <button
              type="button"
              onClick={runBackup}
              disabled={backupState === "running"}
              className="btn-primary text-xs min-h-[40px]"
            >
              {backupState === "running" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download Backup
                </>
              )}
            </button>
          }
        >
          <div className="space-y-4">
            <div className="hairline border-status-warning/30 bg-status-warning/5 p-3 flex items-start gap-2.5 text-xs text-status-warning">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Backup files contain full member PII (names, phone numbers, DOB, addresses). Store
                them securely and delete when no longer needed.
              </span>
            </div>

            {backupState === "done" && backupResult && (
              <div className="hairline border-status-success/30 bg-status-success/5 p-3 flex items-start gap-2.5 text-xs text-status-success">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold uppercase tracking-widest font-mono mb-0.5">
                    Backup complete
                  </div>
                  <div>
                    {backupResult.total} members exported to{" "}
                    <span className="font-mono">{backupResult.filename}</span>
                  </div>
                  {backupResult.storageUrl && (
                    <a
                      href={backupResult.storageUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View in Storage
                    </a>
                  )}
                </div>
              </div>
            )}

            {backupState === "error" && (
              <div className="hairline border-status-danger/30 bg-status-danger/5 p-3 flex items-start gap-2.5 text-xs text-status-danger">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase tracking-widest font-mono mb-0.5">
                    Backup failed
                  </div>
                  Check the browser console for details. Verify the API route is
                  reachable and your session is still valid.
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3 text-xs text-mid">
              <div className="hairline surface-elevated p-3">
                <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                  Format
                </div>
                <div className="font-mono text-hi">JSON</div>
                <div className="text-xs text-faint mt-0.5">Full member schema</div>
              </div>
              <div className="hairline surface-elevated p-3">
                <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                  Storage target
                </div>
                <div className="font-mono text-hi">supabase/backups</div>
                <div className="text-xs text-faint mt-0.5">Falls back to browser download</div>
              </div>
              <div className="hairline surface-elevated p-3">
                <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
                  Audit log
                </div>
                <div className="font-mono text-hi">BACKUP event</div>
                <div className="text-xs text-faint mt-0.5">Logged in Activity Log</div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Security overview */}
        <SectionCard
          title="Security Overview"
          subtitle="Current hardened settings for the admin panel"
          icon={Shield}
        >
          <ul className="space-y-3">
            {[
              {
                ok: true,
                label: "HMAC token auth",
                desc: "All admin API routes require a signed HMAC-SHA256 Bearer token. Tokens expire after 24h.",
              },
              {
                ok: true,
                label: "Server-side rate limiting",
                desc: "Login endpoint is rate-limited to 5 attempts per 15 minutes per IP. Lockout returns 429 with retry-after.",
              },
              {
                ok: true,
                label: "Session token in sessionStorage",
                desc: "Token is stored in sessionStorage (tab-scoped, cleared on tab close) rather than a persistent cookie.",
              },
              {
                ok: true,
                label: "Activity audit log",
                desc: "Every member CREATE / UPDATE / DELETE and admin LOGIN / LOGOUT event is recorded with timestamp and IP.",
              },
              {
                ok: true,
                label: "Service-role client isolation",
                desc: "Admin routes use the Supabase service-role client directly. Public routes use the anon client with RLS.",
              },
              {
                ok: false,
                label: "No HttpOnly cookie for token",
                desc: "sessionStorage is readable by any JS on the page. An XSS vulnerability could expose the token. Mitigation: keep all third-party scripts trusted.",
              },
              {
                ok: false,
                label: "Read-state stored in localStorage",
                desc: "Lead read/unread status is tracked in localStorage — device-local only. Not synced across sessions or admins.",
              },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 hairline flex items-center justify-center shrink-0 mt-0.5 ${
                    item.ok
                      ? "bg-status-success/10 text-status-success border-status-success/30"
                      : "bg-status-warning/10 text-status-warning border-status-warning/30"
                  }`}
                >
                  {item.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-hi font-medium">{item.label}</div>
                  <div className="text-xs text-low mt-0.5">{item.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline surface-elevated p-3">
      <div className="label-text uppercase tracking-widest text-xs text-faint mb-1">
        {label}
      </div>
      <div className="text-sm text-hi font-mono">{value}</div>
    </div>
  );
}
