"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, X, TrendingUp, TrendingDown, Bell } from "lucide-react";
import TimerTick from "@/components/animations/TimerTick";

export default function TacticalStopwatch() {
    const [isOpen, setIsOpen] = useState(false);
    const [time, setTime] = useState(0); // Time in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState<"stopwatch" | "countdown">("stopwatch"); // Timer mode
    const [targetTime, setTargetTime] = useState(0); // For countdown mode
    const [hasAlerted, setHasAlerted] = useState(false); // Track if alert has been shown

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            interval = setInterval(() => {
                // Pure updater: no side effects inside the setState function.
                setTime(prevTime => mode === "countdown" ? Math.max(prevTime - 1, 0) : prevTime + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, mode]);

    // Fire the alert as a reaction to time hitting 0, not inside the tick updater.
    useEffect(() => {
        if (mode === "countdown" && isRunning && time === 0 && !hasAlerted) {
            setIsRunning(false);
            setHasAlerted(true);
            if (typeof window !== 'undefined') {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDVeHpHg==');
                audio.play().catch(() => { }); // Ignore errors
                navigator.vibrate?.(200);
            }
        }
    }, [time, mode, isRunning, hasAlerted]);

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const handleStartStop = () => {
        if (!isRunning && mode === "countdown" && time === 0) {
            // Don't start countdown if time is 0
            return;
        }
        setHasAlerted(false); // Reset alert flag when starting
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTime(mode === "countdown" ? targetTime : 0);
        setHasAlerted(false);
    };

    const handlePresetClick = (seconds: number) => {
        setMode("countdown");
        setTime(seconds);
        setTargetTime(seconds);
        setIsRunning(false);
        setHasAlerted(false);
    };

    const handleModeSwitch = () => {
        setIsRunning(false);
        setMode(prev => prev === "stopwatch" ? "countdown" : "stopwatch");
        setTime(0);
        setTargetTime(0);
        setHasAlerted(false);
    };

    const getStatusText = () => {
        if (time === 0 && mode === "countdown") return "Set Time";
        if (isRunning) return mode === "countdown" ? "Counting Down" : "Running";
        if (time > 0) return "Paused";
        return "Ready";
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 left-6 z-[105] w-14 h-14 bg-accent text-white flex items-center justify-center border border-accent-hover hover:bg-accent-hover transition-colors duration-fast"
                aria-label="Open rest timer"
            >
                <Timer className="w-6 h-6" />
            </button>

            {/* Timer Overlay */}
            {isOpen && (
                <div className="fixed bottom-24 left-6 z-[200] surface-modal hairline p-6 w-80">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="heading-section text-sm text-hi uppercase tracking-widest">Rest Timer</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-low hover:text-hi transition-colors duration-fast"
                            aria-label="Close timer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={handleModeSwitch}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border text-xs font-bold uppercase tracking-wider transition-colors duration-fast ${mode === "stopwatch"
                                ? "bg-accent text-white border-accent"
                                : "surface-card hairline text-low hover:border-accent hover:text-hi"
                                }`}
                        >
                            <TrendingUp className="w-3 h-3" />
                            Count Up
                        </button>
                        <button
                            onClick={handleModeSwitch}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border text-xs font-bold uppercase tracking-wider transition-colors duration-fast ${mode === "countdown"
                                ? "bg-accent text-white border-accent"
                                : "surface-card hairline text-low hover:border-accent hover:text-hi"
                                }`}
                        >
                            <TrendingDown className="w-3 h-3" />
                            Countdown
                        </button>
                    </div>

                    {/* Timer Display */}
                    <div className="text-center mb-6">
                        <p className={`text-6xl font-black font-mono tabular-nums ${time === 0 && mode === "countdown" ? "text-faint" : "text-accent"}`}>
                            <TimerTick seconds={time} active={isRunning} format={formatTime} />
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            {time === 0 && mode === "countdown" && !isRunning && (
                                <Bell className="w-3 h-3 text-low" />
                            )}
                            <p className="text-xs text-faint uppercase tracking-widest">
                                {getStatusText()}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4 mb-6">
                        <button
                            onClick={handleStartStop}
                            disabled={mode === "countdown" && time === 0 && !isRunning}
                            className={`flex items-center justify-center w-14 h-14 border ${isRunning
                                ? 'bg-status-warning text-status-on border-status-warning hover:bg-status-warning/90'
                                : 'bg-status-success text-status-on border-status-success hover:bg-status-success/90'
                                } disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast`}
                            aria-label={isRunning ? "Pause Timer" : "Start Timer"}
                        >
                            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center w-14 h-14 surface-elevated hairline text-hi hover:border-accent hover:text-accent transition-colors duration-fast"
                            aria-label="Reset Timer"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick Presets - Only for Countdown */}
                    {mode === "countdown" && (
                        <div className="pt-4 hairline-t">
                            <p className="label-text text-xs uppercase tracking-widest text-faint mb-3">Rest Presets</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[30, 60, 90, 120, 180, 300].map(sec => (
                                    <button
                                        key={sec}
                                        onClick={() => handlePresetClick(sec)}
                                        className={`px-3 py-2 border text-xs font-mono transition-colors duration-fast ${time === sec && mode === "countdown"
                                            ? "bg-accent text-white border-accent"
                                            : "surface-card hairline text-low hover:border-accent hover:text-hi"
                                            }`}
                                    >
                                        {sec >= 60 ? `${Math.floor(sec / 60)}m${sec % 60 > 0 ? `${sec % 60}s` : ''}` : `${sec}s`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

