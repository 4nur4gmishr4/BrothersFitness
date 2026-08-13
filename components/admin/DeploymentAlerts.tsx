"use client";

import { useMemo } from 'react';
import { Gift, MessageCircle } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';
import { openWhatsApp } from '@/lib/admin-api';

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
        const message = `🎂 Happy Birthday, ${member.full_name}! 🎉\n\nBrother's Fitness wishes you a power-packed year ahead! Keep crushing those goals! 💪\n\n- Team Brothers Fitness`;
        openWhatsApp(member.mobile, message);
    };

    if (birthdays.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="surface-card hairline border-accent p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Gift className="w-12 h-12 text-accent" />
                </div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 surface-modal hairline">
                        <Gift className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h3 className="heading-section text-base text-hi">Birthday Alert</h3>
                        <p className="label-text text-xs text-low uppercase tracking-widest font-semibold">
                            {birthdays.length} Member{birthdays.length !== 1 ? 's' : ''} celebrating today
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 relative z-10">
                    {birthdays.map(m => (
                        <button
                            key={m.id}
                            onClick={() => sendWhatsAppBirthday(m)}
                            className="group flex items-center gap-2 px-3 py-1.5 surface-modal hairline text-xs text-mid hover:border-accent hover:text-hi transition-colors duration-fast"
                        >
                            <span className="font-medium">{m.full_name}</span>
                            <MessageCircle className="w-3 h-3 text-status-success group-hover:text-hi transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
