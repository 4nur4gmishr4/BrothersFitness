"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, User, MessageCircle, Edit2 } from 'lucide-react';
import Image from 'next/image';
import type { GymMember } from '@/lib/supabase';

interface IncompleteProfilesProps {
    members: GymMember[];
    onEdit: (member: GymMember) => void;
}

interface IncompleteMember extends GymMember {
    missingFields: string[];
}

export default function IncompleteProfiles({ members, onEdit }: IncompleteProfilesProps) {
    const incompleteMembers = useMemo(() => {
        const incomplete: IncompleteMember[] = [];

        members.forEach(m => {
            const missing: string[] = [];
            if (!m.photo_url) missing.push('Photo');
            if (!m.date_of_birth) missing.push('DOB');
            if (!m.gender) missing.push('Gender');
            if (!m.height_cm || !m.weight_kg) missing.push('Height/Weight');
            if (!m.address) missing.push('Address');
            if (!m.email) missing.push('Email');

            if (missing.length > 0 && m.membership_end) {
                // Only active/expiring members, or generic check? Let's check all for now.
                // Or maybe filter for active/expiring/expired-recently?
                // Use a simpler check: if status is not fully archived (implied by existence in main list)
                incomplete.push({ ...m, missingFields: missing });
            }
        });

        // Sort by number of missing fields (descending)
        return incomplete.sort((a, b) => b.missingFields.length - a.missingFields.length);
    }, [members]);

    const sendWhatsAppRequest = (member: IncompleteMember) => {
        const fields = member.missingFields.join(', ');
        const message = encodeURIComponent(
            `Hi ${member.full_name}! 👋\n\nWe noticed some details are missing from your profile at Brother's Fitness: ${fields}.\n\nPlease visit the gym to update them or reply with the details. Keeping your profile complete helps us track your progress better! 💪\n\n- Team BroFit`
        );
        window.open(`https://wa.me/91${member.mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    if (incompleteMembers.length === 0) return (
        <div className="p-8 text-center text-gray-500 bg-white/5 rounded-xl border border-white/10">
            <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-4">
                <User className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">All Profiles Complete!</h3>
            <p className="text-sm">Great job! All members have their profile information sorted.</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                            Incomplete Profiles
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            {incompleteMembers.length} members with missing information
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider bg-white/5">
                                <th className="py-4 px-6 font-semibold">Member</th>
                                <th className="py-4 px-6 font-semibold">Missing Information</th>
                                <th className="py-4 px-6 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {incompleteMembers.map(m => (
                                <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-white/10 shrink-0">
                                                {m.photo_url ? (
                                                    <Image
                                                        src={m.photo_url}
                                                        alt={m.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-900">
                                                        <span className="text-xs font-bold">{m.full_name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{m.full_name}</div>
                                                <div className="text-xs text-gray-500">{m.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-wrap gap-2">
                                            {m.missingFields.map((field, i) => (
                                                <span
                                                    key={i}
                                                    className={`text-xs px-2 py-1 rounded font-medium border
                                                    ${field === 'Photo' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            field === 'Height/Weight' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
                                                >
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(m)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Edit Profile"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => sendWhatsAppRequest(m)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-600/20 hover:border-green-600/40"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" /> Request Info
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
