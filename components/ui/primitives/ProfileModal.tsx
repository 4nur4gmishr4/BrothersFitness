"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, User, Calendar, Ruler, Scale, Users, Loader2, CheckCircle, LogOut } from "lucide-react";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import { useUserAuth, ProfileUpdateData } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import Image from "next/image";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, logout, updateProfile, remainingCredits, isLoggedIn } = useUserAuth();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [todayMax, setTodayMax] = useState("");

    // L18: track the success-toast timer so it can't fire after unmount.
    const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // L20: photoUrl is display-only (there is no photo editor in this modal).
    // Kept as state only so a broken image can fall back to the avatar icon;
    // it must NOT be written back to the profile, or a transient image load
    // error would silently clear the user's stored photo on the next save.
    const [photoUrl, setPhotoUrl] = useState("");
    const [fullName, setFullName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");

    useEffect(() => {
        setTodayMax(new Date().toISOString().split("T")[0]);
    }, []);

    useEffect(() => {
        if (isOpen && user) {
            setFullName(user.full_name || "");
            setPhotoUrl(user.photo_url || "");
            setDateOfBirth(user.date_of_birth || "");
            setHeightCm(user.height_cm?.toString() || "");
            setWeightKg(user.weight_kg?.toString() || "");
            setGender((user.gender as "Male" | "Female" | "Other") || "Male");
            setError("");
            setSuccess(false);
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // Clear the success-toast timer if the modal unmounts before it fires.
    useEffect(() => () => {
        if (successTimer.current) clearTimeout(successTimer.current);
    }, []);

    const handleSave = async () => {
        if (heightCm) {
            const h = parseInt(heightCm, 10);
            if (isNaN(h) || h < 50 || h > 300) {
                setError("Height must be between 50 and 300 cm.");
                return;
            }
        }
        if (weightKg) {
            const w = parseInt(weightKg, 10);
            if (isNaN(w) || w < 20 || w > 300) {
                setError("Weight must be between 20 and 300 kg.");
                return;
            }
        }
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const data: ProfileUpdateData = {
                full_name: fullName.trim() || undefined,
                // L20: photo_url deliberately omitted — no photo editor here,
                // so writing it back would persist a cleared/broken avatar.
                date_of_birth: dateOfBirth || undefined,
                height_cm: heightCm ? parseInt(heightCm, 10) : undefined,
                weight_kg: weightKg ? parseInt(weightKg, 10) : undefined,
                gender,
            };
            const result = await updateProfile(data);
            if (result.success) {
                setSuccess(true);
                if (successTimer.current) clearTimeout(successTimer.current);
                successTimer.current = setTimeout(() => setSuccess(false), 2500);
            } else {
                setError(result.error || "Failed to update profile. Please try again.");
            }
        } catch (err: unknown) {
            console.error("Profile Modal: Save exception:", err);
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    // M33: call unconditionally (hooks order) before the early return.
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsReady(true), 150);
            return () => clearTimeout(timer);
        } else {
            setIsReady(false);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        if (isReady) onClose();
    }, [isReady, onClose]);

    const modalProps = useModalDismiss(handleClose);

    if (!isOpen || !isLoggedIn) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 modal-overlay-in"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                {...modalProps}
                aria-label="Customize profile"
                className="relative w-full max-w-md surface-modal hairline overflow-hidden max-h-[90vh] overflow-y-auto modal-panel-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-accent p-4 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-white" />
                        <span className="font-black uppercase tracking-widest text-sm text-white">
                            Customize Profile
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-surface-canvas transition-colors p-1 rounded-full hover:bg-white/20"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Profile Header & Avatar */}
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden surface-elevated flex-shrink-0 border border-surface-border relative group">
                            {photoUrl ? (
                                <Image
                                    src={photoUrl}
                                    alt={fullName || "Profile"}
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                    onError={() => setPhotoUrl("")}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-8 h-8 text-faint" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="font-bold text-lg text-hi">{fullName || user?.email}</p>
                            <p className="text-faint text-xs">{user?.email}</p>
                        </div>
                    </div>

                    {/* Credits Display */}
                    <div className="surface-elevated hairline p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-low text-sm font-medium">Daily AI Credits</span>
                            <span className="text-2xl font-black text-accent">{remainingCredits}/{MAX_DAILY_CREDITS}</span>
                        </div>
                        <div className="w-full surface-canvas h-1.5 mt-2 overflow-hidden">
                            <div
                                className="h-full bg-accent"
                                style={{ width: `${(remainingCredits / MAX_DAILY_CREDITS) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="p-3 bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-status-success/10 border border-status-success/30 text-status-success text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Profile updated successfully!
                        </div>
                    )}

                    {/* Form */}
                    <div className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="label-text text-xs text-low ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="input-field pl-10"
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-1">
                            <label className="label-text text-xs text-low ml-1">Date of Birth</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="input-field pl-10"
                                    max={todayMax}
                                />
                            </div>
                        </div>

                        {/* Height & Weight */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="label-text text-xs text-low ml-1">Height</label>
                                <div className="relative">
                                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                    <input
                                        type="number"
                                        value={heightCm}
                                        onChange={(e) => setHeightCm(e.target.value)}
                                        placeholder="cm"
                                        min={50}
                                        max={300}
                                        step={1}
                                        className="input-field pl-10 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="label-text text-xs text-low ml-1">Weight</label>
                                <div className="relative">
                                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                    <input
                                        type="number"
                                        value={weightKg}
                                        onChange={(e) => setWeightKg(e.target.value)}
                                        placeholder="kg"
                                        min={20}
                                        max={300}
                                        step={0.1}
                                        className="input-field pl-10 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                            <label className="label-text text-xs text-low ml-1">Gender</label>
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-faint" />
                                <div className="flex gap-2 flex-1">
                                    {(["Male", "Female", "Other"] as const).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGender(g)}
                                            className={`flex-1 py-2 text-sm font-bold transition-colors duration-fast ${
                                                gender === g
                                                    ? "bg-accent text-white"
                                                    : "surface-elevated hairline text-low hover:border-accent hover:text-hi"
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={loading || success}
                        className={`w-full font-bold py-3 transition-colors duration-fast flex items-center justify-center gap-2 ${
                            success
                                ? "bg-status-success text-status-on cursor-default"
                                : "btn-primary hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : success ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Details Saved
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Save Profile
                            </>
                        )}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 text-status-danger hover:text-status-danger/80 font-bold py-2 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
