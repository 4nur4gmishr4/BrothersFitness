"use client";

import { usePathname } from "next/navigation";
import TacticalChatbot from "@/components/public/widgets/TacticalChatbot";
import ScrollRevealDriver from "@/components/ui/layout/ScrollRevealDriver";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <>
            <ScrollRevealDriver />

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

export { PageWrapper };
