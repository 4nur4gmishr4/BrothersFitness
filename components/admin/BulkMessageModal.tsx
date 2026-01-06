"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Send, MessageCircle, Gift, AlertTriangle, Users, Copy, Check } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';

interface BulkMessageModalProps {
    members: GymMember[];
    onClose: () => void;
}

type FilterType = 'all' | 'active' | 'expiring' | 'expired' | 'birthday';

const MESSAGE_TEMPLATES = {
    birthday: {
        icon: Gift,
        label: "Happy Birthday 🎂",
        message: "🎂 Happy Birthday, Soldier! 🎉\n\nBrother's Fitness wishes you a power-packed year ahead! Keep crushing those goals! 💪\n\n- Team BroFit"
    },
    newBatch: {
        icon: Users,
        label: "New Batch Alert 🏋️",
        message: "🏋️ ATTENTION SOLDIERS!\n\nNew training batch starting soon at Brother's Fitness! Early morning & evening slots available.\n\n📍 Limited spots - Register now!\n\n- Team BroFit"
    },
    expiry: {
        icon: AlertTriangle,
        label: "Expiry Reminder ⚠️",
        message: "⚠️ DEPLOYMENT ALERT!\n\nSoldier, your Brother's Fitness subscription is expiring soon! Don't go AWOL - renew now to continue your mission!\n\n💪 Stay strong, stay fit!\n\n- Team BroFit"
    }
};

export default function BulkMessageModal({ members, onClose }: BulkMessageModalProps) {
    const [filter, setFilter] = useState<FilterType>('all');
    const [message, setMessage] = useState(MESSAGE_TEMPLATES.newBatch.message);
    const [copied, setCopied] = useState(false);

    const filteredMembers = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return members.filter(m => {
            if (filter === 'all') return true;

            if (filter === 'birthday') {
                if (!m.date_of_birth) return false;
                const dob = new Date(m.date_of_birth);
                const today = new Date();
                const next7Days = new Date();
                next7Days.setDate(today.getDate() + 7);

                // Check if birthday falls within next 7 days
                const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                return thisYearBday >= today && thisYearBday <= next7Days;
            }

            if (!m.membership_end) return filter === 'active';

            const end = new Date(m.membership_end);
            end.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (filter === 'expired') return diffDays < 0;
            if (filter === 'expiring') return diffDays >= 0 && diffDays <= 7;
            if (filter === 'active') return diffDays > 7;
            return true;
        });
    }, [members, filter]);

    const phoneNumbers = filteredMembers.map(m => m.mobile).filter(Boolean);

    const copyNumbers = () => {
        navigator.clipboard.writeText(phoneNumbers.join(', '));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openWhatsApp = (phone: string) => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black uppercase flex items-center gap-2">
                        <Send className="w-5 h-5 text-green-500" />
                        Bulk WhatsApp Message
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Template Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
                        <button
                            key={key}
                            onClick={() => setMessage(template.message)}
                            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
                        >
                            <template.icon className="w-4 h-4" />
                            {template.label}
                        </button>
                    ))}
                </div>

                {/* Message Textarea */}
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gym-red"
                    placeholder="Type your message..."
                />

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 my-4">
                    {(['all', 'active', 'expiring', 'expired', 'birthday'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase transition-colors ${filter === f
                                    ? 'bg-gym-red text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {f} ({f === 'all' ? members.length : filteredMembers.length})
                        </button>
                    ))}
                </div>

                {/* Selected Members */}
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-mono text-gray-400">
                            {filteredMembers.length} members selected
                        </span>
                        <button
                            onClick={copyNumbers}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded text-xs hover:bg-white/20 transition-colors"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy Numbers'}
                        </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {filteredMembers.slice(0, 20).map(m => (
                            <div key={m.id} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                <span className="truncate flex-1">{m.full_name}</span>
                                <button
                                    onClick={() => openWhatsApp(m.mobile)}
                                    className="ml-2 text-green-500 hover:text-green-400"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {filteredMembers.length > 20 && (
                            <p className="text-xs text-gray-500 text-center pt-2">
                                +{filteredMembers.length - 20} more members
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={copyNumbers}
                    className="w-full py-3 bg-green-600 text-white font-bold uppercase rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Copy className="w-4 h-4" />
                    Copy All Numbers for WhatsApp Web
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                    Paste numbers in WhatsApp Web to send bulk messages
                </p>
            </motion.div>
        </div>
    );
}
