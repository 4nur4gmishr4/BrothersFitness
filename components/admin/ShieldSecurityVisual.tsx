"use client";

import { useId } from "react";

export type ShieldState = "locked" | "armed" | "authenticating" | "success" | "error";

interface ShieldSecurityVisualProps {
  state: ShieldState;
  className?: string;
}

export function ShieldSecurityVisual({ state, className = "" }: ShieldSecurityVisualProps) {
  const uniqueId = useId().replace(/:/g, "");
  const maskId = `shield-mask-${uniqueId}`;
  const glowId = `shield-glow-${uniqueId}`;

  // Theme color variables based on security state
  const isLocked = state === "locked";
  const isArmed = state === "armed";
  const isAuth = state === "authenticating";
  const isSuccess = state === "success";
  const isError = state === "error";

  // Dynamic stroke & fill colors
  let shieldStroke = "rgba(215, 25, 33, 0.3)"; // muted Brothers Fitness red in locked
  let shieldFill = "rgba(10, 10, 10, 0.8)";
  let circuitStroke = "rgba(215, 25, 33, 0.25)";
  let nodeFill = "#3a1517";
  let coreGlowColor = "#D71921";
  let statusBadgeText = "LOCKED";
  let statusBadgeColor = "text-low border-surface-border bg-surface-card/60";

  if (isArmed) {
    shieldStroke = "#D71921";
    circuitStroke = "rgba(215, 25, 33, 0.6)";
    nodeFill = "#D71921";
    statusBadgeText = "ARMED / READY";
    statusBadgeColor = "text-accent border-accent/40 bg-accent/10";
  } else if (isAuth) {
    shieldStroke = "#ff2e38";
    circuitStroke = "#D71921";
    nodeFill = "#ff2e38";
    statusBadgeText = "AUTHENTICATING...";
    statusBadgeColor = "text-accent border-accent bg-accent/20 animate-pulse";
  } else if (isSuccess) {
    shieldStroke = "#22c55e";
    circuitStroke = "rgba(34, 197, 94, 0.8)";
    nodeFill = "#22c55e";
    coreGlowColor = "#22c55e";
    statusBadgeText = "ACCESS GRANTED";
    statusBadgeColor = "text-status-success border-status-success/50 bg-status-success/10";
  } else if (isError) {
    shieldStroke = "#ef4444";
    circuitStroke = "rgba(239, 68, 68, 0.8)";
    nodeFill = "#ef4444";
    coreGlowColor = "#ef4444";
    statusBadgeText = "ACCESS DENIED";
    statusBadgeColor = "text-status-danger border-status-danger/50 bg-status-danger/10";
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`relative w-28 h-28 sm:w-32 sm:h-32 transition-transform duration-300 ${
          isError ? "animate-shake" : ""
        }`}
        role="img"
        aria-label={`Brothers Fitness Security Shield in ${statusBadgeText} state`}
      >
        {/* Ambient Glow Aura Behind Shield */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-500 pointer-events-none ${
            isSuccess
              ? "bg-status-success/30 opacity-100"
              : isError
              ? "bg-status-danger/30 opacity-100"
              : isAuth
              ? "bg-accent/40 opacity-100 animate-pulse"
              : isArmed
              ? "bg-accent/25 opacity-80"
              : "bg-accent/10 opacity-30"
          }`}
        />

        {/* SVG Shield CPU Visual (Vector Asset) */}
        <svg
          viewBox="0 0 256 256"
          className="relative w-full h-full drop-shadow-[0_0_12px_rgba(215,25,33,0.3)] transition-all duration-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
            </mask>
          </defs>

          {/* Center Group - Standardized Scale & Center Matrix */}
          <g transform="matrix(0.7,0,0,0.7,128,128)">
            
            {/* Outer Shield Frame */}
            <g transform="scale(4,4)">
              <path
                stroke={shieldStroke}
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill={shieldFill}
                className="transition-colors duration-300"
                d="M0,13C0,13,1.858,11.63,1.858,11.63C9.179,6.234,12.485,-2.513,10.371,-10.892C10.371,-10.892,10.371,-10.892,10.371,-10.892C10.371,-10.892,7,-13,0,-13C-7,-13,-10.371,-10.892,-10.371,-10.892C-10.371,-10.892,-10.371,-10.892,-10.371,-10.892C-12.485,-2.513,-9.179,6.234,-1.858,11.63C-1.858,11.63,0,13,0,13Z"
              />
            </g>

            {/* Circuit Traces to 6 Surrounding Nodes */}
            <g transform="scale(4,4)">
              {/* Top-Left Trace */}
              <path
                stroke={circuitStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={isAuth ? "4 2" : "none"}
                className={`transition-all duration-300 ${isAuth ? "animate-circuit-flow" : ""}`}
                d="M-11.25,-8 L-15,-8 L-18,-12"
              />
              <circle cx="-18" cy="-12" r="2.5" fill={nodeFill} className="transition-colors duration-300" />

              {/* Left Trace */}
              <path
                stroke={circuitStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={isAuth ? "4 2" : "none"}
                className={`transition-all duration-300 ${isAuth ? "animate-circuit-flow-rev" : ""}`}
                d="M-10.469,0 L-18,0"
              />
              <circle cx="-18" cy="0" r="2.5" fill={nodeFill} className="transition-colors duration-300" />

              {/* Bottom-Left Trace */}
              <path
                stroke={circuitStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={isAuth ? "4 2" : "none"}
                className={`transition-all duration-300 ${isAuth ? "animate-circuit-flow" : ""}`}
                d="M-6.871,8.009 L-15,8 L-18,12"
              />
              <circle cx="-18" cy="12" r="2.5" fill={nodeFill} className="transition-colors duration-300" />

              {/* Bottom-Right Trace */}
              <path
                stroke={circuitStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={isAuth ? "4 2" : "none"}
                className={`transition-all duration-300 ${isAuth ? "animate-circuit-flow-rev" : ""}`}
                d="M6.692,8.009 L15,8 L18,12"
              />
              <circle cx="18" cy="12" r="2.5" fill={nodeFill} className="transition-colors duration-300" />

              {/* Right Trace */}
              <path
                stroke={circuitStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={isAuth ? "4 2" : "none"}
                className={`transition-all duration-300 ${isAuth ? "animate-circuit-flow" : ""}`}
                d="M10.469,0 L18,0"
              />
              <circle cx="18" cy="0" r="2.5" fill={nodeFill} className="transition-colors duration-300" />

              {/* Top-Right Trace */}
              <path
                stroke={circuitStroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={isAuth ? "4 2" : "none"}
                className={`transition-all duration-300 ${isAuth ? "animate-circuit-flow-rev" : ""}`}
                d="M11.25,-8 L15,-8 L18,-12"
              />
              <circle cx="18" cy="-12" r="2.5" fill={nodeFill} className="transition-colors duration-300" />
            </g>

            {/* Central CPU Keyhole / Lock Core */}
            <g transform="scale(4,4)">
              {/* Keyhole Top Circle */}
              <circle
                cx="0"
                cy="-2"
                r="3"
                fill={isSuccess ? "#22c55e" : isError ? "#ef4444" : isArmed || isAuth ? "#D71921" : "#4a1517"}
                className={`transition-all duration-300 ${isLocked ? "animate-pulse-slow" : ""}`}
                filter={isArmed || isAuth || isSuccess ? `url(#${glowId})` : undefined}
              />
              {/* Keyhole Stem */}
              <path
                d="M-1,0 L1,0 L1,3.5 C1,4 0.5,4.5 0,4.5 C-0.5,4.5 -1,4 -1,3.5 Z"
                fill={isSuccess ? "#22c55e" : isError ? "#ef4444" : isArmed || isAuth ? "#D71921" : "#4a1517"}
                className="transition-all duration-300"
              />
            </g>

            {/* Success Checkmark overlay when authenticated */}
            {isSuccess && (
              <g transform="scale(4,4)">
                <path
                  d="M-3.5,-1 L-1,1.5 L3.5,-3"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-check"
                />
              </g>
            )}

            {/* Scanning Radar Arc during Auth */}
            {isAuth && (
              <g transform="scale(4,4)">
                <circle
                  cx="0"
                  cy="0"
                  r="9"
                  stroke="#ff2e38"
                  strokeWidth="0.75"
                  strokeDasharray="6 12"
                  fill="none"
                  className="animate-spin-slow origin-center"
                />
              </g>
            )}

          </g>
        </svg>
      </div>

      {/* Security Status Badge */}
      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest font-bold border uppercase transition-all duration-300 ${statusBadgeColor}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSuccess
                ? "bg-status-success"
                : isError
                ? "bg-status-danger"
                : isAuth
                ? "bg-accent animate-ping"
                : isArmed
                ? "bg-accent"
                : "bg-faint"
            }`}
          />
          {statusBadgeText}
        </span>
      </div>
    </div>
  );
}
