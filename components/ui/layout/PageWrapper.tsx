"use client";

import { usePathname } from "next/navigation";
import TacticalChatbot from "@/components/public/widgets/TacticalChatbot";
import TacticalStopwatch from "@/components/public/widgets/TacticalStopwatch";
import ScrollRevealDriver from "@/components/ui/layout/ScrollRevealDriver";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isWorkouts = pathname === "/workouts" || pathname?.startsWith("/workouts");

    return (
        <>
            <ScrollRevealDriver />

            <div
                className="relative min-h-screen animate-page-in"
                id="main-content-wrapper"
            >
                {children}
            </div>

            {isHome && <TacticalChatbot />}
            {isWorkouts && <TacticalStopwatch />}
        </>
    );
}

export { PageWrapper };
