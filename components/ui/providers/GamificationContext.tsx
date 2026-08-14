"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";

// Medal Definitions
export const MEDALS = {
    ROOKIE_RECRUIT: {
        id: "rookie_recruit",
        name: "Newcomer",
        description: "Welcome to the team.",
        icon: "🎖️"
    },
    IRON_ADDICT: {
        id: "iron_addict",
        name: "Iron Addict",
        description: "Visited 7 days consecutively.",
        icon: "🏆"
    },
    DIET_TACTICIAN: {
        id: "diet_tactician",
        name: "Diet Master",
        description: "Generated a diet plan.",
        icon: "🍽️"
    },
    CALCULATOR_ELITE: {
        id: "calculator_elite",
        name: "Calculator Master",
        description: "Used the fitness calculators.",
        icon: "📊"
    }
};

type MedalId = keyof typeof MEDALS;

interface GamificationContextType {
    medals: MedalId[];
    visitStreak: number;
    awardMedal: (medalId: MedalId) => void;
    hasMedal: (medalId: MedalId) => boolean;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
    const [medals, setMedals] = useState<MedalId[]>([]);
    const [visitStreak, setVisitStreak] = useState(0);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedMedals = localStorage.getItem("brofit_medals");
        const storedStreak = localStorage.getItem("brofit_streak");
        const lastVisit = localStorage.getItem("brofit_last_visit");

        // Corrupt localStorage (e.g. an old version) must not crash the app.
        let currentMedals: MedalId[] = [];
        try {
            const parsed = storedMedals ? JSON.parse(storedMedals) : [];
            if (Array.isArray(parsed)) currentMedals = parsed;
        } catch {
            currentMedals = [];
        }
        let currentStreak = storedStreak ? parseInt(storedStreak) : 0;

        // Check visit streak
        const today = new Date().toDateString();
        if (lastVisit) {
            const lastDate = new Date(lastVisit);
            const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day visit
                currentStreak += 1;
            } else if (diffDays > 1) {
                // Streak broken
                currentStreak = 1;
            }
            // If diffDays === 0, same day, don't increment
        } else {
            // First ever visit
            currentStreak = 1;
        }

        // Award Rookie Recruit on first visit
        if (!currentMedals.includes("ROOKIE_RECRUIT")) {
            currentMedals = [...currentMedals, "ROOKIE_RECRUIT"];
        }

        // Award Iron Addict for 7 day streak
        if (currentStreak >= 7 && !currentMedals.includes("IRON_ADDICT")) {
            currentMedals = [...currentMedals, "IRON_ADDICT"];
        }

        // Save state
        localStorage.setItem("brofit_medals", JSON.stringify(currentMedals));
        localStorage.setItem("brofit_streak", currentStreak.toString());
        localStorage.setItem("brofit_last_visit", today);

        setMedals(currentMedals);
        setVisitStreak(currentStreak);
    }, []);

    // M18: stable function identities so consumers don't re-render on every
    // provider render. awardMedal/hasMedal read state via functional updates
    // instead of closing over `medals` (which would go stale).
    const awardMedal = useCallback((medalId: MedalId) => {
        setMedals(prev => {
            if (prev.includes(medalId)) return prev;
            const newMedals = [...prev, medalId];
            localStorage.setItem("brofit_medals", JSON.stringify(newMedals));
            return newMedals;
        });
    }, []);

    const hasMedal = useCallback((medalId: MedalId) => medals.includes(medalId), [medals]);

    // Memoize the value so unrelated provider re-renders don't bust consumers.
    const value = useMemo(
        () => ({ medals, visitStreak, awardMedal, hasMedal }),
        [medals, visitStreak, awardMedal, hasMedal]
    );

    return (
        <GamificationContext.Provider value={value}>
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error("useGamification must be used within a GamificationProvider");
    }
    return context;
}
