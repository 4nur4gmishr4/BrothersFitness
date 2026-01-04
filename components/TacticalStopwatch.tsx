"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, X, TrendingUp, TrendingDown, Bell } from "lucide-react";

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
                if (mode === "countdown") {
                    setTime(prevTime => {
                        const newTime = prevTime - 1;

                        // Alert when countdown reaches 0
                        if (newTime === 0 && !hasAlerted) {
                            setIsRunning(false);
                            setHasAlerted(true);
                            // Play alert sound and vibrate
                            if (typeof window !== 'undefined') {
                                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDVeHpHg==');
                                audio.play().catch(() => { }); // Ignore errors
                                navigator.vibrate?.(200);
                            }
                            return 0;
                        }

                        return newTime > 0 ? newTime : 0;
                    });
                } else {
                    setTime(prevTime => prevTime + 1);
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, mode, hasAlerted]);

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
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 left-6 z-50 w-14 h-14 bg-gym-red rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                aria-label="Open Tactical Timer"
            >
                <Timer className="w-6 h-6 text-white" />
            </motion.button>

            {/* Timer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-6 z-50 bg-black border border-white/20 rounded-2xl p-6 shadow-2xl w-80"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black uppercase text-sm tracking-widest">Tactical Timer</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={handleModeSwitch}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider ${mode === "stopwatch"
                                        ? "bg-gym-red border-gym-red text-white"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:border-gym-red/50"
                                    }`}
                            >
                                <TrendingUp className="w-3 h-3" />
                                Count Up
                            </button>
                            <button
                                onClick={handleModeSwitch}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider ${mode === "countdown"
                                        ? "bg-gym-red border-gym-red text-white"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:border-gym-red/50"
                                    }`}
                            >
                                <TrendingDown className="w-3 h-3" />
                                Countdown
                            </button>
                        </div>

                        {/* Timer Display */}
                        <div className="text-center mb-6">
                            <motion.p
                                className={`text-6xl font-black font-mono tabular-nums ${time === 0 && mode === "countdown" ? "text-gray-600" : "text-gym-red"}`}
                                animate={time === 0 && mode === "countdown" && isRunning === false ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {formatTime(time)}
                            </motion.p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                {time === 0 && mode === "countdown" && !isRunning && (
                                    <Bell className="w-3 h-3 text-gray-500 animate-pulse" />
                                )}
                                <p className="text-xs text-gray-500 uppercase tracking-widest">
                                    {getStatusText()}
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center gap-4 mb-6">
                            <motion.button
                                onClick={handleStartStop}
                                disabled={mode === "countdown" && time === 0 && !isRunning}
                                className={`flex items-center justify-center w-14 h-14 rounded-full ${isRunning ? 'bg-yellow-500' : 'bg-green-500'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                whileTap={{ scale: 0.9 }}
                                aria-label={isRunning ? "Pause Timer" : "Start Timer"}
                            >
                                {isRunning ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black" />}
                            </motion.button>

                            <motion.button
                                onClick={handleReset}
                                className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                                whileTap={{ scale: 0.9 }}
                                aria-label="Reset Timer"
                            >
                                <RotateCcw className="w-5 h-5 text-white" />
                            </motion.button>
                        </div>

                        {/* Quick Presets - Only for Countdown */}
                        {mode === "countdown" && (
                            <div className="pt-4 border-t border-white/10">
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Rest Presets</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[30, 60, 90, 120, 180, 300].map(sec => (
                                        <button
                                            key={sec}
                                            onClick={() => handlePresetClick(sec)}
                                            className={`px-3 py-2 bg-white/5 border border-white/10 rounded text-xs font-mono hover:border-gym-red hover:text-gym-red hover:bg-gym-red/10 transition-all ${time === sec && mode === "countdown" ? "border-gym-red text-gym-red bg-gym-red/10" : ""
                                                }`}
                                        >
                                            {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
