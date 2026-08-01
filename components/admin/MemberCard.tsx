"use client";

import { motion } from 'framer-motion';
import {
    MessageCircle, Edit2, Trash2, FileText, User, Phone,
} from 'lucide-react';
import Image from 'next/image';
import { formatDate, getMemberStatus } from '@/lib/member-utils';
import type { GymMember } from '@/lib/supabase';

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
        active: "text-green-400 bg-green-400/10 border-green-400/20",
        expiring: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        expired: "text-red-400 bg-red-400/10 border-red-400/20"
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            layout
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-gym-red/40 transition-all group"
        >
            <div className="flex items-start gap-4 mb-4">
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={member.photo_url ? `View ${member.full_name}'s photo` : `${member.full_name}'s avatar`}
                    aria-disabled={!member.photo_url}
                    onClick={() => member.photo_url && onViewPhoto(member.photo_url)}
                    onKeyDown={(e) => {
                        if (member.photo_url && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onViewPhoto(member.photo_url);
                        }
                    }}
                    className="relative w-14 h-14 bg-white/5 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer hover:ring-2 hover:ring-gym-red transition-all"
                >
                    {member.photo_url ? (
                        <Image src={member.photo_url} alt={member.full_name} fill className="object-cover" sizes="56px" />
                    ) : (
                        <User className="w-7 h-7 text-gray-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-base truncate pr-2">{member.full_name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[status]}`}>
                            {status.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {member.mobile}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-300 border border-white/5">
                            {member.membership_type}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-black/30 rounded p-2 mb-4 space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Started:</span>
                    <span className="text-gray-300 font-mono">{formatDate(member.membership_start)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Ends:</span>
                    <span className={`font-mono font-bold ${status === 'expired' ? 'text-red-400' : 'text-white'}`}>
                        {formatDate(member.membership_end)}
                    </span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => member.mobile && onWhatsApp(member.mobile, member.full_name || '')}
                    className="w-10 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors flex items-center justify-center"
                    title="WhatsApp Reminder"
                >
                    <MessageCircle className="w-4 h-4" />
                </button>
                {status === 'expired' && (
                    <button
                        onClick={() => onRenew(member)}
                        className="bg-gym-red text-white px-3 py-2 rounded font-bold text-xs hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-red-900/20"
                        title="Renew Subscription"
                    >
                        Renew
                    </button>
                )}
                <button
                    onClick={() => onEdit(member)}
                    className="flex-1 bg-white/5 text-gray-300 py-2 rounded text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Edit2 className="w-3.5 h-3.5" /> Manage
                </button>
                <button
                    onClick={() => onDelete(member.id)}
                    className="w-10 bg-white/5 text-gray-400 rounded hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onReceipt(member)}
                    className="w-10 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors flex items-center justify-center"
                    title="Generate Receipt"
                >
                    <FileText className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
