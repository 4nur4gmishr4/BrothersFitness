"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Calendar, Ruler, Scale, Users, Loader2, CheckCircle, LogOut } from "lucide-react";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import { useUserAuth, ProfileUpdateData } from "@/lib/user-auth-context";
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

    // Form state
    const [fullName, setFullName] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");

    // Load user data when modal opens
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

    const handleSave = async () => {
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const data: ProfileUpdateData = {
                full_name: fullName.trim() || undefined,
                photo_url: photoUrl.trim() || undefined,
                date_of_birth: dateOfBirth || undefined,
                height_cm: heightCm ? parseInt(heightCm) : undefined,
                weight_kg: weightKg ? parseInt(weightKg) : undefined,
                gender: gender
            };

            console.log('Profile Modal: Saving data...', data);
            const result = await updateProfile(data);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2500);
            } else {
                setError(result.error || "Failed to update profile. Please try again.");
            }
        } catch (err: unknown) {
            console.error('Profile Modal: Save exception:', err);
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

    if (!isOpen || !isLoggedIn) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="relative w-full max-w-md bg-black border border-white/20 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gym-red p-4 flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-white" />
                            <span className="font-black uppercase tracking-widest text-sm text-white">
                                Customize Profile
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-black transition-colors p-1 rounded-full hover:bg-white/20"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Profile Header & Avatar Edit */}
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex-shrink-0 border-2 border-white/20 relative group">
                                {photoUrl ? (
                                    <Image
                                        src={photoUrl}
                                        alt={fullName || "Profile"}
                                        width={80}
                                        height={80}
                                        className="object-cover w-full h-full"
                                        unoptimized // Allow external URLs
                                        onError={() => setPhotoUrl("")} // Fallback on error
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div>
                                    <p className="text-white font-bold text-lg">{fullName || user?.email}</p>
                                    <p className="text-gray-400 text-xs">{user?.email}</p>
                                </div>
                            </div>
                        </div>


                        {/* Credits Display */}
                        <div className="bg-gradient-to-r from-white/5 to-transparent border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm font-medium">Daily AI Credits</span>
                                <span className="text-2xl font-black text-gym-red">{remainingCredits}/{MAX_DAILY_CREDITS}</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-gym-red"
                                    style={{ width: `${(remainingCredits / MAX_DAILY_CREDITS) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Messages */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Profile updated successfully!
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:border-gym-red focus:outline-none placeholder:text-gray-600 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold ml-1">Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:border-gym-red focus:outline-none [color-scheme:dark] transition-colors"
                                        max={new Date().toISOString().split("T")[0]}
                                    />
                                </div>
                            </div>

                            {/* Height & Weight */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold ml-1">Height</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="number"
                                            value={heightCm}
                                            onChange={(e) => setHeightCm(e.target.value)}
                                            placeholder="cm"
                                            className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-3 text-white focus:border-gym-red focus:outline-none placeholder:text-gray-600 text-sm transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase tracking-widest font-bold ml-1">Weight</label>
                                    <div className="relative">
                                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="number"
                                            value={weightKg}
                                            onChange={(e) => setWeightKg(e.target.value)}
                                            placeholder="kg"
                                            className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-3 text-white focus:border-gym-red focus:outline-none placeholder:text-gray-600 text-sm transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold ml-1">Gender</label>
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    <div className="flex gap-2 flex-1">
                                        {(["Male", "Female", "Other"] as const).map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setGender(g)}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${gender === g
                                                    ? "bg-gym-red text-white shadow-lg shadow-red-900/40"
                                                    : "bg-white/5 border border-white/20 text-gray-400 hover:text-white hover:bg-white/10"
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
                            className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${success
                                ? "bg-green-500 text-white cursor-default"
                                : "bg-gym-red text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 font-bold py-2 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}
