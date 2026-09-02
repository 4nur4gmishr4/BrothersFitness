"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { MessageCircle, Download, Copy, Check, X, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLAN_PRICES } from "@/lib/config";
import { formatDate, formatTodayIST, initials } from "@/lib/member-utils";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { openWhatsApp } from "@/lib/admin-api";
import { Portal } from "@/components/ui/primitives/Portal";
import type { GymMember } from "@/lib/supabase";
import LiveBeacon from "@/components/ui/primitives/LiveBeacon";

interface MemberReceiptModalProps {
  member: GymMember;
  onClose: () => void;
}

export default function MemberReceiptModal({ member, onClose }: MemberReceiptModalProps) {
  const amount = (PLAN_PRICES as Record<string, number>)[member.membership_type || "1 Month"] || 0;
  const modalProps = useModalDismiss(onClose);
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const receiptId = `BF-REC-${(member.id || "").slice(0, 8).toUpperCase()}`;

  const getWhatsAppMessage = () => {
    return `*BROTHER'S FITNESS - OFFICIAL RECEIPT* 🏋️‍♂️

🧾 *Receipt No:* ${receiptId}
👤 *Member Name:* ${member.full_name || "Valued Member"}
📱 *Mobile:* ${member.mobile || "-"}
📋 *Plan Tier:* ${member.membership_type || "Standard"}
📅 *Validity:* ${formatDate(member.membership_start)} to ${formatDate(member.membership_end)}
💰 *Amount Paid:* ₹${amount.toLocaleString("en-IN")}
✅ *Status:* PAID & ACTIVE

📍 *Gym:* Main Road, Lakhnadon, MP
📞 *Helpline:* +91 91311 79343

_“Pain is Temporary. Pride is Forever.”_ 💪`;
  };

  const handleSendWhatsApp = () => {
    if (!member.mobile) {
      toast.error("This member has no phone number on file");
      return;
    }
    const message = getWhatsAppMessage();
    openWhatsApp(member.mobile, message);
    toast.success(`Opening WhatsApp for ${member.full_name || "member"}!`);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getWhatsAppMessage());
      setCopied(true);
      toast.success("Receipt text copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy receipt text");
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptCardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(receiptCardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Brothers_Fitness_Receipt_${(member.full_name || "Member").replace(/\s+/g, "_")}_${receiptId}.png`;
      link.click();
      toast.success("Receipt image downloaded successfully!");
    } catch (err) {
      console.error("Receipt capture error:", err);
      toast.error("Failed to generate receipt image");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 h-[100dvh] w-full bg-black/80 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain scrollbar-hide backdrop-blur-sm modal-overlay-in"
        onClick={onClose}
      >
        <div
          {...modalProps}
          aria-label="Membership receipt"
          className="surface-modal border border-surface-border p-4 sm:p-6 max-w-md w-full my-auto rounded-3xl overflow-y-auto max-h-[88dvh] scrollbar-hide modal-panel-in relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-hi uppercase tracking-wider">
                Membership Receipt
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-low hover:text-hi hover:bg-surface-elevated transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Printable Receipt Card (Captured by html2canvas) */}
          <div
            ref={receiptCardRef}
            className="rounded-2xl border border-surface-border bg-gradient-to-b from-surface-card to-surface-modal p-4 sm:p-5 shadow-inner space-y-4"
          >
            {/* Gym Header */}
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                {/* Logo with Black Background */}
                <div className="w-9 h-9 rounded-xl bg-black border border-white/15 flex items-center justify-center shadow-md shrink-0 p-1">
                  <Image
                    src="/assets/favicon.png"
                    alt="Brother's Fitness"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-hi leading-tight tracking-tight">
                    BROTHER&apos;S FITNESS
                  </h3>
                  <p className="text-[10px] text-mid">Lakhnadon, MP</p>
                </div>
              </div>
              <div className="text-right">
                <LiveBeacon status="success" label="PAID" size="xs" />
                <p className="text-[9px] text-low mt-0.5">{formatTodayIST()}</p>
              </div>
            </div>

            {/* Member Details */}
            <div className="flex items-center gap-3 bg-surface-elevated/50 p-2.5 rounded-xl border border-surface-border/50">
              <div className="w-11 h-11 rounded-full bg-surface-canvas border border-surface-border flex items-center justify-center font-bold text-xs text-hi shrink-0 relative overflow-hidden">
                {member.photo_url ? (
                  <Image
                    src={member.photo_url}
                    alt={member.full_name || ""}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  initials(member.full_name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-hi truncate">{member.full_name}</p>
                <p className="text-[11px] text-mid truncate">📞 {member.mobile || "-"}</p>
                <p className="text-[10px] text-low font-mono">{receiptId}</p>
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div className="space-y-2 text-xs border-y border-surface-border py-3">
              <div className="flex justify-between items-center">
                <span className="text-mid">Plan Duration</span>
                <span className="font-semibold text-hi">{member.membership_type || "1 Month"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mid">Valid From</span>
                <span className="font-medium text-hi tabular-nums">
                  {formatDate(member.membership_start)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mid">Valid Till</span>
                <span className="font-medium text-hi tabular-nums">
                  {formatDate(member.membership_end)}
                </span>
              </div>
            </div>

            {/* Total Paid */}
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-mid">
                Total Amount Paid
              </span>
              <span className="text-lg font-black text-accent tabular-nums">
                ₹{amount.toLocaleString("en-IN")}
              </span>
            </div>

            <p className="text-[9px] text-center text-low pt-1">
              Thank you for training with Brother&apos;s Fitness. Keep crushing your goals!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Receipt to {member.full_name?.split(" ")[0] || "Member"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-surface-border bg-surface-elevated hover:bg-surface-canvas text-hi font-medium text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-accent" />
                )}
                <span>{isExporting ? "Saving..." : "Save Image"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-surface-border bg-surface-elevated hover:bg-surface-canvas text-hi font-medium text-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-mid" />
                )}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
