"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { TrendingUp, Crown, X } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';
import { PLAN_PRICES } from '@/lib/config';

interface AnalyticsPanelProps {
    members: GymMember[];
    onClose: () => void;
}

export default function AnalyticsPanel({ members, onClose }: AnalyticsPanelProps) {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [mountedPlan, setMountedPlan] = useState(false);

    // Trigger CSS transitions after mount so bars grow in
    useEffect(() => {
        const t1 = setTimeout(() => setMounted(true), 50);
        const t2 = setTimeout(() => setMountedPlan(true), 200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let active = 0, expiring = 0, expired = 0;
        const planCounts: Record<string, number> = {};
        const monthlyRevenue: Record<string, number> = {};
        const monthlyDetails: Record<string, GymMember[]> = {};

        members.forEach(m => {
            // Status calculation
            if (m.membership_end) {
                const end = new Date(m.membership_end);
                end.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) expired++;
                else if (diffDays <= 7) expiring++;
                else active++;
            } else {
                active++;
            }

            // Plan distribution
            const plan = m.membership_type || 'Monthly';
            planCounts[plan] = (planCounts[plan] || 0) + 1;

            // Monthly revenue & details (based on membership start)
            if (m.membership_start) {
                const startDate = new Date(m.membership_start);
                const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

                // Get price for this member's plan
                const price = (PLAN_PRICES as Record<string, number>)[plan] || 0;

                monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + price;

                if (!monthlyDetails[monthKey]) monthlyDetails[monthKey] = [];
                monthlyDetails[monthKey].push(m);
            }
        });

        // Get last 6 months of revenue
        const revenueData: { month: string; key: string; amount: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            revenueData.push({
                month: monthNames[d.getMonth()],
                key,
                amount: monthlyRevenue[key] || 0
            });
        }

        const maxRevenue = Math.max(...revenueData.map(r => r.amount), 1);
        const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);

        // Note: active matches PURE active here (not including expiring)
        // This is crucial for the donut chart separation
        return { active, expiring, expired, planCounts, revenueData, maxRevenue, totalRevenue, monthlyDetails };
    }, [members]);

    const total = stats.active + stats.expiring + stats.expired;
    // Calculate percents for donut chart
    const activePercent = total > 0 ? (stats.active / total) * 100 : 0;
    const expiringPercent = total > 0 ? (stats.expiring / total) * 100 : 0;

    // Get details for selected month
    const selectedMonthData = selectedMonth ? stats.revenueData.find(r => r.key === selectedMonth) : null;
    const selectedMonthMembers = selectedMonth ? stats.monthlyDetails[selectedMonth] || [] : [];

    // Reference for plan bars max
    const planMaxRef = useRef(0);
    const maxCount = Math.max(...Object.values(stats.planCounts), 1);
    planMaxRef.current = maxCount;

    return (
        <div className="surface-card hairline mb-8 p-6 relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-low hover:text-hi p-1 hover:bg-surface-elevated transition-colors duration-fast"
                aria-label="Close analytics"
            >
                <X className="w-5 h-5" />
            </button>

            <h2 className="heading-section text-lg text-hi uppercase mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Financial Analytics
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="md:col-span-2 surface-elevated hairline p-4 flex flex-col">
                    <h3 className="label-text text-low uppercase mb-4">Monthly Revenue Growth</h3>

                    {/* Bars */}
                    <div className="flex items-end justify-between gap-2 h-32 mb-2">
                        {stats.revenueData.map((data) => (
                            <button
                                key={data.key}
                                onClick={() => setSelectedMonth(selectedMonth === data.key ? null : data.key)}
                                className="flex-1 flex flex-col items-center group relative focus:outline-none"
                            >
                                <div
                                    className={`w-full transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${selectedMonth === data.key ? 'bg-accent' : 'bg-accent opacity-50 group-hover:opacity-100'}`}
                                    style={{
                                        height: mounted ? `${(data.amount / stats.maxRevenue) * 100}%` : '2px',
                                        minHeight: data.amount > 0 ? '8px' : '2px',
                                    }}
                                />
                                <span className={`text-[10px] mt-2 font-bold ${selectedMonth === data.key ? 'text-hi' : 'text-faint'}`}>{data.month}</span>

                                {/* Tooltip amount above bar */}
                                {data.amount > 0 && (
                                    <div className="absolute -top-6 surface-modal hairline px-1.5 py-0.5 text-[10px] text-hi opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        ₹{(data.amount / 1000).toFixed(1)}k
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center hairline-t pt-3 mt-auto">
                        <span className="text-xs text-faint">Last 6 Months</span>
                        <span className="heading-section text-lg text-accent">₹{stats.totalRevenue.toLocaleString()}</span>
                    </div>

                    {/* Selected Month Details Dropdown */}
                    {selectedMonth && (
                        <div className="mt-4 pt-4 hairline-t">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="label-text text-hi uppercase">{selectedMonthData?.month} Breakdown</h4>
                                <span className="text-xs font-mono text-status-success">Total: ₹{selectedMonthData?.amount.toLocaleString()}</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-1">
                                {selectedMonthMembers.length > 0 ? (
                                    selectedMonthMembers.map(m => (
                                        <div key={m.id} className="flex justify-between items-center text-xs surface-modal hairline hover:border-accent p-2 transition-colors duration-fast">
                                            <span className="text-hi truncate max-w-[120px]">{m.full_name}</span>
                                            <div className="flex gap-2 text-faint">
                                                <span className="text-[10px] surface-canvas border border-surface-border px-1">{m.membership_type}</span>
                                                <span className="font-mono text-hi">₹{(PLAN_PRICES as Record<string, number>)[m.membership_type || '1 Month'] || 0}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-faint text-center py-2">No transactions recorded</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Active vs Expiry Donut */}
                <div className="surface-elevated hairline p-4">
                    <h3 className="label-text text-low uppercase mb-4">Member Status</h3>
                    <div className="relative w-24 h-24 mx-auto mb-4 scale-110">
                        <div
                            className="w-full h-full rounded-full"
                            style={{
                                background: `conic-gradient(
                                    var(--status-success) 0deg ${activePercent * 3.6}deg,
                                    var(--status-warning) ${activePercent * 3.6}deg ${(activePercent + expiringPercent) * 3.6}deg,
                                    var(--status-danger) ${(activePercent + expiringPercent) * 3.6}deg 360deg
                                )`
                            }}
                        />
                        {/* Inner Mask for Donut Effect */}
                        <div className="absolute inset-3 surface-canvas rounded-full flex items-center justify-center border border-surface-border">
                            <span className="heading-section text-lg text-hi">{total}</span>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs mt-6">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-status-success rounded-full" />
                                Active
                            </span>
                            <span className="font-bold text-status-success">{stats.active}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-status-warning rounded-full" />
                                Expiring
                            </span>
                            <span className="font-bold text-status-warning">{stats.expiring}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-status-danger rounded-full" />
                                Expired
                            </span>
                            <span className="font-bold text-status-danger">{stats.expired}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Plans */}
            <div className="mt-6 surface-elevated hairline p-4">
                <h3 className="label-text text-low uppercase mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-accent" />
                    Popular Plans
                </h3>
                <div className="space-y-3">
                    {Object.entries(stats.planCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([plan, count]) => {
                            const percent = (count / maxCount) * 100;
                            return (
                                <div key={plan} className="flex items-center gap-3">
                                    <span className="text-xs font-mono w-24 text-low">{plan}</span>
                                    <div className="flex-1 h-3 surface-canvas border border-surface-border overflow-hidden">
                                        <div
                                            className="h-full bg-accent transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                                            style={{ width: mountedPlan ? `${percent}%` : '0%' }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold w-8 text-right text-hi">{count}</span>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
