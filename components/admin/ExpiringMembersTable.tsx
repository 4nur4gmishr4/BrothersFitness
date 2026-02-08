"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="glass-panel p-4 md:p-6 rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AlertTriangle className="w-32 h-32 text-yellow-500" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg ring-1 ring-yellow-500/40">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-yellow-100 text-lg">Expiring Soon</h3>
                            <p className="text-xs text-yellow-400/80 uppercase tracking-wider font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                {expiringMembers.length} Memberships ending within 7 days
                            </p>
                        </div>
                    </div>
                </div>

                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto relative z-10 rounded-xl overflow-hidden bg-white/5 border border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="py-4 px-6 font-semibold">Member Details</th>
                                <th className="py-4 px-4 font-semibold">Plan Info</th>
                                <th className="py-4 px-4 font-semibold">Time Remaining</th>
                                <th className="py-4 px-6 text-right font-semibold">Quick Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {/* Group: Today */}
                            {groupedMembers.today.length > 0 && (
                                <>
                                    <tr className="bg-red-500/10">
                                        <td colSpan={4} className="py-2 px-6 text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Expiring Today
                                        </td>
                                    </tr>
                                    {groupedMembers.today.map(m => (
                                        <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700 border border-white/10 ring-2 ring-transparent group-hover:ring-gym-red/50 transition-all">
                                                        {m.photo_url ? (
                                                            <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-5 h-5" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-gym-red transition-colors">{m.full_name}</div>
                                                        <div className="text-xs text-gray-500">{m.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-gray-300 font-medium bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                                    {m.membership_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-red-500 w-full animate-pulse" />
                                                    </div>
                                                    <span className="text-xs font-bold text-red-400 uppercase">Critical</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => sendWhatsAppReminder(m)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 transform hover:-translate-y-0.5"
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
                                    <tr className="bg-yellow-500/5">
                                        <td colSpan={4} className="py-2 px-6 text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Upcoming (1-6 Days)
                                        </td>
                                    </tr>
                                    {groupedMembers.upcoming.map(m => (
                                        <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700 border border-white/10 group-hover:border-white/30 transition-colors">
                                                        {m.photo_url ? (
                                                            <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-5 h-5" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{m.full_name}</div>
                                                        <div className="text-xs text-gray-500">{m.mobile}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                                    {m.membership_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-yellow-500 rounded-full"
                                                            style={{ width: `${(1 - m.daysRemaining / 7) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-yellow-500">
                                                        {m.daysRemaining} Day{m.daysRemaining > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => sendWhatsAppReminder(m)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
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
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-red-400 uppercase tracking-widest pl-1">
                                <Clock className="w-3 h-3" /> Expiring Today
                            </div>
                            <div className="space-y-3">
                                {groupedMembers.today.map(m => (
                                    <div key={m.id} className="bg-white/5 border border-red-500/30 rounded-xl p-4 flex flex-col gap-4 shadow-lg shadow-black/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700 border border-white/10">
                                                    {m.photo_url ? (
                                                        <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-6 h-6" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg leading-tight">{m.full_name}</div>
                                                    <div className="text-xs text-gray-400">{m.mobile}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold bg-white/10 text-gray-300 px-2 py-1 rounded border border-white/5">
                                                {m.membership_type}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>Status</span>
                                                <span className="text-red-400 font-bold uppercase">Critical</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 w-full animate-pulse" />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => sendWhatsAppReminder(m)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-[0.98]"
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
                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-yellow-400 uppercase tracking-widest pl-1">
                                <Calendar className="w-3 h-3" /> Upcoming (1-6 Days)
                            </div>
                            <div className="space-y-3">
                                {groupedMembers.upcoming.map(m => (
                                    <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 shadow-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700 border border-white/10">
                                                    {m.photo_url ? (
                                                        <Image src={m.photo_url} alt={m.full_name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-6 h-6" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-200 text-lg leading-tight">{m.full_name}</div>
                                                    <div className="text-xs text-gray-500">{m.mobile}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/5">
                                                {m.membership_type}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>Time Remaining</span>
                                                <span className="text-yellow-500 font-bold">{m.daysRemaining} Days</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500 rounded-full"
                                                    style={{ width: `${(1 - m.daysRemaining / 7) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => sendWhatsAppReminder(m)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-bold rounded-xl transition-all border border-white/10 active:scale-[0.98]"
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
        </motion.div>
    );
}
