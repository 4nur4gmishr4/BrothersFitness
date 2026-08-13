"use client";

import { useMemo } from 'react';
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

    const getFieldBadgeClass = (field: string) => {
        switch (field) {
            case 'Photo': return 'text-status-danger bg-status-danger/10 border border-status-danger/30';
            case 'Height/Weight': return 'text-status-warning bg-status-warning/10 border border-status-warning/30';
            default: return 'surface-modal hairline text-low';
        }
    };

    if (incompleteMembers.length === 0) return (
        <div className="surface-card hairline p-8 text-center text-low">
            <div className="inline-flex p-4 surface-modal hairline mb-4">
                <User className="w-8 h-8 text-status-success" />
            </div>
            <h3 className="heading-section text-xl text-hi mb-2">All Profiles Complete!</h3>
            <p className="text-sm text-low">Great job! All members have their profile information sorted.</p>
        </div>
    );

    return (
        <div className="mb-8">
            <div className="surface-card hairline overflow-hidden">
                <div className="surface-elevated hairline-b p-6 flex justify-between items-center">
                    <div>
                        <h3 className="heading-section text-lg text-hi flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-accent" />
                            Incomplete Profiles
                        </h3>
                        <p className="text-sm text-low mt-1">
                            {incompleteMembers.length} members with missing information
                        </p>
                    </div>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden p-4 space-y-4">
                    {incompleteMembers.map(m => (
                        <div key={m.id} className="surface-elevated hairline p-4 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-12 h-12 overflow-hidden surface-canvas border border-surface-border shrink-0">
                                        {m.photo_url ? (
                                            <Image
                                                src={m.photo_url}
                                                alt={m.full_name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-faint surface-canvas">
                                                <span className="text-xs font-bold">{m.full_name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-hi leading-tight">{m.full_name}</div>
                                        <div className="text-xs text-faint">{m.mobile}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onEdit(m)}
                                    className="p-2 text-low hover:text-accent hover:bg-surface-elevated transition-colors duration-fast shrink-0"
                                    title="Edit Profile"
                                    aria-label={`Edit ${m.full_name}'s profile`}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {m.missingFields.map((field, i) => (
                                    <span
                                        key={i}
                                        className={`text-xs px-2 py-1 font-medium ${getFieldBadgeClass(field)}`}
                                    >
                                        {field}
                                    </span>
                                ))}
                            </div>

                            <button
                                onClick={() => sendWhatsAppRequest(m)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 surface-modal hairline text-status-success hover:border-status-success text-xs font-bold transition-colors duration-fast"
                            >
                                <MessageCircle className="w-4 h-4" /> Request Info
                            </button>
                        </div>
                    ))}
                </div>

                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="hairline-b text-xs text-faint uppercase tracking-wider surface-elevated">
                                <th className="py-4 px-6 label-text font-semibold">Member</th>
                                <th className="py-4 px-6 label-text font-semibold">Missing Information</th>
                                <th className="py-4 px-6 text-right label-text font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {incompleteMembers.map(m => (
                                <tr key={m.id} className="group hover:bg-surface-elevated/50 transition-colors duration-fast">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 overflow-hidden surface-canvas border border-surface-border shrink-0">
                                                {m.photo_url ? (
                                                    <Image
                                                        src={m.photo_url}
                                                        alt={m.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-faint surface-canvas">
                                                        <span className="text-xs font-bold">{m.full_name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-hi group-hover:text-accent transition-colors duration-fast">{m.full_name}</div>
                                                <div className="text-xs text-faint">{m.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-wrap gap-2">
                                            {m.missingFields.map((field, i) => (
                                                <span
                                                    key={i}
                                                    className={`text-xs px-2 py-1 font-medium ${getFieldBadgeClass(field)}`}
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
                                                className="p-2 text-low hover:text-accent hover:bg-surface-elevated transition-colors duration-fast"
                                                title="Edit Profile"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => sendWhatsAppRequest(m)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 surface-modal hairline text-status-success hover:border-status-success text-xs font-bold transition-colors duration-fast"
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
        </div>
    );
}
