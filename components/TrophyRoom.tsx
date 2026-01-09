"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Flame, Award, Lock, Star, Sparkles } from 'lucide-react';
import { useGamification, MEDALS } from './GamificationContext';

// Floating particle component for celebration effect
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        left: `${10 + (i * 7)}%`,
                        background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f59e0b' : '#d97706'
                    }}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{
                        y: '-100%',
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1, 1, 0.5]
                    }}
                    transition={{
                        duration: 3 + (i % 3),
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'linear'
                    }}
                />
            ))}
        </div>
    );
}

// Progress ring component
function ProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                    strokeDasharray: circumference
                }}
            />
            <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export default function TrophyRoom() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasViewed, setHasViewed] = useState(true);
    const { medals, visitStreak } = useGamification();

    const allMedals = useMemo(() =>
        Object.entries(MEDALS) as [keyof typeof MEDALS, typeof MEDALS[keyof typeof MEDALS]][]
        , []);

    const progress = useMemo(() =>
        Math.round((medals.length / allMedals.length) * 100)
        , [medals.length, allMedals.length]);

    useEffect(() => {
        const viewed = localStorage.getItem('brofit_trophy_seen');
        if (!viewed) setHasViewed(false);
    }, []);

    useEffect(() => {
        const chatbotBtn = document.getElementById('tactical-chatbot-button');
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (chatbotBtn) chatbotBtn.style.display = 'none';
        } else {
            document.body.style.overflow = '';
            if (chatbotBtn) chatbotBtn.style.display = '';
        }
        return () => {
            document.body.style.overflow = '';
            if (chatbotBtn) chatbotBtn.style.display = '';
        };
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        if (!hasViewed) {
            setHasViewed(true);
            localStorage.setItem('brofit_trophy_seen', 'true');
        }
    };

    return (
        <>
            {/* Trophy Button - Enhanced with glow effect */}
            <button
                onClick={handleOpen}
                className="relative p-2.5 text-gray-400 hover:text-yellow-400 transition-all group"
                title="Trophy Room"
            >
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                {!hasViewed && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50"
                    >
                        !
                    </motion.span>
                )}
            </button>

            {/* Trophy Room Modal - Premium Design */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] overflow-y-auto"
                    >
                        <div className="min-h-full flex items-center justify-center p-4">
                            {/* Floating particles background */}
                            <FloatingParticles />

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-md rounded-3xl z-10 my-auto" // Added z-10 and my-auto
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Glassmorphism container */}
                                <div className="bg-gradient-to-b from-zinc-900/95 to-black/95 border border-yellow-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-900/20">

                                    {/* Header with animated gradient */}
                                    <div className="relative p-6 pb-4 overflow-hidden">
                                        {/* Animated gradient background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-amber-500/10 to-orange-600/20 animate-pulse" />

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <motion.div
                                                    animate={{ rotateY: [0, 360] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                                    className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30"
                                                >
                                                    <Trophy className="w-7 h-7 text-black" />
                                                </motion.div>
                                                <div>
                                                    <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-tight">
                                                        Trophy Room
                                                    </h2>
                                                    <p className="text-sm text-gray-400 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" /> Your Achievements
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="px-6 pb-4">
                                        <div className="flex gap-4">
                                            {/* Streak Card */}
                                            <motion.div
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="flex-1 bg-gradient-to-br from-orange-500/20 to-red-600/10 border border-orange-500/30 rounded-2xl p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-orange-500/20 rounded-xl">
                                                        <Flame className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Streak</p>
                                                        <p className="text-xl font-black text-orange-400">
                                                            {visitStreak}
                                                            <span className="text-xs ml-1">days</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Progress Card */}
                                            <motion.div
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="flex-1 bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 rounded-2xl p-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <ProgressRing progress={progress} size={44} />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Star className="w-4 h-4 text-yellow-400" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Progress</p>
                                                        <p className="text-xl font-black text-yellow-400">
                                                            {medals.length}
                                                            <span className="text-xs text-gray-500">/{allMedals.length}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Medals Grid */}
                                    <div className="px-6 pb-6 max-h-[45vh] overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-3">
                                            {allMedals.map(([key, medal], index) => {
                                                const isUnlocked = medals.includes(key);
                                                return (
                                                    <motion.div
                                                        key={key}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.1 + index * 0.05 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={`relative p-4 rounded-2xl border transition-all overflow-hidden ${isUnlocked
                                                            ? 'bg-gradient-to-r from-yellow-500/15 to-amber-600/10 border-yellow-500/40'
                                                            : 'bg-zinc-900/50 border-zinc-700/50'
                                                            }`}
                                                    >
                                                        {/* Unlock shimmer effect */}
                                                        {isUnlocked && (
                                                            <motion.div
                                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"
                                                                animate={{ x: ['-100%', '100%'] }}
                                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                            />
                                                        )}

                                                        <div className="relative flex items-center gap-4">
                                                            {/* Medal Icon */}
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isUnlocked
                                                                ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/20 shadow-lg shadow-yellow-500/20'
                                                                : 'bg-zinc-800/50 grayscale'
                                                                }`}>
                                                                {isUnlocked ? medal.icon : '🔒'}
                                                            </div>

                                                            {/* Medal Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={`font-bold text-sm ${isUnlocked ? 'text-yellow-400' : 'text-gray-500'
                                                                    }`}>
                                                                    {medal.name}
                                                                </h3>
                                                                <p className={`text-xs mt-0.5 ${isUnlocked ? 'text-gray-300' : 'text-gray-600'
                                                                    }`}>
                                                                    {medal.description}
                                                                </p>
                                                            </div>

                                                            {/* Status Icon */}
                                                            <div className={`flex-shrink-0 p-2 rounded-lg ${isUnlocked ? 'bg-yellow-500/20' : 'bg-zinc-800/50'
                                                                }`}>
                                                                {isUnlocked ? (
                                                                    <Award className="w-4 h-4 text-yellow-400" />
                                                                ) : (
                                                                    <Lock className="w-4 h-4 text-gray-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 border-t border-yellow-500/10 bg-black/50 space-y-3">
                                        <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                            <Flame className="w-3 h-3 text-orange-400" />
                                            Keep visiting daily to unlock more medals!
                                            <Flame className="w-3 h-3 text-orange-400" />
                                        </p>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white rounded-xl font-bold text-sm transition-colors"
                                        >
                                            Close Trophy Room
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
