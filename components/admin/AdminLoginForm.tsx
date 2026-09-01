"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  Info,
  Timer,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AdminLoginFormProps {
  heading?: string;
  description?: string;
  logo?: {
    url?: string;
    src?: string;
    alt?: string;
    title?: string;
    className?: string;
  };
  buttonText?: string;
  footerNote?: string;
  backUrl?: string;
  backText?: string;
  className?: string;
  onSubmitPassword?: (password: string) => Promise<void> | void;
  isLoading?: boolean;
  isSuccess?: boolean;
  isBlocked?: boolean;
  error?: string | null;
  hint?: string | null;
  rateLimitResetIn?: number;
}

export function AdminLoginForm({
  heading = "Admin Access",
  description = "Enter your admin password to open the gym management dashboard.",
  logo = {
    url: "/",
    src: "/assets/favicon.png",
    alt: "Brother's Fitness Logo",
    title: "Brother's Fitness",
  },
  buttonText = "Log In",
  footerNote = "For gym staff and trainers only",
  backUrl = "/",
  backText = "Back to site",
  className,
  onSubmitPassword,
  isLoading = false,
  isSuccess = false,
  isBlocked = false,
  error = null,
  hint = null,
  rateLimitResetIn = 0,
}: AdminLoginFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading || isSuccess || isBlocked) return;
    if (onSubmitPassword) {
      onSubmitPassword(password);
    }
  };

  const formatResetTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const inputDisabled = isLoading || isSuccess || isBlocked;

  return (
    <div className={cn("min-h-screen surface-canvas text-hi flex flex-col justify-between selection:bg-accent selection:text-white", className)}>
      {/* Top Header Bar */}
      <header className="px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-surface-border bg-surface-soft/40 backdrop-blur-sm">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-mid hover:text-hi transition-colors text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backText}</span>
        </Link>
        <div className="flex items-center gap-2 text-faint font-medium text-xs">
          <Timer className="w-3.5 h-3.5 text-accent" />
          <span>24h Session TTL</span>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md flex flex-col items-center">
          
          {/* Logo & Gym Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link
              href={logo.url || "/"}
              className="relative group mb-4 p-2.5 rounded-2xl bg-black border border-white/10 shadow-xl transition-transform hover:scale-105 duration-fast"
            >
              <Image
                src={logo.src || "/assets/favicon.png"}
                alt={logo.alt || "Logo"}
                title={logo.title}
                width={56}
                height={56}
                className={cn("w-14 h-14 object-contain rounded-xl", logo.className)}
              />
              <div className="absolute -inset-0.5 bg-accent/20 rounded-2xl blur-md -z-10 group-hover:bg-accent/40 transition-colors" />
            </Link>

            <h1 className="font-bold tracking-tight text-2xl sm:text-3xl text-hi">
              {heading}
            </h1>
            {description && (
              <p className="mt-2 text-xs sm:text-sm text-mid max-w-sm font-medium">
                {description}
              </p>
            )}
          </div>

          {/* Form Card */}
          <div className="w-full hairline surface-card p-6 sm:p-8 rounded-2xl shadow-2xl border border-surface-border bg-surface-card/95">
            {hint && (
              <div
                role="status"
                className="mb-5 hairline border-status-info/30 bg-status-info/10 p-3 flex items-start gap-2.5 text-xs text-status-info rounded-xl"
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{hint}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block font-medium text-xs text-mid mb-2"
                >
                  Admin Passcode
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-low pointer-events-none" />
                  <Input
                    id="admin-password"
                    name="password"
                    autoComplete="current-password"
                    spellCheck={false}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={inputDisabled}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      const on = e.getModifierState && e.getModifierState("CapsLock");
                      setCapsLock(Boolean(on));
                    }}
                    onKeyUp={(e) => {
                      const on = e.getModifierState && e.getModifierState("CapsLock");
                      setCapsLock(Boolean(on));
                    }}
                    placeholder="Enter master passcode"
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                      error
                        ? "login-error"
                        : capsLock
                        ? "capslock-hint"
                        : undefined
                    }
                    className="pl-10 pr-11 text-sm bg-surface-soft/90 focus:border-accent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-low hover:text-hi transition-colors duration-fast"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {capsLock && !error && (
                  <p
                    id="capslock-hint"
                    className="mt-2 text-xs uppercase tracking-wider text-status-warning font-medium"
                  >
                    ⚠ Caps Lock is on
                  </p>
                )}
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  aria-live="polite"
                  className="hairline border-status-danger/30 bg-status-danger/10 p-3 flex items-start gap-2.5 rounded-md"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-status-danger" />
                  <div className="flex-1 text-xs text-status-danger">
                    <div className="font-bold uppercase tracking-wider mb-0.5">
                      {isBlocked ? "Login temporarily blocked" : "Access denied"}
                    </div>
                    <div>{error}</div>
                    {isBlocked && rateLimitResetIn > 0 && (
                      <div className="mt-1 text-status-warning font-medium">
                        Try again in {formatResetTime(rateLimitResetIn)}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={inputDisabled || !password.trim()}
                className="w-full h-11 uppercase font-bold tracking-wider relative overflow-hidden group shadow-lg shadow-accent/15"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating Passcode...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    Access Granted — Entering...
                  </>
                ) : isBlocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Access Blocked
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {buttonText}
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Warning & Badges */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-center text-xs uppercase tracking-wider text-faint font-medium">
              {footerNote}
            </p>
          </div>
        </div>
      </main>

      {/* Footer Bottom Strip */}
      <footer className="px-5 py-4 border-t border-surface-border text-center text-xs text-faint font-medium">
        Brother&apos;s Fitness System ERP &bull; Lakhnadon, MP
      </footer>
    </div>
  );
}

export const Login1 = AdminLoginForm;
export default AdminLoginForm;
