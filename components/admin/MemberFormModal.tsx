"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    X, Save, Camera, User, Shield, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { PLAN_PRICES, MEMBERSHIP_PLAN_DETAILS } from '@/lib/config';
import { todayIST } from '@/lib/member-utils';
import type { GymMember } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

interface MemberFormModalProps {
    open: boolean;
    /** The member being edited, or null for a new registration. */
    member: GymMember | null;
    /** Renewal resets start-to-today and clears the end date so it recalcs. */
    renew?: boolean;
    onClose: () => void;
    /** Called after a successful save so the parent refreshes its list. */
    onSaved: () => void;
}

const blankForm = (): Partial<GymMember> => ({
    full_name: '',
    mobile: '',
    address: '',
    date_of_birth: '',
    gender: 'Male',
    height_cm: null,
    weight_kg: null,
    membership_type: 'Monthly',
    membership_start: todayIST(),
    membership_end: '',
    notes: '',
});

export default function MemberFormModal({ open, member, renew = false, onClose, onSaved }: MemberFormModalProps) {
    const [formData, setFormData] = useState(blankForm);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Seed the form whenever the modal opens. Renewal keeps the member's
    // identity but restarts the clock (start=today, empty end) so the auto-calc
    // recomputes a fresh membership period.
    useEffect(() => {
        if (!open) return;
        if (member) {
            setFormData({
                full_name: member.full_name || '',
                mobile: member.mobile || '',
                address: member.address || '',
                date_of_birth: member.date_of_birth || '',
                gender: member.gender || 'Male',
                height_cm: member.height_cm,
                weight_kg: member.weight_kg,
                membership_type: member.membership_type || 'Monthly',
                membership_start: renew ? todayIST() : (member.membership_start || todayIST()),
                membership_end: renew ? '' : (member.membership_end || ''),
                notes: member.notes || '',
            });
            setPhotoPreview(member.photo_url);
        } else {
            setFormData(blankForm());
            setPhotoPreview(null);
        }
        setPhotoFile(null);
    }, [open, member, renew]);

    // Auto-calculate end date when start date or type changes.
    // Skip when EDITING a member whose real end date is already set, so the
    // auto-calc doesn't silently overwrite it (renew/empty-end still recalcs).
    useEffect(() => {
        if (formData.membership_start && formData.membership_type && (!formData.membership_end || !member)) {
            const start = new Date(formData.membership_start);
            let daysToAdd = 30; // Default Monthly

            switch (formData.membership_type) {
                case '15 Days':
                    daysToAdd = 15;
                    break;
                case '1 Month':
                case 'Monthly': // Legacy support
                    daysToAdd = 30;
                    break;
                case '3 Months':
                case 'Quarterly': // Legacy support
                    daysToAdd = 90;
                    break;
                case '6 Months':
                case 'Half-Yearly': // Legacy support
                    daysToAdd = 180;
                    break;
            }

            start.setDate(start.getDate() + daysToAdd);
            setFormData(prev => ({
                ...prev,
                membership_end: start.toISOString().split('T')[0]
            }));
        }
    // Deliberately not depending on member/membership_end: listing them re-runs
    // this effect when their identity changes (e.g. after save) and would
    // overwrite a member's real, manually-set end date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.membership_start, formData.membership_type]);

    if (!open) return null;

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadPhoto = async (memberId: string): Promise<string | null> => {
        if (!photoFile) return null;

        try {
            const options = {
                maxSizeMB: 0.5, // Compress to ~500KB
                maxWidthOrHeight: 1200,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(photoFile, options);

            const form = new FormData();
            form.append('file', compressedFile);
            form.append('memberId', memberId);

            const token = sessionStorage.getItem('admin_token');
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            });
            const data = await res.json();
            return data.url || null;
        } catch (err) {
            console.error('Photo upload failed:', err);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let photoUrl = member?.photo_url || null;

            if (photoFile) {
                // Use member ID if editing, otherwise use timestamp to ensure uniqueness
                const uploadId = member?.id || Date.now().toString();
                photoUrl = await uploadPhoto(uploadId);
            }

            const memberData = {
                ...formData,
                photo_url: photoUrl
            };

            const token = sessionStorage.getItem('admin_token');
            const res = await fetch('/api/admin/members', {
                method: member ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(member ? { id: member.id, ...memberData } : memberData)
            });

            if (!res.ok) throw new Error('Failed to save member');

            onClose();
            toast.success(member ? 'Member Updated Successfully! ✅' : 'Member Registered! 🚀');
            onSaved();
        } catch {
            toast.error('Failed to save member. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col shadow-2xl"
            >
                <div className="bg-zinc-900/50 border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gym-red" />
                        {member ? 'Edit Member Details' : 'Register New Member'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                    <form id="memberForm" onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo Section */}
                        <div className="space-y-4">
                            {/* Photo Preview */}
                            <div className="flex justify-center">
                                <div className="relative w-32 h-32 bg-zinc-900 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                    {photoPreview ? (
                                        <Image
                                            src={photoPreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            sizes="128px"
                                        />
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <Camera className="w-10 h-10 mx-auto mb-1 opacity-50" />
                                            <span className="text-xs uppercase font-bold">Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Large Visible Upload Buttons */}
                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/40 hover:border-blue-500 text-white py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                                >
                                    <Camera className="w-8 h-8" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Open Camera</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/40 hover:border-purple-500 text-white py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                                >
                                    <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center">
                                        <div className="w-4 h-4 bg-white/50 rounded-sm" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider">Open Gallery</span>
                                </button>
                            </div>

                            {/* Hidden Inputs */}
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="hidden"
                            />
                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoCapture}
                                className="hidden"
                            />
                        </div>

                        {/* Form Fields */}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                                    <User className="w-3.5 h-3.5" /> Personal Info
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                            placeholder="e.g. Rahul Sharma"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.mobile || ''}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                            placeholder="10-digit mobile"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">Date of Birth *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date_of_birth || ''}
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                                    <TrendingUp className="w-3.5 h-3.5" /> Membership Details
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">Plan Type</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {MEMBERSHIP_PLAN_DETAILS.map(plan => (
                                                <button
                                                    key={plan.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, membership_type: plan.value })}
                                                    className={`border rounded-lg p-2 text-center transition-all ${formData.membership_type === plan.value
                                                        ? 'bg-gym-red border-gym-red text-white shadow-lg shadow-red-900/20'
                                                        : 'bg-black border-white/20 text-gray-400 hover:border-white/40'
                                                        }`}
                                                >
                                                    <div className="text-[10px] font-bold uppercase tracking-wider">{plan.label}</div>
                                                    <div className="text-sm font-black">₹{PLAN_PRICES[plan.value]}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between">
                                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Start Date</label>
                                            <span className="text-[10px] text-gray-500 pt-0.5">Ends: {formData.membership_end}</span>
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={formData.membership_start || ''}
                                            onChange={(e) => setFormData({ ...formData, membership_start: e.target.value })}
                                            className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Gender *</label>
                                    <select
                                        required
                                        value={formData.gender || 'Male'}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Height (cm) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.height_cm || ''}
                                        onChange={e => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || null })}
                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                        placeholder="e.g. 175"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Weight (kg) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.weight_kg || ''}
                                        onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || null })}
                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                        placeholder="e.g. 75"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Address / Notes (Optional)</label>
                                <textarea
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                    placeholder="Optional: Enter address or notes..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-white/10 bg-zinc-900/50 shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 border border-white/10 bg-white/5 py-3 rounded-lg text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="memberForm"
                        disabled={isSubmitting}
                        className="flex-[2] bg-gym-red py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {photoFile ? 'Uploading Photo...' : 'Registering...'}
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {member ? 'Update Member Profile' : 'Register Member'}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
