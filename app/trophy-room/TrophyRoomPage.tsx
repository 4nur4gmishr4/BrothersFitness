"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TrophyRoom from '@/components/TrophyRoom';

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
