"use client";

import { useState, useMemo } from 'react';
import { X, Send, MessageCircle, Gift, AlertTriangle, Users, Copy, Check } from 'lucide-react';
import { useModalDismiss } from '@/components/hooks/useModalDismiss';
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
        message: "Happy Birthday from Brother's Fitness! 🎉\n\nWishing you a power-packed year ahead. Keep crushing those goals! 💪\n\n- Team BroFit"
    },
    newBatch: {
        icon: Users,
        label: "New Batch Alert 🏋️",
        message: "New training batch starting soon at Brother's Fitness!\n\nEarly morning & evening slots available.\n📍 Limited spots — register now!\n\n- Team BroFit"
    },
    expiry: {
        icon: AlertTriangle,
        label: "Expiry Reminder ⚠️",
        message: "Hi from Brother's Fitness!\n\nYour subscription is expiring soon. Renew now to keep training without interruption.\n\n💪 Stay strong, stay fit!\n\n- Team BroFit"
    }
};

export default function BulkMessageModal({ members, onClose }: BulkMessageModalProps) {
    const modalProps = useModalDismiss(onClose);
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
                today.setHours(0, 0, 0, 0);
                const next7Days = new Date(today);
                next7Days.setDate(today.getDate() + 7);

                // Check if birthday falls within next 7 days (handles year rollover)
                let thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

                // If birthday has passed this year, check next year
                if (thisYearBday < today) {
                    thisYearBday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
                }

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
        // M32: WhatsApp Web's "send to multiple" field requires numbers on
        // separate lines; comma-separated causes invalid format.
        navigator.clipboard.writeText(phoneNumbers.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openWhatsApp = (phone: string) => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-start sm:items-center justify-center overflow-y-auto modal-overlay-in" onClick={onClose}>
            <div
                {...modalProps}
                aria-label="Bulk WhatsApp message"
                className="surface-modal hairline p-4 sm:p-6 w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto sm:my-4 modal-panel-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="heading-section text-lg text-hi uppercase flex items-center gap-2">
                        <Send className="w-5 h-5 text-status-success" />
                        Bulk WhatsApp Message
                    </h2>
                    <button onClick={onClose} className="text-low hover:text-hi p-1 hover:bg-surface-elevated transition-colors duration-fast" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Template Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
                        <button
                            key={key}
                            onClick={() => setMessage(template.message)}
                            className="flex items-center gap-2 px-3 py-2 surface-card hairline hover:border-accent transition-colors duration-fast text-sm text-mid hover:text-hi"
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
                    className="input-field h-32 resize-none"
                    placeholder="Type your message..."
                />

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 my-4">
                    {(['all', 'active', 'expiring', 'expired', 'birthday'] as FilterType[]).map(f => {
                        // M31: compute each button's own count independently of the
                        // active filter; the old code showed `filteredMembers.length`
                        // for every button, which was always the current filter's count.
                        const count = f === 'all'
                            ? members.length
                            : members.filter(m => {
                                if (f === 'active') return !m.membership_end || new Date(m.membership_end).getTime() > Date.now();
                                if (f === 'expired') return m.membership_end && new Date(m.membership_end).getTime() < Date.now();
                                if (f === 'expiring') {
                                    if (!m.membership_end) return false;
                                    const diff = Math.ceil((new Date(m.membership_end).getTime() - Date.now()) / 86400000);
                                    return diff >= 0 && diff <= 7;
                                }
                                if (f === 'birthday') {
                                    if (!m.date_of_birth) return false;
                                    const dob = new Date(m.date_of_birth);
                                    const today = new Date(); today.setHours(0,0,0,0);
                                    let bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                                    if (bday < today) bday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
                                    const in7 = new Date(today); in7.setDate(today.getDate() + 7);
                                    return bday >= today && bday <= in7;
                                }
                                return true;
                            }).length;
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors duration-fast ${filter === f
                                    ? 'bg-accent text-white border border-accent'
                                    : 'surface-modal hairline text-low hover:border-accent hover:text-hi'
                                    }`}
                            >
                                {f} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Selected Members */}
                <div className="surface-card hairline p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-mono text-low">
                            {filteredMembers.length} members selected
                        </span>
                        <button
                            onClick={copyNumbers}
                            className="flex items-center gap-2 px-3 py-1.5 surface-modal hairline text-xs text-mid hover:border-accent hover:text-hi transition-colors duration-fast"
                        >
                            {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy Numbers'}
                        </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2">
                        {filteredMembers.slice(0, 20).map(m => (
                            <div key={m.id} className="flex items-center justify-between text-sm py-1 border-b border-surface-border last:border-0">
                                <span className="text-hi truncate flex-1">{m.full_name}</span>
                                <button
                                    onClick={() => openWhatsApp(m.mobile)}
                                    className="ml-2 text-status-success hover:text-hi transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {filteredMembers.length > 20 && (
                            <p className="text-xs text-faint text-center pt-2">
                                +{filteredMembers.length - 20} more members
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={copyNumbers}
                    className="btn-primary w-full"
                >
                    <Copy className="w-4 h-4" />
                    Copy All Numbers for WhatsApp Web
                </button>
                <p className="text-xs text-faint text-center mt-2">
                    Paste numbers in WhatsApp Web to send bulk messages
                </p>
            </div>
        </div>
    );
}
