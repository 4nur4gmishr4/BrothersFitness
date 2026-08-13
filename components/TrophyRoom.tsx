"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trophy, X, Award, Lock } from 'lucide-react';
import { useGamification, MEDALS } from './GamificationContext';
import TrophyShine from '@/components/animations/TrophyShine';
import FlameFlicker from '@/components/animations/FlameFlicker';
import ConfettiBurst from '@/components/animations/ConfettiBurst';

// Progress ring component (pure SVG, no framer-motion)
function ProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(42,42,42,0.8)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--accent-color, #D71921)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-500 ease-out"
            />
        </svg>
    );
}

/** Shared trophy content used in both modal and page modes. */
function TrophyContent({ onClose }: { onClose?: () => void }) {
    const { medals, visitStreak } = useGamification();

    const allMedals = useMemo(() =>
        Object.entries(MEDALS) as [keyof typeof MEDALS, typeof MEDALS[keyof typeof MEDALS]][]
        , []);

    const progress = useMemo(() =>
        Math.round((medals.length / allMedals.length) * 100)
        , [medals.length, allMedals.length]);

    return (
        <div className="surface-modal hairline overflow-hidden">
            {/* Header */}
            <div className="surface-elevated hairline-b p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-accent flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="heading-display text-2xl text-hi uppercase tracking-tight">
                                Trophy Room
                            </h2>
                            <p className="text-low text-sm flex items-center gap-1">
                                Your Achievements
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            aria-label="Close trophy room"
                            className="p-2 text-low hover:text-hi hover:bg-surface-canvas transition-colors duration-fast"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 surface-elevated hairline p-4 group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 surface-canvas hairline border-status-danger/30">
                                <FlameFlicker className="w-5 h-5 text-status-danger" />
                            </div>
                            <div>
                                <p className="label-text text-[10px] text-faint uppercase tracking-wider font-bold">Streak</p>
                                <p className="stat-callout__value text-xl font-black text-status-danger">
                                    {visitStreak}
                                    <span className="text-xs ml-1 text-status-danger/70 font-bold">DAYS</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 surface-elevated hairline p-4 group">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ConfettiBurst />
                                <ProgressRing progress={progress} size={44} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Trophy className="w-4 h-4 text-accent" />
                                </div>
                            </div>
                            <div>
                                <p className="label-text text-[10px] text-faint uppercase tracking-wider font-bold">Rank</p>
                                <p className="stat-callout__value text-xl font-black text-hi">
                                    {medals.length}
                                    <span className="text-xs text-faint font-bold">/{allMedals.length}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medals Grid */}
            <div className="px-6 pb-4">
                <div className="grid grid-cols-1 gap-3">
                    {allMedals.map(([key, medal]) => {
                        const isUnlocked = medals.includes(key);
                        return (
                            <div
                                key={key}
                                className={`surface-elevated hairline p-4 transition-colors duration-fast hover:border-accent ${isUnlocked ? '' : 'opacity-60'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`relative w-12 h-12 flex items-center justify-center text-2xl shrink-0 overflow-hidden ${isUnlocked
                                        ? 'surface-canvas border border-accent/30'
                                        : 'surface-canvas hairline grayscale'
                                        }`}>
                                        {isUnlocked && <TrophyShine />}
                                        {isUnlocked ? medal.icon : 'ðŸ”’'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm ${isUnlocked ? 'text-accent' : 'text-faint'}`}>
                                            {medal.name}
                                        </h3>
                                        <p className={`text-xs mt-0.5 ${isUnlocked ? 'text-mid' : 'text-faint'}`}>
                                            {medal.description}
                                        </p>
                                    </div>
                                    <div className={`shrink-0 p-2 ${isUnlocked ? 'surface-canvas text-accent' : 'surface-canvas text-faint'}`}>
                                        {isUnlocked ? <Award className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 hairline-t">
                <p className="text-center text-xs text-faint flex items-center justify-center gap-2">
                    <FlameFlicker className="w-3 h-3 text-status-danger" />
                    Keep visiting daily to unlock more medals!
                    <FlameFlicker className="w-3 h-3 text-status-danger" />
                </p>
            </div>
        </div>
    );
}

export default function TrophyRoom({ isModal = false, isPage = false, onClose }: { isModal?: boolean; isPage?: boolean; onClose?: () => void } = {}) {
    const [isOpen, setIsOpen] = useState(isModal);
    const [hasViewed, setHasViewed] = useState(true);

    useEffect(() => {
        const viewed = localStorage.getItem('brofit_trophy_seen');
        if (!viewed) setHasViewed(false);
    }, []);

    useEffect(() => {
        if (isModal) setIsOpen(true);
    }, [isModal]);

    useEffect(() => {
        if (!isOpen) return;
        const chatbotBtn = document.getElementById('tactical-chatbot-button');
        document.body.style.overflow = 'hidden';
        if (chatbotBtn) chatbotBtn.style.display = 'none';
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

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    // Page mode: render content inline without modal overlay
    if (isPage) {
        return (
            <div className="w-full max-w-md mx-auto">
                <TrophyContent />
            </div>
        );
    }

    return (
        <>
            {!isModal && (
                <button
                    onClick={handleOpen}
                    className="relative p-2.5 text-faint hover:text-accent transition-colors duration-fast group"
                    title="Trophy Room"
                >
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    {!hasViewed && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                            !
                        </span>
                    )}
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 bg-black/95 z-[200] overflow-y-auto modal-overlay-in">
                    <div className="min-h-full flex items-center justify-center p-4">
                        <div
                            className="relative w-full max-w-md z-10 my-auto modal-panel-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TrophyContent onClose={handleClose} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

