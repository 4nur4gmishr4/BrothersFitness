"use client";

import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_PRICES } from '@/lib/config';
import { formatDate, formatTodayIST } from '@/lib/member-utils';
import { useModalDismiss } from '@/components/hooks/useModalDismiss';
import type { GymMember } from '@/lib/supabase';

interface MemberReceiptModalProps {
    member: GymMember;
    onClose: () => void;
}

export default function MemberReceiptModal({ member, onClose }: MemberReceiptModalProps) {
    const amount = (PLAN_PRICES as Record<string, number>)[member.membership_type || '1 Month'] || 0;
    const modalProps = useModalDismiss(onClose);

    const sendViaWhatsApp = () => {
        // encodeURIComponent the whole message so member names/dates with
        // special characters can't break the wa.me URL.
        const message = encodeURIComponent(
            `🏋️ *BROTHER'S FITNESS RECEIPT*\n\n👤 Member: ${member.full_name}\n📱 Mobile: ${member.mobile}\n📋 Plan: ${member.membership_type}\n📅 Valid: ${formatDate(member.membership_start)} to ${formatDate(member.membership_end)}\n💰 Amount: ₹${amount}\n\n_Pain is Temporary. Pride is Forever._ 💪`
        );
        // M28: an <a>.click() is a user-gesture navigation, not a popup, so
        // popup blockers don't swallow it (window.open with noopener features
        // always returns null, and window.open can be blocked outright — both
        // would make a "sent!" toast a lie). The anchor is appended, clicked,
        // and removed; rel=noopener prevents the new tab from reaching back.
        const link = document.createElement('a');
        link.href = `https://wa.me/91${member.mobile.replace(/\D/g, '')}?text=${message}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

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
                    <h2 className="heading-display text-2xl text-accent">BROTHER&apos;S FITNESS</h2>
                    <p className="label-text text-low">Pain is Temporary. Pride is Forever.</p>
                </div>
                <div className="hairline-t hairline-b py-4 my-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-low">Member:</span>
                        <span className="font-bold text-hi">{member.full_name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-low">Mobile:</span>
                        <span className="text-hi">{member.mobile}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-low">Plan:</span>
                        <span className="font-bold text-hi">{member.membership_type}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-low">Valid From:</span>
                        <span className="text-hi">{formatDate(member.membership_start)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-low">Valid Until:</span>
                        <span className="text-hi">{formatDate(member.membership_end)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="heading-section text-lg text-hi">Amount Paid:</span>
                    <span className="heading-section text-2xl text-accent">
                        ₹{amount?.toLocaleString('en-IN') || '0'}
                    </span>
                </div>
                <div className="text-center text-xs text-faint mb-4">
                    Receipt Date: {formatTodayIST()}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={sendViaWhatsApp}
                        className="btn-primary flex-1"
                    >
                        <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                    </button>
                    <button
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
