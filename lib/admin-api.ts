"use client";

import { WHATSAPP_COUNTRY_CODE } from "@/lib/config";

export async function adminFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const token =
    (typeof window !== "undefined" && window.sessionStorage.getItem("admin_token")) ||
    null;

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    typeof init.body !== "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}

export function buildWhatsAppUrl(
  rawMobile: string | null | undefined,
  message: string
): string {
  const digits = String(rawMobile || "").replace(/\D/g, "");
  if (!digits || digits.length < 7) return "";
  const number = digits.startsWith(WHATSAPP_COUNTRY_CODE)
    ? digits
    : `${WHATSAPP_COUNTRY_CODE}${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(rawMobile: string | null | undefined, message: string): void {
  const url = buildWhatsAppUrl(rawMobile, message);
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
