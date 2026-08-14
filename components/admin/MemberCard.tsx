"use client";

import {
    MessageCircle, Edit2, Trash2, FileText, Phone,
} from 'lucide-react';
import Image from 'next/image';
import { formatDate, getMemberStatus } from '@/lib/member-utils';
import type { GymMember } from '@/lib/supabase';
import Placeholder from '@/components/ui/Placeholder';

interface MemberCardProps {
    member: GymMember;
    onWhatsApp: (mobile: string, name: string) => void;
    onRenew: (member: GymMember) => void;
    onEdit: (member: GymMember) => void;
    onDelete: (id: string) => void;
    onViewPhoto: (url: string) => void;
    onReceipt: (member: GymMember) => void;
}

export default function MemberCard({
    member, onWhatsApp, onRenew, onEdit, onDelete, onViewPhoto, onReceipt,
}: MemberCardProps) {
    const status = getMemberStatus(member.membership_end);
    const statusColors = {
        active: "text-status-success bg-status-success/10 border-status-success/30",
        expiring: "text-status-warning bg-status-warning/10 border-status-warning/30",
        expired: "text-status-danger bg-status-danger/10 border-status-danger/30"
    };

    return (
        <div className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast group">
            <div className="flex items-start gap-4 mb-4">
                <div
                    role="button"
                    // L26: remove from tab order when there's no photo to view —
                    // aria-disabled alone doesn't stop keyboard focus.
                    tabIndex={member.photo_url ? 0 : -1}
                    aria-label={member.photo_url ? `View ${member.full_name}'s photo` : `${member.full_name}'s avatar`}
                    aria-disabled={!member.photo_url}
                    onClick={() => member.photo_url && onViewPhoto(member.photo_url)}
                    onKeyDown={(e) => {
                        if (member.photo_url && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onViewPhoto(member.photo_url);
                        }
                    }}
                    className="relative w-14 h-14 surface-modal hairline flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-accent transition-colors duration-fast"
                >
                    {member.photo_url ? (
                        <Image src={member.photo_url} alt={member.full_name} fill className="object-cover" sizes="56px" />
                    ) : (
                        <Placeholder label="MEMBER" className="w-full h-full" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="heading-section text-base text-hi truncate pr-2">{member.full_name}</h3>
                        <span className={`label-text text-xs font-bold px-2 py-0.5 border ${statusColors[status]}`}>
                            {status.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-low text-xs flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {member.mobile}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="badge text-xs">
                            {member.membership_type}
                        </span>
                    </div>
                </div>
            </div>

            <div className="surface-canvas hairline rounded p-2 mb-4 space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-faint">Started:</span>
                    <span className="text-low font-mono">{formatDate(member.membership_start)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-faint">Ends:</span>
                    <span className={`font-mono font-bold ${status === 'expired' ? 'text-status-danger' : 'text-hi'}`}>
                        {formatDate(member.membership_end)}
                    </span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => member.mobile && onWhatsApp(member.mobile, member.full_name || '')}
                    className="w-10 surface-modal hairline text-status-success hover:border-status-success transition-colors duration-fast flex items-center justify-center"
                    title="WhatsApp Reminder"
                >
                    <MessageCircle className="w-4 h-4" />
                </button>
                {status === 'expired' && (
                    <button
                        onClick={() => onRenew(member)}
                        className="bg-accent text-white px-3 py-2 font-bold text-xs hover:bg-accent/90 transition-colors duration-fast flex items-center gap-1.5"
                        title="Renew Subscription"
                    >
                        Renew
                    </button>
                )}
                <button
                    onClick={() => onEdit(member)}
                    className="flex-1 surface-modal hairline text-mid py-2 text-xs font-bold hover:border-accent hover:text-accent transition-colors duration-fast flex items-center justify-center gap-1.5"
                >
                    <Edit2 className="w-3.5 h-3.5" /> Manage
                </button>
                <button
                    onClick={() => onDelete(member.id)}
                    // L25: icon-only button needs an accessible name.
                    aria-label="Delete member"
                    className="w-10 surface-modal hairline text-low hover:text-status-danger hover:border-status-danger transition-colors duration-fast flex items-center justify-center"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onReceipt(member)}
                    className="w-10 surface-modal hairline text-low hover:text-accent hover:border-accent transition-colors duration-fast flex items-center justify-center"
                    title="Generate Receipt"
                >
                    <FileText className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
