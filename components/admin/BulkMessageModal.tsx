"use client";

import { useState, useMemo } from "react";
import {
  X,
  Send,
  MessageCircle,
  Gift,
  AlertTriangle,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { openWhatsApp, buildWhatsAppUrl } from "@/lib/admin-api";
import type { GymMember } from "@/lib/supabase";
import { getMemberStatus, parseLocalDate } from "@/lib/member-utils";

interface BulkMessageModalProps {
  open: boolean;
  /**
   * Pre-selected recipients (e.g. from checkbox selection on Members page).
   * When provided, a "Selected" filter tab is shown and defaults to it.
   */
  recipients?: GymMember[];
  /**
   * Full member list — required so "Active / Expiring / Expired / Birthday"
   * filter tabs operate across the entire gym roster, not just the selection.
   */
  allMembers?: GymMember[];
  onClose: () => void;
}

type FilterType =
  | "all"
  | "active"
  | "expiring"
  | "expired"
  | "birthday"
  | "selection";

const MESSAGE_TEMPLATES = {
  birthday: {
    icon: Gift,
    label: "Happy Birthday 🎂",
    message:
      "Happy Birthday from Brother's Fitness! 🎉\n\nWishing you a power-packed year ahead. Keep crushing those goals! 💪\n\n- Team Brothers Fitness",
  },
  newBatch: {
    icon: Users,
    label: "New Batch Alert 🏋️",
    message:
      "New training batch starting soon at Brother's Fitness!\n\nEarly morning & evening slots available.\n📍 Limited spots — register now!\n\n- Team Brothers Fitness",
  },
  expiry: {
    icon: AlertTriangle,
    label: "Expiry Reminder ⚠️",
    message:
      "Hi from Brother's Fitness!\n\nYour subscription is expiring soon. Renew now to keep training without interruption.\n\n💪 Stay strong, stay fit!\n\n- Team Brothers Fitness",
  },
};

function getNextBirthday(dateString: string, today: Date): Date {
  const dob = parseLocalDate(dateString);
  if (!dob) return new Date(today.getFullYear() + 1, 0, 1); // Fallback: next Jan 1
  let bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (bday < today) bday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
  return bday;
}

export default function BulkMessageModal({
  open,
  recipients = [],
  allMembers = [],
  onClose,
}: BulkMessageModalProps) {
  // Always call hooks unconditionally (rules of hooks).
  const modalProps = useModalDismiss(onClose);

  const hasPreselection = recipients.length > 0;

  const [filter, setFilter] = useState<FilterType>(
    hasPreselection ? "selection" : "all"
  );
  const [message, setMessage] = useState(MESSAGE_TEMPLATES.newBatch.message);
  const [copied, setCopied] = useState(false);

  // Use allMembers as the base pool for status filters; fall back to recipients
  // if allMembers was not provided (backward-compatible).
  const pool = allMembers.length > 0 ? allMembers : recipients;

  // Reset filter tab when modal opens/closes or selection changes.
  useMemo(() => {
    if (!open) return;
    setFilter(hasPreselection ? "selection" : "all");
  }, [open, hasPreselection]);

  const filteredMembers = useMemo(() => {
    if (filter === "selection") return recipients;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    return pool.filter((m) => {
      if (filter === "all") return true;

      if (filter === "birthday") {
        if (!m.date_of_birth) return false;
        const bday = getNextBirthday(m.date_of_birth, today);
        return bday >= today && bday <= next7;
      }

      const s = getMemberStatus(m.membership_end);
      if (filter === "active") return s === "active";
      if (filter === "expiring") return s === "expiring";
      if (filter === "expired") return s === "expired";
      return true;
    });
  }, [filter, pool, recipients]);

  // Compute counts for every filter tab using the correct pool.
  const filterCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7 = new Date(today);
    next7.setDate(today.getDate() + 7);

    let active = 0, expiring = 0, expired = 0, birthday = 0;
    for (const m of pool) {
      const s = getMemberStatus(m.membership_end);
      if (s === "active") active++;
      else if (s === "expiring") expiring++;
      else expired++;

      if (m.date_of_birth) {
        const bday = getNextBirthday(m.date_of_birth, today);
        if (bday >= today && bday <= next7) birthday++;
      }
    }
    return {
      all: pool.length,
      selection: recipients.length,
      active,
      expiring,
      expired,
      birthday,
    };
  }, [pool, recipients]);

  const phoneNumbers = filteredMembers
    .map((m) => m.mobile)
    .filter((n): n is string => !!n && n.replace(/\D/g, "").length >= 7);

  const copyNumbers = async () => {
    if (phoneNumbers.length === 0) {
      toast.error("No members with phone numbers in this group");
      return;
    }
    try {
      // Newline-separated — WhatsApp Web bulk entry expects one number per line.
      await navigator.clipboard.writeText(phoneNumbers.join("\n"));
      setCopied(true);
      toast.success(
        `Copied ${phoneNumbers.length} number${phoneNumbers.length === 1 ? "" : "s"}`
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard access denied — please allow clipboard permissions");
    }
  };

  const sendOne = (phone: string) => {
    if (!phone) { toast.error("No phone number"); return; }
    openWhatsApp(phone, message);
  };

  const openAllUrls = () => {
    if (filteredMembers.length === 0) return;
    let opened = 0;
    for (const m of filteredMembers.slice(0, 20)) {
      if (!m.mobile) continue;
      const url = buildWhatsAppUrl(m.mobile, message);
      if (!url) continue; // Skip members with invalid/short numbers
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      opened++;
    }
    toast.success(
      `Opened ${opened} WhatsApp tab${opened === 1 ? "" : "s"}. If tabs were blocked, allow popups for this site.`
    );
  };

  if (!open) return null;

  const FILTER_TABS: [FilterType, string][] = [
    ["all", "All"],
    ...(hasPreselection ? [["selection", "Selected"] as [FilterType, string]] : []),
    ["active", "Active"],
    ["expiring", "Expiring"],
    ["expired", "Expired"],
    ["birthday", "Birthdays (7d)"],
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[60] flex items-start sm:items-center justify-center overflow-y-auto modal-overlay-in p-4"
      onClick={onClose}
    >
      <div
        {...modalProps}
        aria-label="Bulk WhatsApp message"
        className="surface-modal hairline p-4 sm:p-6 w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:max-h-[92vh] overflow-y-auto sm:my-4 modal-panel-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <h2 className="heading-section text-lg text-hi uppercase flex items-center gap-2">
            <Send className="w-5 h-5 text-status-success" />
            Bulk WhatsApp Message
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-low hover:text-hi p-1 hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message templates */}
        <div className="flex flex-wrap gap-2 mb-4 shrink-0">
          {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => {
            const Icon = template.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMessage(template.message)}
                className="flex items-center gap-2 px-3 py-2 surface-card hairline hover:border-accent transition-colors text-sm text-mid hover:text-hi"
              >
                <Icon className="w-4 h-4" />
                {template.label}
              </button>
            );
          })}
        </div>

        {/* Message textarea */}
        <label
          htmlFor="bulk-message-body"
          className="label-text uppercase tracking-wider text-xs text-faint block mb-1.5 shrink-0"
        >
          Message body
        </label>
        <textarea
          id="bulk-message-body"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-field h-32 resize-none shrink-0"
          placeholder="Type your message…"
        />

        {/* Filter tabs */}
        <div className="mt-4 mb-3 shrink-0">
          <div className="label-text uppercase tracking-wider text-xs text-faint mb-2">
            Target group
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map(([f, label]) => {
              const count = filterCounts[f] ?? 0;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1.5 text-xs font-mono uppercase transition-colors hairline ${
                    filter === f
                      ? "bg-accent text-white border-accent"
                      : "surface-modal text-low hover:border-accent hover:text-hi"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Member list */}
        <div className="surface-card hairline p-3 sm:p-4 my-2 flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <span className="text-sm font-mono text-low">
              {filteredMembers.length} member
              {filteredMembers.length === 1 ? "" : "s"} ·{" "}
              {phoneNumbers.length} with phone
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyNumbers}
                className="flex items-center gap-1.5 px-3 py-1.5 surface-modal hairline text-xs text-mid hover:border-accent hover:text-hi transition-colors"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-status-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied!" : "Copy Numbers"}
              </button>
              {filteredMembers.length > 0 && filteredMembers.length <= 20 && (
                <button
                  type="button"
                  onClick={openAllUrls}
                  className="flex items-center gap-1.5 px-3 py-1.5 surface-modal hairline text-xs text-status-success hover:border-status-success/40 transition-colors"
                  title={`Open ${filteredMembers.length} WhatsApp tabs`}
                >
                  <MessageCircle className="w-3 h-3" />
                  Open All
                </button>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto scrollbar-hide space-y-1 flex-1 min-h-0">
            {filteredMembers.length === 0 ? (
              <p className="text-xs text-faint text-center py-8">
                No members match the current filter.
              </p>
            ) : (
              <>
                {filteredMembers.slice(0, 50).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-sm py-1.5 hairline-b last:hairline-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-hi truncate text-sm">
                        {m.full_name || "Unnamed"}
                      </div>
                      <div className="text-xs text-faint font-mono truncate">
                        {m.mobile || "— no phone"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => sendOne(m.mobile || "")}
                      disabled={!m.mobile}
                      className="ml-2 p-1.5 text-low hover:text-status-success hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={m.mobile ? `Send to ${m.full_name || "member"}` : "No phone number"}
                      aria-label={`Send to ${m.full_name || "member"}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {filteredMembers.length > 50 && (
                  <p className="text-xs text-faint text-center pt-3">
                    +{filteredMembers.length - 50} more — use Copy Numbers for
                    the full list
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-4 space-y-2 shrink-0">
          <button
            type="button"
            onClick={copyNumbers}
            className="btn-primary w-full"
            disabled={phoneNumbers.length === 0}
          >
            <Copy className="w-4 h-4" />
            Copy All {phoneNumbers.length > 0 ? `${phoneNumbers.length} ` : ""}
            Numbers for WhatsApp Web
          </button>
          <p className="text-xs text-faint text-center">
            Open WhatsApp Web → New chat → paste numbers into the search field
            to bulk-message
          </p>
        </div>
      </div>
    </div>
  );
}
