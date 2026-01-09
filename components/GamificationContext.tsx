"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Medal Definitions
export const MEDALS = {
    ROOKIE_RECRUIT: {
        id: "rookie_recruit",
        name: "Rookie Recruit",
        description: "Welcome to the battlefield, soldier.",
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
        name: "Diet Tactician",
        description: "Generated a tactical diet plan.",
        icon: "🍽️"
    },
    CALCULATOR_ELITE: {
        id: "calculator_elite",
        name: "Calculator Elite",
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
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedMedals = localStorage.getItem("brofit_medals");
        const storedStreak = localStorage.getItem("brofit_streak");
        const lastVisit = localStorage.getItem("brofit_last_visit");

        let currentMedals: MedalId[] = storedMedals ? JSON.parse(storedMedals) : [];
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
        setIsLoaded(true);
    }, []);

    const awardMedal = (medalId: MedalId) => {
        if (!medals.includes(medalId)) {
            const newMedals = [...medals, medalId];
            setMedals(newMedals);
            localStorage.setItem("brofit_medals", JSON.stringify(newMedals));
        }
    };

    const hasMedal = (medalId: MedalId) => medals.includes(medalId);

    // Render Provider even if not loaded (with initial values), or handle loading state differently if needed.
    // Ideally, we should render children always.
    // If we simply return children when !isLoaded, context users will crash.
    // So we MUST return Provider.

    return (
        <GamificationContext.Provider value={{ medals, visitStreak, awardMedal, hasMedal }}>
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
