"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Gift, MessageCircle, Bell } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';

interface DeploymentAlertsProps {
    members: GymMember[];
}

export default function DeploymentAlerts({ members }: DeploymentAlertsProps) {
    const alerts = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const today = new Date();
        const next7Days = new Date();
        next7Days.setDate(today.getDate() + 7);

        const expiring3Days: GymMember[] = [];
        const expiring7Days: GymMember[] = [];
        const birthdays: GymMember[] = [];

        members.forEach(m => {
            // Check expiry
            if (m.membership_end) {
                const end = new Date(m.membership_end);
                end.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 3) expiring3Days.push(m);
                else if (diffDays > 3 && diffDays <= 7) expiring7Days.push(m);
            }

            // Check birthday
            if (m.date_of_birth) {
                const dob = new Date(m.date_of_birth);
                const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                if (thisYearBday >= today && thisYearBday <= next7Days) {
                    birthdays.push(m);
                }
            }
        });

        return { expiring3Days, expiring7Days, birthdays };
    }, [members]);

    const sendWhatsAppAlert = (member: GymMember, type: 'expiry' | 'birthday') => {
        let message = '';
        if (type === 'expiry') {
            const end = new Date(member.membership_end!);
            const now = new Date();
            const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            message = `⚠️ DEPLOYMENT ALERT!\n\nSoldier ${member.full_name}, your Brother's Fitness subscription ends in ${days} days! Don't go AWOL - renew now to continue your mission!\n\n💪 Stay strong, stay fit!\n\n- Team BroFit`;
        } else {
            message = `🎂 Happy Birthday, ${member.full_name}! 🎉\n\nBrother's Fitness wishes you a power-packed year ahead! Keep crushing those goals! 💪\n\n- Team BroFit`;
        }
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/91${member.mobile.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
    };

    const totalAlerts = alerts.expiring3Days.length + alerts.expiring7Days.length + alerts.birthdays.length;

    if (totalAlerts === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-3"
        >
            {/* Critical Expiry (3 days) */}
            {alerts.expiring3Days.length > 0 && (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                        <span className="font-bold text-red-400 uppercase text-sm">
                            Critical: {alerts.expiring3Days.length} expiring in 3 days
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alerts.expiring3Days.map(m => (
                            <button
                                key={m.id}
                                onClick={() => sendWhatsAppAlert(m, 'expiry')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                            >
                                <span className="truncate max-w-[100px]">{m.full_name}</span>
                                <MessageCircle className="w-3 h-3 text-green-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Warning Expiry (7 days) */}
            {alerts.expiring7Days.length > 0 && (
                <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Bell className="w-5 h-5 text-yellow-500" />
                        <span className="font-bold text-yellow-400 uppercase text-sm">
                            Warning: {alerts.expiring7Days.length} expiring in 7 days
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alerts.expiring7Days.map(m => (
                            <button
                                key={m.id}
                                onClick={() => sendWhatsAppAlert(m, 'expiry')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors"
                            >
                                <span className="truncate max-w-[100px]">{m.full_name}</span>
                                <MessageCircle className="w-3 h-3 text-green-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Birthdays */}
            {alerts.birthdays.length > 0 && (
                <div className="p-4 rounded-xl border border-pink-500/30 bg-pink-500/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Gift className="w-5 h-5 text-pink-500" />
                        <span className="font-bold text-pink-400 uppercase text-sm">
                            🎂 {alerts.birthdays.length} birthdays this week!
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {alerts.birthdays.map(m => (
                            <button
                                key={m.id}
                                onClick={() => sendWhatsAppAlert(m, 'birthday')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 border border-pink-500/30 rounded-lg text-xs hover:bg-pink-500/30 transition-colors"
                            >
                                <span className="truncate max-w-[100px]">{m.full_name}</span>
                                <MessageCircle className="w-3 h-3 text-green-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
