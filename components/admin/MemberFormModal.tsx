"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Save,
  Camera,
  User,
  Shield,
  TrendingUp,
  Image as ImageIcon,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { PLAN_PRICES, MEMBERSHIP_PLAN_DETAILS, PLAN_DURATION_DAYS } from "@/lib/config";
import { adminFetch } from "@/lib/admin-api";
import { todayIST, parseLocalDate } from "@/lib/member-utils";
import type { GymMember } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import MemberPhotoModal, { MemberPhotoImage } from "@/components/admin/MemberPhotoModal";
import { Portal } from "@/components/ui/primitives/Portal";

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
  full_name: "",
  mobile: "",
  address: "",
  date_of_birth: "",
  gender: "Male",
  height_cm: null,
  weight_kg: null,
  membership_type: "Monthly",
  membership_start: todayIST(),
  membership_end: "",
  notes: "",
});

export default function MemberFormModal({
  open,
  member,
  renew = false,
  onClose,
  onSaved,
}: MemberFormModalProps) {
  const [formData, setFormData] = useState(blankForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualEndDate, setIsManualEndDate] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<MemberPhotoImage | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (member) {
      setFormData({
        full_name: member.full_name || "",
        mobile: member.mobile || "",
        address: member.address || "",
        date_of_birth: member.date_of_birth || "",
        gender: member.gender || "Male",
        height_cm: member.height_cm,
        weight_kg: member.weight_kg,
        membership_type: member.membership_type || "Monthly",
        membership_start: renew ? todayIST() : member.membership_start || todayIST(),
        membership_end: renew ? "" : member.membership_end || "",
        notes: member.notes || "",
      });
      setPhotoPreview(member.photo_url);
    } else {
      setFormData(blankForm());
      setPhotoPreview(null);
    }
    setIsManualEndDate(member ? Boolean(member.membership_end) && !renew : false);
    setPhotoFile(null);
  }, [open, member, renew]);

  // Auto-calculate end date when start date or plan changes
  useEffect(() => {
    if (isManualEndDate) return;
    if (formData.membership_start && formData.membership_type && (!formData.membership_end || !member)) {
      const start = parseLocalDate(formData.membership_start);
      if (start) {
        const daysToAdd = PLAN_DURATION_DAYS[formData.membership_type as keyof typeof PLAN_DURATION_DAYS] || 30;

        start.setDate(start.getDate() + daysToAdd);
        const endStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(
          start.getDate()
        ).padStart(2, "0")}`;
        setFormData((prev) => ({
          ...prev,
          membership_end: endStr,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.membership_start, formData.membership_type, isManualEndDate, member]);

  const modalProps = useModalDismiss(onClose);

  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const uploadPhoto = useCallback(async (memberId: string): Promise<string> => {
    if (!photoFile) throw new Error("Photo upload failed");

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(photoFile, options);
    const form = new FormData();
    form.append("file", compressedFile);
    form.append("memberId", memberId);

    const res = await adminFetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (!res.ok || !data.url) {
      throw new Error(data.error || "Photo upload failed");
    }
    return data.url;
  }, [photoFile]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (member) {
        let photoUrl = member.photo_url || null;
        if (photoFile) {
          photoUrl = await uploadPhoto(member.id);
        }

        const res = await adminFetch("/api/admin/members", {
          method: "PUT",
          body: JSON.stringify({ id: member.id, ...formData, photo_url: photoUrl }),
        });
        if (!res.ok) throw new Error("Failed to save member");
      } else {
        const res = await adminFetch("/api/admin/members", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create member");

        const data = await res.json();
        const created = data.member;
        if (photoFile && created?.id) {
          const photoUrl = await uploadPhoto(created.id);
          await adminFetch("/api/admin/members", {
            method: "PUT",
            body: JSON.stringify({ id: created.id, ...formData, photo_url: photoUrl }),
          });
        }
      }

      onClose();
      toast.success(member ? "Member details updated" : "New member registered successfully");
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(message.includes("Photo") ? message : "Failed to save member details");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, member, onClose, onSaved, photoFile, uploadPhoto]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 h-[100dvh] w-full bg-black/80 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain scrollbar-hide backdrop-blur-sm modal-overlay-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      <form
        {...modalProps}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        aria-label={member ? "Edit member details" : "Register new member"}
        className="w-full max-w-2xl my-auto max-h-[88dvh] rounded-3xl border border-surface-border bg-surface-modal overflow-hidden flex flex-col shadow-2xl transition-colors modal-panel-in relative"
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-elevated/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-sm shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-hi leading-tight">
                {member ? "Edit Member Profile" : "Register New Member"}
              </h2>
              <p className="text-xs text-mid mt-0.5">
                {member ? "Update personal and membership info" : "Enter member credentials and select plan"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-mid hover:text-hi p-2 rounded-xl hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-6">
          
          {/* Photo Section */}
          <div className="rounded-2xl border border-surface-border bg-surface-card/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
            <div
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-surface-border bg-surface-soft flex items-center justify-center overflow-hidden shrink-0 shadow-inner ${
                photoPreview ? "cursor-zoom-in group/form-photo hover:ring-2 hover:ring-accent transition-all" : ""
              }`}
              onClick={() => {
                if (photoPreview) {
                  setViewingPhoto({
                    url: photoPreview,
                    name: formData.full_name || "Member Photo Preview",
                    subtitle: formData.membership_type || "Member",
                  });
                }
              }}
              title={photoPreview ? "Click to view full photo" : undefined}
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="Preview" fill className="object-cover group-hover/form-photo:scale-105 transition-transform duration-200" sizes="112px" />
              ) : (
                <div className="text-center text-low">
                  <Camera className="w-8 h-8 mx-auto mb-1 opacity-60" />
                  <span className="text-[11px] font-medium uppercase tracking-wider">Photo</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="text-xs font-semibold text-hi">Upload Member Photo</div>
              <p className="text-xs text-mid leading-relaxed">
                Capture live photo or upload from file gallery (auto-compressed to &lt;500KB).
              </p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-hi transition-colors shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-low" />
                  <span>Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-hi transition-colors shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-low" />
                  <span>Choose File</span>
                </button>
              </div>
            </div>

            {/* Hidden Photo Inputs */}
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

          {/* Personal Info Group */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-faint font-semibold flex items-center gap-2 pb-1 border-b border-surface-border">
              <User className="w-3.5 h-3.5 text-accent" />
              <span>Personal Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Mobile Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium tabular-nums"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.date_of_birth || ""}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Gender *</label>
                <select
                  required
                  value={formData.gender || "Male"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors font-medium cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Membership Plan Selection */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-faint font-semibold flex items-center gap-2 pb-1 border-b border-surface-border">
              <TrendingUp className="w-3.5 h-3.5 text-status-success" />
              <span>Membership Tier & Dates</span>
            </div>

            {/* Plan Tier Selection Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MEMBERSHIP_PLAN_DETAILS.map((plan) => {
                const isSelected = formData.membership_type === plan.value;
                return (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, membership_type: plan.value })}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "bg-accent border-accent text-white shadow-md font-semibold"
                        : "bg-surface-card border-surface-border text-mid hover:border-accent"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider font-semibold">{plan.label}</div>
                    <div className="text-base font-bold mt-0.5 tabular-nums">₹{PLAN_PRICES[plan.value]}</div>
                  </button>
                );
              })}
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Membership Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.membership_start || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, membership_start: e.target.value });
                    setIsManualEndDate(false);
                  }}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">
                  Membership Expiry Date (Auto-calculated)
                </label>
                <input
                  type="date"
                  required
                  value={formData.membership_end || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, membership_end: e.target.value });
                    setIsManualEndDate(true);
                  }}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors font-medium tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Physical Metrics & Address */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-faint font-semibold flex items-center gap-2 pb-1 border-b border-surface-border">
              <Activity className="w-3.5 h-3.5 text-status-info" />
              <span>Physical Attributes & Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height_cm || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, height_cm: parseFloat(e.target.value) || null })
                  }
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium tabular-nums"
                  placeholder="e.g. 175"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight_kg || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || null })
                  }
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium tabular-nums"
                  placeholder="e.g. 72"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-mid block mb-1.5">Address / City</label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-surface-soft border border-surface-border text-xs text-hi rounded-xl px-3.5 py-2.5 placeholder:text-low focus:outline-none focus:border-accent transition-colors font-medium"
                  placeholder="e.g. Lakhnadon"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-elevated/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-xs font-medium text-mid hover:text-hi transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving Profile…" : member ? "Update Member" : "Register Member"}</span>
          </button>
        </div>
      </form>
      <MemberPhotoModal
        image={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />
    </div>
  </Portal>
  );
}
