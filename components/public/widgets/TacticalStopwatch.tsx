"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, X, Bell } from "lucide-react";
import TimerTick from "@/components/ui/animations/TimerTick";

export default function TacticalStopwatch() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"stopwatch" | "countdown">("stopwatch");
  const [targetTime, setTargetTime] = useState(0);
  const [hasAlerted, setHasAlerted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) =>
          mode === "countdown" ? Math.max(prevTime - 1, 0) : prevTime + 1
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode]);

  // Alert when timer reaches 0
  useEffect(() => {
    if (mode === "countdown" && isRunning && time === 0 && !hasAlerted) {
      setIsRunning(false);
      setHasAlerted(true);
      if (typeof window !== "undefined") {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDVeHpHg=="
        );
        audio.play().catch(() => {});
        navigator.vibrate?.(200);
      }
    }
  }, [time, mode, isRunning, hasAlerted]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleStartStop = () => {
    if (!isRunning && mode === "countdown" && time === 0) return;
    setHasAlerted(false);
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

  const handleModeSwitch = (newMode: "stopwatch" | "countdown") => {
    if (mode === newMode) return;
    setIsRunning(false);
    setMode(newMode);
    setTime(0);
    setTargetTime(0);
    setHasAlerted(false);
  };

  const getStatusText = () => {
    if (time === 0 && mode === "countdown") return "Set duration";
    if (isRunning) return mode === "countdown" ? "Counting down" : "Timer running";
    if (time > 0) return "Paused";
    return "Ready";
  };

  return (
    <>
      {/* iOS Floating Timer Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 z-[105] w-13 h-13 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Open Workout Timer"
      >
        <Timer className="w-6 h-6" />
      </button>

      {/* iOS Modal Card Sheet */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-[200] w-84 rounded-3xl bg-surface-canvas/90 backdrop-blur-2xl border border-surface-border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-hi">
                Workout Timer
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-surface-soft hover:bg-surface-elevated text-mid hover:text-hi flex items-center justify-center transition-colors"
              aria-label="Close timer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* iOS Segmented Pill Switcher */}
          <div className="grid grid-cols-2 p-1 bg-surface-soft rounded-2xl mb-6 border border-surface-border">
            <button
              onClick={() => handleModeSwitch("stopwatch")}
              className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                mode === "stopwatch"
                  ? "bg-surface-card text-hi shadow-sm"
                  : "text-mid hover:text-hi"
              }`}
            >
              Stopwatch
            </button>
            <button
              onClick={() => handleModeSwitch("countdown")}
              className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                mode === "countdown"
                  ? "bg-surface-card text-hi shadow-sm"
                  : "text-mid hover:text-hi"
              }`}
            >
              Rest Timer
            </button>
          </div>

          {/* Time Display (iOS Typographic style) */}
          <div className="text-center mb-6">
            <p className="text-6xl font-extralight tracking-tight tabular-nums text-hi">
              <TimerTick seconds={time} active={isRunning} format={formatTime} />
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {time === 0 && mode === "countdown" && !isRunning && (
                <Bell className="w-3 h-3 text-low" />
              )}
              <p className="text-xs text-mid font-medium">{getStatusText()}</p>
            </div>
          </div>

          {/* iOS Circular Dual Controls */}
          <div className="flex justify-between items-center px-4 mb-5">
            {/* Reset Button (Apple Silver circle) */}
            <button
              onClick={handleReset}
              className="w-16 h-16 rounded-full bg-surface-soft hover:bg-surface-elevated text-hi font-medium text-xs flex items-center justify-center border border-surface-border active:scale-95 transition-transform"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Start / Pause Button (Apple Green / Orange circle) */}
            <button
              onClick={handleStartStop}
              disabled={mode === "countdown" && time === 0 && !isRunning}
              className={`w-16 h-16 rounded-full font-semibold text-xs flex items-center justify-center text-white shadow-md active:scale-95 transition-all ${
                isRunning
                  ? "bg-[#FF9500] hover:bg-[#E08500]"
                  : "bg-[#34C759] hover:bg-[#2EB04E]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={isRunning ? "Pause Timer" : "Start Timer"}
            >
              {isRunning ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Rest Presets (iOS Pill Chips) */}
          {mode === "countdown" && (
            <div className="pt-4 border-t border-surface-border">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-mid mb-2.5">
                Rest Presets
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90, 120, 180, 300].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => handlePresetClick(sec)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${
                      time === sec && mode === "countdown"
                        ? "bg-accent text-white border-accent shadow-xs"
                        : "bg-surface-soft border-surface-border text-mid hover:text-hi hover:bg-surface-elevated"
                    }`}
                  >
                    {sec >= 60
                      ? `${Math.floor(sec / 60)}m${sec % 60 > 0 ? ` ${sec % 60}s` : ""}`
                      : `${sec}s`}
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
