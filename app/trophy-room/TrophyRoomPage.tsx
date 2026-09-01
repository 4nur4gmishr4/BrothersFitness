"use client";

import Navbar from "@/components/public/layout/Navbar";
import Footer from "@/components/public/layout/Footer";
import TrophyRoom from "@/components/features/gamification/TrophyRoom";
import PageWrapper from "@/components/ui/layout/PageWrapper";

export default function TrophyRoomPage() {
  return (
    <PageWrapper>
      <Navbar />
      <main className="min-h-screen surface-canvas text-hi py-6 sm:py-10">
        <TrophyRoom isPage />
      </main>
      <Footer />
    </PageWrapper>
  );
}
