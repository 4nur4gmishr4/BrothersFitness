"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdmin } from "@/lib/admin-auth-context";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirected = searchParams.get("redirected");

  const { establishSession, isAdmin, isLoading } = useAdmin();

  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "blocked"
  >("idle");
  const [rateLimit, setRateLimit] = useState<{ blocked: boolean; resetIn: number } | null>(null);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace("/admin/members");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (redirected === "1") {
      setHint("Please log in to access the admin console.");
    }
  }, [redirected]);

  const handleLoginSubmit = async (password: string) => {
    setError(null);
    setHint(null);
    if (!password.trim() || submitState === "submitting") return;

    setSubmitState("submitting");
    const startTime = Date.now();

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      // Ensure smooth UX transition
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      if (res.status === 429) {
        const resetIn = Number(data.resetIn) || 900;
        setRateLimit({ blocked: true, resetIn });
        setError(data.error || "Too many login attempts.");
        setSubmitState("blocked");

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

      if (res.status === 401 || !res.ok) {
        setError(data.error || "Incorrect password. Access denied.");
        setSubmitState("idle");
        return;
      }

      if (data.token || data.success || res.ok) {
        establishSession(data.token);
        setSubmitState("success");
        await new Promise((r) => setTimeout(r, 600));
        router.replace("/admin/members");
      } else {
        setError("Session could not be established. Please try again.");
        setSubmitState("idle");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setSubmitState("idle");
    }
  };

  return (
    <AdminLoginForm
      heading="Admin Access"
      description="Enter master passcode to access the Brother's Fitness management console."
      logo={{
        url: "/",
        src: "/assets/favicon.png",
        alt: "Brother's Fitness",
        title: "Brother's Fitness",
      }}
      buttonText="Access Admin Panel"
      footerNote="Restricted to authorised gym personnel only"
      backUrl="/"
      backText="Back to site"
      onSubmitPassword={handleLoginSubmit}
      isLoading={submitState === "submitting"}
      isSuccess={submitState === "success"}
      isBlocked={submitState === "blocked"}
      error={error}
      hint={hint}
      rateLimitResetIn={rateLimit?.resetIn || 0}
    />
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
