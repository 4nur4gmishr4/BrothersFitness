import type { Metadata } from 'next';
import TrophyRoomPage from './TrophyRoomPage';
import { GamificationProvider } from '@/components/ui/providers/GamificationContext';

export const metadata: Metadata = {
    title: "Trophy Room | Brother's Fitness",
    description: "Track your fitness achievements, daily visit streaks, and unlock medals at Brother's Fitness Lakhnadon.",
};

export default function Page() {
    return (
        <GamificationProvider>
            <TrophyRoomPage />
        </GamificationProvider>
    );
}
