"use client";

import { useMemo } from 'react';
import { AlertTriangle, MessageCircle, Calendar, Clock, User } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';
import Image from 'next/image';

interface ExpiringMembersTableProps {
    members: GymMember[];
}

export default function ExpiringMembersTable({ members }: ExpiringMembersTableProps) {
    const expiringMembers = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return members.filter(m => {
            if (!m.membership_end) return false;
            const end = new Date(m.membership_end);
            end.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Filter: Active but expiring in <= 7 days
            return diffDays >= 0 && diffDays < 7;
        }).map(m => {
            const end = new Date(m.membership_end!);
            end.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { ...m, daysRemaining: diffDays };
        }).sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [members]);

    const groupedMembers = useMemo(() => {
        const today = expiringMembers.filter(m => m.daysRemaining === 0);
        const upcoming = expiringMembers.filter(m => m.daysRemaining > 0);
        return { today, upcoming };
    }, [expiringMembers]);

    const sendWhatsAppReminder = (member: GymMember & { daysRemaining: number }) => {
        const msg = encodeURIComponent(
            `Hi ${member.full_name}! 👋\n\nYour Brother's Fitness membership expires in ${member.daysRemaining === 0 ? 'TODAY' : member.daysRemaining + ' days'}. Renew now to continue your fitness journey without interruption! 💪\n\nVisit us or reply to renew.\n\n- Brother's Fitness`
        );
        window.open(`https://wa.me/91${member.mobile.replace(/\D/g, '')}?text=${msg}`, '_blank');
    };

    if (expiringMembers.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="surface-card hairline border-status-warning/30 p-4 md:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <AlertTriangle className="w-32 h-32 text-status-warning" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 surface-modal hairline border-status-warning/30">
                            <AlertTriangle className="w-5 h-5 text-status-warning" />
                        </div>
                        <div>
                            <h3 className="heading-section text-base text-hi">Expiring Soon</h3>
                            <p className="label-text text-xs text-status-warning uppercase tracking-wider font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                                {expiringMembers.length} Memberships ending within 7 days
                            </p>
                        </div>
                    </div>
                </div>

                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto relative z-10 surface-canvas border border-surface-border">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="surface-elevated hairline-b text-xs text-faint uppercase tracking-wider">
                                <th className="py-4 px-6 label-text font-semibold">Member Details</th>
                                <th className="py-4 px-4 label-text font-semibold">Plan Info</th>
                                <th className="py-4 px-4 label-text font-semibold">Time Remaining</th>
                                <th className="py-4 px-6 text-right label-text font-semibold">Quick Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {/* Group: Today */}
                            {groupedMembers.today.length > 0 && (
                                <>
                                    <tr className="bg-status-danger/5">
                                        <td colSpan={4} className="py-2 px-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-status-danger uppercase tracking-widest">
                                                <Clock className="w-3 h-3" /> Expiring Today
                                            </div>
                                        </td>
                                    </tr>
                                    {groupedMembers.today.map(m => (
                                        <tr key={m.id} className="group hover:bg-surface-elevated/50 transition-colors duration-fast">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 overflow-hidden surface-modal border border-surface-border shrink-0 group-hover:border-accent transition-colors duration-fast">
                                                        {m.photo_url ? (
                                                            <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-faint"><User className="w-5 h-5" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-hi group-hover:text-accent transition-colors duration-fast">{m.full_name}</div>
                                                        <div className="text-xs text-faint">{m.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-hi font-medium surface-modal hairline px-2.5 py-1">
                                                    {m.membership_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 surface-elevated overflow-hidden border border-surface-border">
                                                        <div className="h-full bg-status-danger w-full" />
                                                    </div>
                                                    <span className="text-xs font-bold text-status-danger uppercase">Critical</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => sendWhatsAppReminder(m)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 surface-modal hairline text-status-success hover:border-status-success text-xs font-bold transition-colors duration-fast"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" /> Remind
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* Group: Upcoming */}
                            {groupedMembers.upcoming.length > 0 && (
                                <>
                                    <tr className="bg-status-warning/5">
                                        <td colSpan={4} className="py-2 px-6">
                                            <div className="flex items-center gap-2 text-xs font-bold text-status-warning uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" /> Upcoming (1-6 Days)
                                            </div>
                                        </td>
                                    </tr>
                                    {groupedMembers.upcoming.map(m => (
                                        <tr key={m.id} className="group hover:bg-surface-elevated/50 transition-colors duration-fast">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 overflow-hidden surface-modal border border-surface-border shrink-0 group-hover:border-surface-elevated transition-colors duration-fast">
                                                        {m.photo_url ? (
                                                            <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-faint"><User className="w-5 h-5" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-mid group-hover:text-hi transition-colors duration-fast">{m.full_name}</div>
                                                        <div className="text-xs text-faint">{m.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-low surface-modal hairline px-2.5 py-1">
                                                    {m.membership_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 surface-elevated overflow-hidden border border-surface-border">
                                                        <div
                                                            className="h-full bg-status-warning rounded-full"
                                                            style={{ width: `${(1 - m.daysRemaining / 7) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-status-warning">
                                                        {m.daysRemaining} Day{m.daysRemaining > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => sendWhatsAppReminder(m)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 surface-modal hairline text-mid hover:text-hi hover:border-accent text-xs font-medium transition-colors duration-fast"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" /> Remind
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden space-y-4 relative z-10">
                    {/* Today Group */}
                    {groupedMembers.today.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-status-danger uppercase tracking-widest pl-1">
                                <Clock className="w-3 h-3" /> Expiring Today
                            </div>
                            <div className="space-y-3">
                                {groupedMembers.today.map(m => (
                                    <div key={m.id} className="surface-elevated hairline border-status-danger/30 p-4 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 overflow-hidden surface-modal border border-surface-border shrink-0">
                                                    {m.photo_url ? (
                                                        <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-faint"><User className="w-6 h-6" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-hi text-lg leading-tight">{m.full_name}</div>
                                                    <div className="text-xs text-faint">{m.mobile}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold surface-modal hairline text-mid px-2 py-1">
                                                {m.membership_type}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-faint">
                                                <span>Status</span>
                                                <span className="text-status-danger font-bold uppercase">Critical</span>
                                            </div>
                                            <div className="w-full h-1.5 surface-elevated overflow-hidden border border-surface-border">
                                                <div className="h-full bg-status-danger w-full" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => sendWhatsAppReminder(m)}
                                            className="w-full flex items-center justify-center gap-2 py-3 surface-modal hairline text-status-success hover:border-status-success text-sm font-bold transition-colors duration-fast"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Send Reminder
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Group */}
                    {groupedMembers.upcoming.length > 0 && (
                        <div className={groupedMembers.today.length > 0 ? "pt-4" : ""}>
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-status-warning uppercase tracking-widest pl-1">
                                <Calendar className="w-3 h-3" /> Upcoming (1-6 Days)
                            </div>
                            <div className="space-y-3">
                                {groupedMembers.upcoming.map(m => (
                                    <div key={m.id} className="surface-elevated hairline p-4 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 overflow-hidden surface-modal border border-surface-border shrink-0">
                                                    {m.photo_url ? (
                                                        <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-faint"><User className="w-6 h-6" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-mid text-lg leading-tight">{m.full_name}</div>
                                                    <div className="text-xs text-faint">{m.mobile}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold surface-modal hairline text-low px-2 py-1">
                                                {m.membership_type}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-faint">
                                                <span>Time Remaining</span>
                                                <span className="text-status-warning font-bold">{m.daysRemaining} Days</span>
                                            </div>
                                            <div className="w-full h-1.5 surface-elevated overflow-hidden border border-surface-border">
                                                <div
                                                    className="h-full bg-status-warning rounded-full"
                                                    style={{ width: `${(1 - m.daysRemaining / 7) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => sendWhatsAppReminder(m)}
                                            className="w-full flex items-center justify-center gap-2 py-3 surface-modal hairline text-mid hover:text-hi hover:border-accent text-sm font-bold transition-colors duration-fast"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Remind
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
