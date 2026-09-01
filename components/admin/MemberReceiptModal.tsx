"use client";

import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_PRICES } from '@/lib/config';
import { formatDate, formatTodayIST } from '@/lib/member-utils';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { openWhatsApp } from '@/lib/admin-api';
import type { GymMember } from '@/lib/supabase';

interface MemberReceiptModalProps {
    member: GymMember;
    onClose: () => void;
}

export default function MemberReceiptModal({ member, onClose }: MemberReceiptModalProps) {
    const amount = (PLAN_PRICES as Record<string, number>)[member.membership_type || '1 Month'] || 0;
    const modalProps = useModalDismiss(onClose);

    const sendViaWhatsApp = () => {
        const message =
            `🏋️ *BROTHER'S FITNESS RECEIPT*\n\n👤 Member: ${member.full_name}\n📱 Mobile: ${member.mobile}\n📋 Plan: ${member.membership_type}\n📅 Valid: ${formatDate(member.membership_start)} to ${formatDate(member.membership_end)}\n💰 Amount: ₹${amount}\n\n_Pain is Temporary. Pride is Forever._ 💪`;
        openWhatsApp(member.mobile, message);
        toast.success('Receipt sent via WhatsApp!');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 modal-overlay-in" onClick={onClose}>
            <div
                {...modalProps}
                aria-label="Membership receipt"
                className="surface-modal hairline p-6 max-w-md w-full modal-panel-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-4">
                    <h2 className="font-bold text-xl text-accent tracking-tight">BROTHER&apos;S FITNESS</h2>
                    <p className="text-xs text-mid mt-0.5">Pain is Temporary. Pride is Forever.</p>
                </div>
                <div className="hairline-t hairline-b py-4 my-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-mid">Member:</span>
                        <span className="font-semibold text-hi">{member.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-mid">Mobile:</span>
                        <span className="text-hi font-medium tabular-nums">{member.mobile}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-mid">Plan:</span>
                        <span className="font-semibold text-hi">{member.membership_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-mid">Valid From:</span>
                        <span className="text-hi font-medium tabular-nums">{formatDate(member.membership_start)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-mid">Valid Until:</span>
                        <span className="text-hi font-medium tabular-nums">{formatDate(member.membership_end)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-sm text-hi">Amount Paid:</span>
                    <span className="font-bold text-xl text-accent tabular-nums">
                        ₹{amount?.toLocaleString('en-IN') || '0'}
                    </span>
                </div>
                <div className="text-center text-xs text-faint mb-4 tabular-nums">
                    Receipt Date: {formatTodayIST()}
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={sendViaWhatsApp}
                        className="btn-primary flex-1"
                    >
                        <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary px-4"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
