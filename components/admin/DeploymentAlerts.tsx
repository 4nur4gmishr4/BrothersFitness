"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gift, MessageCircle } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';

interface DeploymentAlertsProps {
    members: GymMember[];
}

export default function DeploymentAlerts({ members }: DeploymentAlertsProps) {
    const birthdays = useMemo(() => {
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        return members.filter(m => {
            if (!m.date_of_birth) return false;
            const dob = new Date(m.date_of_birth);
            return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
        });
    }, [members]);

    const sendWhatsAppBirthday = (member: GymMember) => {
        const message = `🎂 Happy Birthday, ${member.full_name}! 🎉\n\nBrother's Fitness wishes you a power-packed year ahead! Keep crushing those goals! 💪\n\n- Team BroFit`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/91${member.mobile.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
    };

    if (birthdays.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            <div className="p-4 rounded-xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Gift className="w-12 h-12 text-pink-500" />
                </div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                        <Gift className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-pink-200">Birthday Alert</h3>
                        <p className="text-xs text-pink-400/80 uppercase tracking-wider font-semibold">
                            {birthdays.length} Member{birthdays.length !== 1 ? 's' : ''} celebrating today
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 relative z-10">
                    {birthdays.map(m => (
                        <button
                            key={m.id}
                            onClick={() => sendWhatsAppBirthday(m)}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 border border-pink-500/30 rounded-lg text-xs text-pink-200 hover:bg-pink-500/30 hover:border-pink-500/50 transition-all"
                        >
                            <span className="font-medium">{m.full_name}</span>
                            <MessageCircle className="w-3 h-3 text-pink-400 group-hover:text-pink-200 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
