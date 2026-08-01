"use client";

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PLAN_PRICES } from '@/lib/config';
import { formatDate } from '@/lib/member-utils';
import type { GymMember } from '@/lib/supabase';

interface MemberReceiptModalProps {
    member: GymMember;
    onClose: () => void;
}

export default function MemberReceiptModal({ member, onClose }: MemberReceiptModalProps) {
    const amount = (PLAN_PRICES as Record<string, number>)[member.membership_type || '1 Month'] || 0;

    const sendViaWhatsApp = () => {
        // encodeURIComponent the whole message so member names/dates with
        // special characters can't break the wa.me URL.
        const message = encodeURIComponent(
            `🏋️ *BROTHER'S FITNESS RECEIPT*\n\n👤 Member: ${member.full_name}\n📱 Mobile: ${member.mobile}\n📋 Plan: ${member.membership_type}\n📅 Valid: ${formatDate(member.membership_start)} to ${formatDate(member.membership_end)}\n💰 Amount: ₹${amount}\n\n_Pain is Temporary. Pride is Forever._ 💪`
        );
        window.open(`https://wa.me/91${member.mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
        toast.success('Receipt sent via WhatsApp!');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-black rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-black text-gym-red">BROTHER&apos;S FITNESS</h2>
                    <p className="text-xs text-gray-500">Pain is Temporary. Pride is Forever.</p>
                </div>
                <div className="border-t border-b border-gray-200 py-4 my-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Member:</span>
                        <span className="font-bold">{member.full_name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Mobile:</span>
                        <span>{member.mobile}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Plan:</span>
                        <span className="font-bold">{member.membership_type}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Valid From:</span>
                        <span>{formatDate(member.membership_start)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Valid Until:</span>
                        <span>{formatDate(member.membership_end)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Amount Paid:</span>
                    <span className="text-2xl font-black text-gym-red">
                        ₹{amount?.toLocaleString('en-IN') || '0'}
                    </span>
                </div>
                <div className="text-center text-xs text-gray-400 mb-4">
                    Receipt Date: {formatDate(new Date().toISOString())}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={sendViaWhatsApp}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
