"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    X,
    User,
    Calendar,
    Ruler,
    Scale,
    Loader2,
    CheckCircle,
    LogOut,
    Phone,
    Target,
    Utensils,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import { useUserAuth, ProfileUpdateData } from "@/lib/user-auth-context";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import Image from "next/image";
import { Portal } from "@/components/ui/Portal";
import { toast } from "sonner";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FITNESS_GOALS = [
    { id: "Muscle Gain", label: "Muscle Gain", desc: "Build lean mass & size" },
    { id: "Fat Loss", label: "Fat Loss", desc: "Shred calories & tone up" },
    { id: "Strength & Endurance", label: "Strength", desc: "Heavy lifting & stamina" },
    { id: "General Fitness", label: "Fitness", desc: "Daily health & agility" },
];

const DIET_PREFERENCES = [
    { id: "Vegetarian", label: "Pure Veg" },
    { id: "Non-Vegetarian", label: "Non-Veg" },
    { id: "Eggetarian", label: "Eggetarian" },
    { id: "Vegan", label: "Vegan" },
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, logout, updateProfile, remainingCredits, isLoggedIn } = useUserAuth();

    const [loading, setLoading] = useState(false);
    const [todayMax, setTodayMax] = useState("");

    // Form states
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
    const [fitnessGoal, setFitnessGoal] = useState("Muscle Gain");
    const [dietPreference, setDietPreference] = useState("Vegetarian");

    useEffect(() => {
        setTodayMax(new Date().toISOString().split("T")[0]);
    }, []);

    useEffect(() => {
        if (isOpen && user) {
            setFullName(user.full_name || "");
            setPhone(user.phone || "");
            setDateOfBirth(user.date_of_birth || "");
            setHeightCm(user.height_cm?.toString() || "");
            setWeightKg(user.weight_kg?.toString() || "");
            setGender((user.gender as "Male" | "Female" | "Other") || "Male");
            setFitnessGoal(user.fitness_goal || "Muscle Gain");
            setDietPreference(user.diet_preference || "Vegetarian");
        }
    }, [isOpen, user]);

    // Computed BMI
    const bmi = useMemo(() => {
        const h = parseFloat(heightCm) / 100;
        const w = parseFloat(weightKg);
        if (h > 0 && w > 0) {
            const val = w / (h * h);
            return val.toFixed(1);
        }
        return null;
    }, [heightCm, weightKg]);

    const handleSave = async () => {
        if (heightCm) {
            const h = parseInt(heightCm, 10);
            if (isNaN(h) || h < 50 || h > 300) {
                toast.error("Height must be between 50 and 300 cm");
                return;
            }
        }
        if (weightKg) {
            const w = parseFloat(weightKg);
            if (isNaN(w) || w < 20 || w > 300) {
                toast.error("Weight must be between 20 and 300 kg");
                return;
            }
        }

        setLoading(true);

        try {
            const data: ProfileUpdateData = {
                full_name: fullName.trim() || undefined,
                phone: phone.trim() || undefined,
                date_of_birth: dateOfBirth || undefined,
                height_cm: heightCm ? parseInt(heightCm, 10) : undefined,
                weight_kg: weightKg ? parseFloat(weightKg) : undefined,
                gender,
                fitness_goal: fitnessGoal,
                diet_preference: dietPreference,
            };

            const result = await updateProfile(data);
            if (result.success) {
                toast.success("Profile details saved successfully!");
                onClose();
            } else {
                toast.error(result.error || "Failed to update profile. Please try again.");
            }
        } catch (err: unknown) {
            console.error("Profile Modal: Save exception:", err);
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

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

    if (!isOpen || !isLoggedIn || !user) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 h-[100dvh] w-screen z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto overscroll-contain modal-overlay-in"
                onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
            >
                <div
                    {...modalProps}
                    aria-label="Member Profile and Settings"
                    className="relative w-full max-w-lg my-auto surface-modal hairline rounded-3xl overflow-hidden max-h-[92dvh] flex flex-col modal-panel-in shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-surface-card border-b border-surface-border p-4 sm:p-5 flex justify-between items-center sticky top-0 z-10 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-hi leading-tight">Member Profile</h3>
                                <p className="text-[11px] text-mid">Brother&apos;s Fitness Member Hub</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full text-mid hover:text-hi hover:bg-surface-elevated transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                        {/* Profile Header & Google Avatar Display */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-card border border-surface-border">
                            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-black border-2 border-accent/40 shrink-0 shadow-md">
                                {user.photo_url ? (
                                    <Image
                                        src={user.photo_url}
                                        alt={user.full_name || "Profile Photo"}
                                        fill
                                        sizes="72px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white bg-accent">
                                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface-card" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-base text-hi truncate">
                                        {user.full_name || "Valued Member"}
                                    </h4>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                                        Verified
                                    </span>
                                </div>
                                <p className="text-xs text-mid truncate mt-0.5">{user.email}</p>
                                <p className="text-[10px] text-faint mt-1">Google OAuth Connected</p>
                            </div>
                        </div>

                        {/* Daily AI Credits Tracker */}
                        <div className="surface-card hairline p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-hi">
                                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                                    <span>Daily AI Synthesizer Credits</span>
                                </div>
                                <span className="text-sm font-black text-accent tabular-nums">
                                    {remainingCredits} / {MAX_DAILY_CREDITS}
                                </span>
                            </div>
                            <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all duration-300"
                                    style={{ width: `${(remainingCredits / MAX_DAILY_CREDITS) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-low">
                                Credits automatically refresh every morning at 5:30 AM IST
                            </p>
                        </div>

                        {/* Section 1: Personal Information */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-mid">
                                Personal Information
                            </h5>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Full Name */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-mid">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Your full name"
                                            className="w-full text-xs bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-hi placeholder:text-low focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-mid">Mobile / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full text-xs bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-hi placeholder:text-low focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-mid">Date of Birth</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                        <input
                                            type="date"
                                            value={dateOfBirth}
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                            max={todayMax}
                                            className="w-full text-xs bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-hi focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>

                                {/* Gender Selection */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-mid">Gender</label>
                                    <div className="flex gap-1.5">
                                        {(["Male", "Female", "Other"] as const).map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setGender(g)}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                                    gender === g
                                                        ? "bg-accent text-white shadow-xs"
                                                        : "bg-surface-card border border-surface-border text-mid hover:text-hi"
                                                }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Biometrics & Body Metrics */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold uppercase tracking-wider text-mid">
                                    Body Metrics
                                </h5>
                                {bmi && (
                                    <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                                        BMI: {bmi}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Height */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-mid">Height (cm)</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                        <input
                                            type="number"
                                            value={heightCm}
                                            onChange={(e) => setHeightCm(e.target.value)}
                                            placeholder="175"
                                            min={50}
                                            max={300}
                                            className="w-full text-xs bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-hi placeholder:text-low focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>

                                {/* Weight */}
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-mid">Weight (kg)</label>
                                    <div className="relative">
                                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                                        <input
                                            type="number"
                                            value={weightKg}
                                            onChange={(e) => setWeightKg(e.target.value)}
                                            placeholder="70"
                                            min={20}
                                            max={300}
                                            step={0.1}
                                            className="w-full text-xs bg-surface-card border border-surface-border rounded-xl pl-9 pr-3 py-2.5 text-hi placeholder:text-low focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Fitness & Diet Goals */}
                        <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-mid">
                                Fitness &amp; Nutrition Focus
                            </h5>

                            {/* Primary Goal */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-mid flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-accent" />
                                    <span>Primary Goal</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FITNESS_GOALS.map((g) => (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => setFitnessGoal(g.id)}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                fitnessGoal === g.id
                                                    ? "bg-accent/10 border-accent text-accent font-bold"
                                                    : "bg-surface-card border-surface-border text-mid hover:text-hi"
                                            }`}
                                        >
                                            <p className="text-xs">{g.label}</p>
                                            <p className="text-[9px] opacity-75 font-normal truncate mt-0.5">{g.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Diet Preference */}
                            <div className="space-y-1.5 pt-1">
                                <label className="text-[11px] font-medium text-mid flex items-center gap-1.5">
                                    <Utensils className="w-3.5 h-3.5 text-accent" />
                                    <span>Dietary Preference</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DIET_PREFERENCES.map((d) => (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => setDietPreference(d.id)}
                                            className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                dietPreference === d.id
                                                    ? "bg-accent text-white border-accent shadow-xs"
                                                    : "bg-surface-card border-surface-border text-mid hover:text-hi"
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer Actions */}
                    <div className="p-4 bg-surface-card border-t border-surface-border space-y-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving to Database...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Save &amp; Sync Profile</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-status-danger hover:text-status-danger/80 hover:bg-status-danger/10 rounded-xl transition-colors cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out Account</span>
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
