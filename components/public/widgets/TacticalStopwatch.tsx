"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, X, Bell } from "lucide-react";
import TimerTick from "@/components/ui/animations/TimerTick";
import { Portal } from "@/components/ui/Portal";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import { AnimatedClock } from "@/components/ui/icons";

export default function TacticalStopwatch() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(0); // Time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"stopwatch" | "countdown">("stopwatch");
  const [targetTime, setTargetTime] = useState(0);
  const [hasAlerted, setHasAlerted] = useState(false);

  const modalProps = useModalDismiss(() => setIsOpen(false), isOpen);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (mode === "countdown" && prevTime <= 1) {
            setIsRunning(false);
            return 0;
          }
          return mode === "stopwatch" ? prevTime + 1 : prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode]);

  useEffect(() => {
    if (mode === "countdown" && time === 0 && targetTime > 0 && !hasAlerted) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch {
        // AudioContext not available or blocked
      }
      setHasAlerted(true);
    }
  }, [time, mode, targetTime, hasAlerted]);

  const handleStartStop = () => {
    if (mode === "countdown" && time === 0) return;
    setIsRunning(!isRunning);
    if (!isRunning && mode === "countdown" && time === targetTime) {
      setHasAlerted(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(mode === "stopwatch" ? 0 : targetTime);
    setHasAlerted(false);
  };

  const handlePresetClick = (seconds: number) => {
    setIsRunning(false);
    setMode("countdown");
    setTargetTime(seconds);
    setTime(seconds);
    setHasAlerted(false);
  };

  const handleModeSwitch = (newMode: "stopwatch" | "countdown") => {
    if (mode === newMode) return;
    setIsRunning(false);
    setMode(newMode);
    setTime(newMode === "countdown" ? targetTime : 0);
    setHasAlerted(false);
  };

  const getStatusText = () => {
    if (time === 0 && mode === "countdown") return "Set duration";
    if (isRunning) return mode === "countdown" ? "Counting down" : "Timer running";
    if (time > 0) return "Paused";
    return "Ready";
  };

  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return (
    <>
      {/* Floating Timer Trigger Button */}
      <button
        id="tactical-stopwatch-button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 z-[105] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Open Workout Timer"
      >
        <AnimatedClock size={24} ticking={isRunning} className="text-white" />
      </button>

      {/* Centered Tactical Workout Timer Modal */}
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-screen z-[200] flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-sm modal-overlay-in">
            <div
              {...modalProps}
              aria-label="Tactical Workout Timer"
              className="relative w-full max-w-[380px] my-auto surface-modal rounded-3xl border border-surface-border p-6 shadow-2xl flex flex-col overflow-hidden modal-panel-in"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-surface-border shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <AnimatedClock size={16} ticking={isRunning} />
                  </div>
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

              {/* Segmented Pill Switcher */}
              <div className="grid grid-cols-2 p-1 bg-surface-soft rounded-2xl mb-6 border border-surface-border shrink-0">
                <button
                  onClick={() => handleModeSwitch("stopwatch")}
                  className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    mode === "stopwatch"
                      ? "bg-surface-card text-hi shadow-xs"
                      : "text-mid hover:text-hi"
                  }`}
                >
                  Stopwatch
                </button>
                <button
                  onClick={() => handleModeSwitch("countdown")}
                  className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    mode === "countdown"
                      ? "bg-surface-card text-hi shadow-xs"
                      : "text-mid hover:text-hi"
                  }`}
                >
                  Rest Timer
                </button>
              </div>

              {/* Time Display */}
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

              {/* Circular Dual Controls */}
              <div className="flex justify-between items-center px-4 mb-5">
                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-16 h-16 rounded-full bg-surface-soft hover:bg-surface-elevated text-hi font-medium text-xs flex items-center justify-center border border-surface-border active:scale-95 transition-transform"
                  aria-label="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Start / Pause Button */}
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

              {/* Rest Presets */}
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
          </div>
        </Portal>
      )}
    </>
  );
}
