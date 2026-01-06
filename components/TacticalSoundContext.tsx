"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface TacticalSoundContextType {
    soundEnabled: boolean;
    toggleSound: () => void;
    playClick: () => void;
    playSuccess: () => void;
    playHover: () => void;
}

const TacticalSoundContext = createContext<TacticalSoundContextType | null>(null);

// Tiny base64 encoded sounds (< 5KB each) - mechanical clicks
const SOUNDS = {
    click: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v/////////////////////////////////',
    success: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v/////////////////////////////////',
    hover: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v/////////////////////////////////'
};

export function TacticalSoundProvider({ children }: { children: ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

    useEffect(() => {
        // Load preference from localStorage
        const saved = localStorage.getItem('tacticalSoundEnabled');
        setSoundEnabled(saved === 'true');
    }, []);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('tacticalSoundEnabled', String(newValue));
            return newValue;
        });
    }, []);

    const playSound = useCallback((type: keyof typeof SOUNDS) => {
        if (!soundEnabled) return;

        try {
            // Create audio context on first interaction
            const ctx = audioContext || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            if (!audioContext) setAudioContext(ctx);

            // Create a simple oscillator for tactile feedback
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Different sounds for different actions
            if (type === 'click') {
                oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.05);
            } else if (type === 'success') {
                oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
            } else if (type === 'hover') {
                oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.02);
            }
        } catch {
            // Silently fail on unsupported browsers
        }
    }, [soundEnabled, audioContext]);

    const playClick = useCallback(() => playSound('click'), [playSound]);
    const playSuccess = useCallback(() => playSound('success'), [playSound]);
    const playHover = useCallback(() => playSound('hover'), [playSound]);

    return (
        <TacticalSoundContext.Provider value={{ soundEnabled, toggleSound, playClick, playSuccess, playHover }}>
            {children}
        </TacticalSoundContext.Provider>
    );
}

export function useTacticalSound() {
    const context = useContext(TacticalSoundContext);
    if (!context) {
        // Return no-op functions if not wrapped in provider
        return {
            soundEnabled: false,
            toggleSound: () => { },
            playClick: () => { },
            playSuccess: () => { },
            playHover: () => { }
        };
    }
    return context;
}
