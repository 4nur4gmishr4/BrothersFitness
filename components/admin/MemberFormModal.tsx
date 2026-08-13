"use client";

import { useState, useEffect, useRef } from 'react';
import {
    X, Save, Camera, User, Shield, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useModalDismiss } from '@/components/hooks/useModalDismiss';
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

    // M33: call unconditionally (hooks order) before the early return.
    const modalProps = useModalDismiss(onClose);

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

    // M25: upload failures THROW instead of returning null. The old code
    // swallowed the error and saved the member without a photo while the button
    // still claimed "Uploading Photo..." then toasted success — silent data loss.
    const uploadPhoto = async (memberId: string): Promise<string> => {
        if (!photoFile) throw new Error('Photo upload failed');

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

        if (!res.ok || !data.url) {
            throw new Error(data.error || 'Photo upload failed');
        }
        return data.url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const token = sessionStorage.getItem('admin_token');

            if (member) {
                // Editing: we already have the ID, upload is safe before the PUT.
                let photoUrl = member.photo_url || null;
                if (photoFile) {
                    photoUrl = await uploadPhoto(member.id);
                }

                const res = await fetch('/api/admin/members', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ id: member.id, ...formData, photo_url: photoUrl })
                });
                if (!res.ok) throw new Error('Failed to save member');
            } else {
                // New member: M26 — create the record FIRST (no photo), then
                // upload with the real member ID, then patch photo_url. The old
                // order uploaded with a timestamp key before the member row
                // existed, orphaning the image in storage if the POST failed.
                const res = await fetch('/api/admin/members', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ...formData, photo_url: null })
                });
                if (!res.ok) throw new Error('Failed to save member');

                const { member: created } = await res.json();
                if (photoFile) {
                    const photoUrl = await uploadPhoto(created.id);
                    await fetch('/api/admin/members', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ id: created.id, photo_url: photoUrl })
                    });
                }
            }

            onClose();
            toast.success(member ? 'Member Updated Successfully! ✅' : 'Member Registered! 🚀');
            onSaved();
        } catch (err) {
            // M25: surface the real failure instead of a false success. Photo
            // errors name the photo; anything else is a member-save failure.
            const message = err instanceof Error ? err.message : '';
            toast.error(message.includes('Photo')
                ? message
                : 'Failed to save member. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto modal-overlay-in">
            <div
                {...modalProps}
                aria-label={member ? "Edit member details" : "Register new member"}
                className="surface-modal hairline w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col modal-panel-in"
            >
                <div className="surface-elevated hairline-b p-4 flex justify-between items-center shrink-0">
                    <h2 className="heading-section text-lg text-hi flex items-center gap-2">
                        <Shield className="w-5 h-5 text-accent" />
                        {member ? 'Edit Member Details' : 'Register New Member'}
                    </h2>
                    <button onClick={onClose} className="text-low hover:text-hi p-1 hover:bg-surface-elevated transition-colors duration-fast" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                    <form id="memberForm" onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo Section */}
                        <div className="space-y-4">
                            {/* Photo Preview */}
                            <div className="flex justify-center">
                                <div className="relative w-32 h-32 surface-canvas border-2 border-dashed border-surface-border flex items-center justify-center overflow-hidden shrink-0">
                                    {photoPreview ? (
                                        <Image
                                            src={photoPreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            sizes="128px"
                                        />
                                    ) : (
                                        <div className="text-center text-low">
                                            <Camera className="w-10 h-10 mx-auto mb-1 opacity-50" />
                                            <span className="label-text uppercase">Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Large Visible Upload Buttons */}
                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="surface-modal hairline hover:border-accent text-hi py-4 px-4 flex flex-col items-center justify-center gap-2 transition-colors duration-fast"
                                >
                                    <Camera className="w-8 h-8" />
                                    <span className="label-text uppercase">Open Camera</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="surface-modal hairline hover:border-accent text-hi py-4 px-4 flex flex-col items-center justify-center gap-2 transition-colors duration-fast"
                                >
                                    <div className="w-8 h-8 border hairline flex items-center justify-center">
                                        <div className="w-4 h-4 bg-text-mid/30" />
                                    </div>
                                    <span className="label-text uppercase">Open Gallery</span>
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
                                <h3 className="label-text text-low flex items-center gap-2 hairline-b pb-2">
                                    <User className="w-3.5 h-3.5" /> Personal Info
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-text text-mid block mb-1.5">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="input-field"
                                            placeholder="e.g. Rahul Sharma"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-text text-mid block mb-1.5">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.mobile || ''}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            className="input-field"
                                            placeholder="10-digit mobile"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-text text-mid block mb-1.5">Date of Birth *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date_of_birth || ''}
                                            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <h3 className="label-text text-low flex items-center gap-2 hairline-b pb-2">
                                    <TrendingUp className="w-3.5 h-3.5" /> Membership Details
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-text text-mid block mb-1.5">Plan Type</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {MEMBERSHIP_PLAN_DETAILS.map(plan => (
                                                <button
                                                    key={plan.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, membership_type: plan.value })}
                                                    className={`border p-2 text-center transition-colors duration-fast ${formData.membership_type === plan.value
                                                        ? 'bg-accent border-accent text-white'
                                                        : 'surface-modal hairline text-mid hover:border-accent'
                                                        }`}
                                                >
                                                    <div className="label-text text-[10px] uppercase">{plan.label}</div>
                                                    <div className="heading-section text-sm font-bold">₹{PLAN_PRICES[plan.value]}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between">
                                            <label className="label-text text-mid block mb-1.5">Start Date</label>
                                            <span className="text-[10px] text-faint pt-0.5">Ends: {formData.membership_end}</span>
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={formData.membership_start || ''}
                                            onChange={(e) => setFormData({ ...formData, membership_start: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="label-text text-mid block mb-1.5">Gender *</label>
                                    <select
                                        required
                                        value={formData.gender || 'Male'}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-text text-mid block mb-1.5">Height (cm) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.height_cm || ''}
                                        onChange={e => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || null })}
                                        className="input-field"
                                        placeholder="e.g. 175"
                                    />
                                </div>
                                <div>
                                    <label className="label-text text-mid block mb-1.5">Weight (kg) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.weight_kg || ''}
                                        onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || null })}
                                        className="input-field"
                                        placeholder="e.g. 75"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="label-text text-mid block mb-1.5">Address / Notes (Optional)</label>
                                <textarea
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="input-field"
                                    placeholder="Optional: Enter address or notes..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 hairline-t surface-elevated shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="memberForm"
                        disabled={isSubmitting}
                        className="btn-primary flex-[2]"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            </div>
        </div>
    );
}
