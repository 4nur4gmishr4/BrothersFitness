"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GymMember } from "@/lib/supabase";
import { getMemberStatus, parseLocalDate } from "@/lib/member-utils";
import { PLAN_PRICES } from "@/lib/config";
import { adminFetch } from "@/lib/admin-api";

export type MemberStatusCount = {
  total: number;
  active: number;
  expiring: number;
  expired: number;
};

export type RevenueBreakdown = {
  monthly: number;
  quarterly: number;
  halfYearly: number;
  fifteenDays: number;
  total: number;
};

export type GrowthStats = {
  thisMonth: number;
  lastMonth: number;
  projectedRevenue: number;
};

export type AlertItem = {
  id: string;
  full_name: string | null;
  mobile: string | null;
  membership_type: string | null;
  membership_end: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  address: string | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  daysUntil?: number;
  daysRemaining?: number;
};

export type AdminDashboardStats = MemberStatusCount & {
  revenue: RevenueBreakdown;
  plans: {
    monthly: number;
    quarterly: number;
    halfYearly: number;
    fifteenDays: number;
  };
  growth: GrowthStats;
  alerts: {
    birthdaysToday: AlertItem[];
    upcomingBirthdays: AlertItem[];
    expiringToday: AlertItem[];
    expiringSoon: AlertItem[];
    incomplete: AlertItem[];
  };
};

export function useAllMembers() {
  const router = useRouter();
  const [members, setMembers] = useState<GymMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch("/api/admin/members", {
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load members";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { members, loading, error, refresh, setMembers };
}

export function computeAdminStats(members: GymMember[]): AdminDashboardStats {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  let active = 0;
  let expiring = 0;
  let expired = 0;
  let monthlyCount = 0;
  let quarterlyCount = 0;
  let halfYearlyCount = 0;
  let fifteenDaysCount = 0;
  let monthlyRevenue = 0;
  let quarterlyRevenue = 0;
  let halfYearlyRevenue = 0;
  let fifteenDaysRevenue = 0;

  const birthdaysToday: AlertItem[] = [];
  const upcomingBirthdaysRaw: (AlertItem & { daysUntil: number })[] = [];
  const expiringToday: AlertItem[] = [];
  const expiringSoon: AlertItem[] = [];
  const incomplete: AlertItem[] = [];

  const thisMonthStart = new Date(today.getFullYear(), todayMonth, 1);
  const lastMonthStart = new Date(today.getFullYear(), todayMonth - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), todayMonth, 0);
  let joinedThisMonth = 0;
  let joinedLastMonth = 0;
  let projectedRevenue = 0;

  for (const m of members) {
    const status = getMemberStatus(m.membership_end);
    if (status === "active") active++;
    else if (status === "expiring") expiring++;
    else expired++;

    const price =
      (PLAN_PRICES as Record<string, number>)[m.membership_type || "Monthly"] || 0;
    const t = m.membership_type;
    if (t === "Monthly" || t === "1 Month") {
      monthlyRevenue += price;
      monthlyCount++;
    } else if (t === "Quarterly" || t === "3 Months") {
      quarterlyRevenue += price;
      quarterlyCount++;
    } else if (t === "Half-Yearly" || t === "6 Months") {
      halfYearlyRevenue += price;
      halfYearlyCount++;
    } else if (t === "15 Days") {
      fifteenDaysRevenue += price;
      fifteenDaysCount++;
    }

    if (m.created_at) {
      const created = new Date(m.created_at);
      if (created >= thisMonthStart) joinedThisMonth++;
      else if (created >= lastMonthStart && created <= lastMonthEnd)
        joinedLastMonth++;
    }

    if (status === "expiring") {
      projectedRevenue += price;
      if (m.membership_end) {
        const end = parseLocalDate(m.membership_end);
        if (end) {
          const now0 = new Date();
          now0.setHours(0, 0, 0, 0);
          const diff = Math.ceil(
            (end.getTime() - now0.getTime()) / (1000 * 60 * 60 * 24)
          );
          const enriched: AlertItem & { daysRemaining?: number } = {
            id: m.id,
            full_name: m.full_name,
            mobile: m.mobile,
            membership_type: m.membership_type,
            membership_end: m.membership_end,
            date_of_birth: m.date_of_birth,
            photo_url: m.photo_url,
            address: m.address,
            gender: m.gender,
            height_cm: m.height_cm,
            weight_kg: m.weight_kg,
            daysRemaining: diff,
          };
          if (diff === 0) expiringToday.push(enriched);
          else if (diff >= 0 && diff <= 7) expiringSoon.push(enriched);
        }
      }
    }

    if (m.date_of_birth) {
      const dob = parseLocalDate(m.date_of_birth);
      if (dob && dob.getMonth() === todayMonth && dob.getDate() === todayDate) {
        birthdaysToday.push({
          id: m.id,
          full_name: m.full_name,
          mobile: m.mobile,
          membership_type: m.membership_type,
          membership_end: m.membership_end,
          date_of_birth: m.date_of_birth,
          photo_url: m.photo_url,
          address: m.address,
          gender: m.gender,
          height_cm: m.height_cm,
          weight_kg: m.weight_kg,
        });
      } else {
        const days = getDaysUntilBirthday(m.date_of_birth);
        if (days > 0 && days <= 7) {
          upcomingBirthdaysRaw.push({
            id: m.id,
            full_name: m.full_name,
            mobile: m.mobile,
            membership_type: m.membership_type,
            membership_end: m.membership_end,
            date_of_birth: m.date_of_birth,
            photo_url: m.photo_url,
            address: m.address,
            gender: m.gender,
            height_cm: m.height_cm,
            weight_kg: m.weight_kg,
            daysUntil: days,
          });
        }
      }
    }

    const missing: string[] = [];
    if (!m.photo_url) missing.push("photo");
    if (!m.date_of_birth) missing.push("dob");
    if (!m.gender) missing.push("gender");
    if (!m.height_cm || !m.weight_kg) missing.push("body");
    if (!m.address) missing.push("address");
    if (missing.length > 0) {
      incomplete.push({
        id: m.id,
        full_name: m.full_name,
        mobile: m.mobile,
        membership_type: m.membership_type,
        membership_end: m.membership_end,
        date_of_birth: m.date_of_birth,
        photo_url: m.photo_url,
        address: m.address,
        gender: m.gender,
        height_cm: m.height_cm,
        weight_kg: m.weight_kg,
      });
    }
  }

  expiringSoon.sort((a, b) => (a.daysRemaining ?? 0) - (b.daysRemaining ?? 0));
  upcomingBirthdaysRaw.sort((a, b) => a.daysUntil - b.daysUntil);
  incomplete.sort((a, b) => {
    const aScore = countMissing(a);
    const bScore = countMissing(b);
    return bScore - aScore;
  });

  return {
    total: members.length,
    active,
    expiring,
    expired,
    revenue: {
      monthly: monthlyRevenue,
      quarterly: quarterlyRevenue,
      halfYearly: halfYearlyRevenue,
      fifteenDays: fifteenDaysRevenue,
      total: monthlyRevenue + quarterlyRevenue + halfYearlyRevenue + fifteenDaysRevenue,
    },
    plans: {
      monthly: monthlyCount,
      quarterly: quarterlyCount,
      halfYearly: halfYearlyCount,
      fifteenDays: fifteenDaysCount,
    },
    growth: {
      thisMonth: joinedThisMonth,
      lastMonth: joinedLastMonth,
      projectedRevenue,
    },
    alerts: {
      birthdaysToday,
      upcomingBirthdays: upcomingBirthdaysRaw,
      expiringToday,
      expiringSoon,
      incomplete,
    },
  };
}

function getDaysUntilBirthday(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const born = parseLocalDate(dateString);
  if (!born) return 0;

  let target = new Date(today.getFullYear(), born.getMonth(), born.getDate());
  if (
    target.getMonth() !== born.getMonth() ||
    target.getDate() !== born.getDate()
  ) {
    target = new Date(today.getFullYear(), born.getMonth() + 1, 0);
  }
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function countMissing(m: GymMember | AlertItem): number {
  let n = 0;
  if (!m.photo_url) n++;
  if (!m.date_of_birth) n++;
  if (!("gender" in m) || !m.gender) n++;
  if (!("height_cm" in m) || !m.height_cm || !("weight_kg" in m) || !m.weight_kg) n++;
  if (!("address" in m) || !m.address) n++;
  return n;
}

export function useAdminStats(members: GymMember[]) {
  return useMemo(() => computeAdminStats(members), [members]);
}
