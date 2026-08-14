"use client";

import { usePathname } from "next/navigation";
import TacticalChatbot from "@/components/public/widgets/TacticalChatbot";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <>
            <ScrollReveal />

            <div
                className="relative min-h-screen animate-page-in"
                id="main-content-wrapper"
            >
                {children}
            </div>

            {pathname === "/" && <TacticalChatbot />}
        </>
    );
}