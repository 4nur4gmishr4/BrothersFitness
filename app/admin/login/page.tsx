"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  Info,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { useAdmin } from "@/lib/auth-context";
import { ShieldSecurityVisual, ShieldState } from "@/components/admin/ShieldSecurityVisual";

function formatResetTime(resetInSeconds: number): string {
  if (resetInSeconds < 60) return `${resetInSeconds}s`;
  const m = Math.floor(resetInSeconds / 60);
  const s = resetInSeconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = searchParams.get("redirected");

  const { login, isAdmin, isLoading } = useAdmin();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "blocked"
  >("idle");
  const [shieldState, setShieldState] = useState<ShieldState>("locked");
  const [rateLimit, setRateLimit] = useState<{ blocked: boolean; resetIn: number } | null>(null);
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace("/admin/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (redirected === "1") {
      setHint("Please log in to access the admin console.");
    }
  }, [redirected]);

  // Sync shield security state based on user input & submit status
  useEffect(() => {
    if (submitState === "submitting" || submitState === "success") return;
    if (rateLimit?.blocked) {
      setShieldState("locked");
      return;
    }
    if (password.trim().length > 0) {
      setShieldState("armed");
    } else {
      setShieldState("locked");
    }
  }, [password, submitState, rateLimit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setHint(null);
    if (!password.trim() || submitState === "submitting") return;

    setSubmitState("submitting");
    setShieldState("authenticating");
    const startTime = Date.now();

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      // Ensure full scanning animation cycle runs (1.2s minimum duration)
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise((r) => setTimeout(r, 1200 - elapsed));
      }

      if (res.status === 429) {
        const resetIn = Number(data.resetIn) || 900;
        setRateLimit({ blocked: true, resetIn });
        setError(data.error || "Too many login attempts.");
        setSubmitState("blocked");
        setShieldState("error");

        setTimeout(() => {
          setShieldState("locked");
        }, 1500);

        const start = Date.now();
        const end = start + resetIn * 1000;
        const tick = setInterval(() => {
          const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
          setRateLimit({ blocked: remaining > 0, resetIn: remaining });
          if (remaining <= 0) {
            clearInterval(tick);
            setSubmitState("idle");
          }
        }, 1000);
        return;
      }

      if (res.status === 401 || !res.ok || !data.token) {
        setError(data.error || "Incorrect password. Access denied.");
        setSubmitState("idle");
        setShieldState("error");
        setTimeout(() => {
          setShieldState(password.trim() ? "armed" : "locked");
        }, 1500);
        return;
      }

      const ok = await login(password);
      if (ok) {
        setSubmitState("success");
        setShieldState("success");
        // Allow access granted animation sequence to display fully before redirect
        await new Promise((r) => setTimeout(r, 600));
        router.replace("/admin/dashboard");
      } else {
        setError("Session could not be established. Please try again.");
        setSubmitState("idle");
        setShieldState("error");
        setTimeout(() => {
          setShieldState(password.trim() ? "armed" : "locked");
        }, 1500);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setSubmitState("idle");
      setShieldState("error");
      setTimeout(() => {
        setShieldState(password.trim() ? "armed" : "locked");
      }, 1500);
    }
  };

  const blocked = submitState === "blocked";
  const submitting = submitState === "submitting" || submitState === "success";
  const inputDisabled = submitting || blocked;

  return (
    <div className="w-full">
      {/* Visual Hierarchy: [Animated Security Shield] -> Heading -> Form -> Access Button */}
      <div className="flex flex-col items-center text-center mb-6">
        <ShieldSecurityVisual state={shieldState} className="mb-4" />
        <h1 className="font-display uppercase tracking-widest text-2xl sm:text-3xl text-hi">
          Admin Access
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-mid max-w-sm">
          Sign in to manage members, review leads, and monitor Brothers Fitness operations.
        </p>
      </div>

      <div className="hairline surface-card p-5 sm:p-7 rounded-lg">
        {hint && (
          <div
            role="status"
            className="mb-5 hairline border-status-info/30 bg-status-info/5 p-3 flex items-start gap-2.5 text-xs text-status-info rounded"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{hint}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block label-text uppercase tracking-widest text-[0.7rem] text-mid mb-2"
            >
              Admin Passcode
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-low pointer-events-none" />
              <input
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
                placeholder="Enter admin password"
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error
                    ? "login-error"
                    : capsLock
                    ? "capslock-hint"
                    : undefined
                }
                className="input-field pl-10 pr-12 min-h-[44px]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-low hover:text-hi transition-colors duration-fast"
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
                className="mt-2 text-[0.7rem] label-text uppercase tracking-widest text-status-warning"
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
              className="hairline border-status-danger/30 bg-status-danger/5 p-3 flex items-start gap-2.5 rounded"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-status-danger" />
              <div className="flex-1 text-xs text-status-danger">
                <div className="font-bold uppercase tracking-widest font-mono mb-0.5">
                  {blocked ? "Login temporarily blocked" : "Access denied"}
                </div>
                <div>{error}</div>
                {blocked && rateLimit && rateLimit.resetIn > 0 && (
                  <div className="mt-1 font-mono text-status-warning">
                    Try again in {formatResetTime(rateLimit.resetIn)}.
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={inputDisabled || !password.trim()}
            className="btn-primary w-full min-h-[46px] relative overflow-hidden group"
          >
            {submitState === "submitting" ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating Passcode...
              </>
            ) : submitState === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                Access Granted — Entering Dashboard...
              </>
            ) : blocked ? (
              <>
                <Lock className="w-4 h-4" />
                Access Blocked
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Access Admin Panel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen surface-canvas text-hi flex flex-col">
      <div className="px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-surface-border">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-mid hover:text-hi transition-colors duration-fast"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="label-text uppercase tracking-widest text-xs">
            Back to site
          </span>
        </Link>
        <div className="flex items-center gap-2 text-faint">
          <Timer className="w-3.5 h-3.5" />
          <span className="label-text uppercase tracking-widest text-[0.65rem]">
            Sessions expire after 24h
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-[0.7rem] label-text uppercase tracking-widest text-faint">
            Restricted to authorised gym personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
