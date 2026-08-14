"use client";

import Navbar from '@/components/public/layout/Navbar';
import Footer from '@/components/public/layout/Footer';
import TrophyRoom from '@/components/features/gamification/TrophyRoom';

export default function TrophyRoomPage() {
    return (
        <div className="min-h-screen surface-canvas text-hi">
            <Navbar />
            <section className="py-12 md:py-20 px-4">
                <TrophyRoom isPage />
            </section>
            <Footer />
        </div>
    );
}
