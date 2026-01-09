"use client";

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertTriangle, Crown, X } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';
import { PLAN_PRICES } from '@/lib/config';

interface AnalyticsPanelProps {
    members: GymMember[];
    onClose: () => void;
}

export default function AnalyticsPanel({ members, onClose }: AnalyticsPanelProps) {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

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
                const price = (PLAN_PRICES as any)[plan] || 0;

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

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md relative"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gym-red" />
                Financial Analytics
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="md:col-span-2 bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col">
                    <h3 className="text-sm font-mono text-gray-400 uppercase mb-4">Monthly Revenue Growth</h3>

                    {/* Bars */}
                    <div className="flex items-end justify-between gap-2 h-32 mb-2">
                        {stats.revenueData.map((data, i) => (
                            <button
                                key={data.key}
                                onClick={() => setSelectedMonth(selectedMonth === data.key ? null : data.key)}
                                className="flex-1 flex flex-col items-center group relative focus:outline-none"
                            >
                                <motion.div
                                    className={`w-full rounded-t transition-colors ${selectedMonth === data.key ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-gradient-to-t from-gym-red to-red-400 opacity-80 group-hover:opacity-100'}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(data.amount / stats.maxRevenue) * 100}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    style={{ minHeight: data.amount > 0 ? '8px' : '2px' }}
                                />
                                <span className={`text-[10px] mt-2 font-bold ${selectedMonth === data.key ? 'text-white' : 'text-gray-500'}`}>{data.month}</span>

                                {/* Tooltip amount above bar */}
                                {data.amount > 0 && (
                                    <div className="absolute -top-6 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
                                        ₹{(data.amount / 1000).toFixed(1)}k
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-auto">
                        <span className="text-xs text-gray-500">Last 6 Months</span>
                        <span className="text-lg font-black text-gym-red">₹{stats.totalRevenue.toLocaleString()}</span>
                    </div>

                    {/* Selected Month Details Dropdown */}
                    {selectedMonth && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-white uppercase">{selectedMonthData?.month} Breakdown</h4>
                                <span className="text-xs font-mono text-green-400">Total: ₹{selectedMonthData?.amount.toLocaleString()}</span>
                            </div>
                            <div className="max-h-40 overflow-y-auto pr-2 space-y-1 scrollbar-hide">
                                {selectedMonthMembers.length > 0 ? (
                                    selectedMonthMembers.map(m => (
                                        <div key={m.id} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded hover:bg-white/10 transition-colors">
                                            <span className="text-gray-300 truncate max-w-[120px]">{m.full_name}</span>
                                            <div className="flex gap-2 text-gray-500">
                                                <span className="text-[10px] border border-white/10 px-1 rounded">{m.membership_type}</span>
                                                <span className="font-mono text-white">₹{(PLAN_PRICES as any)[m.membership_type || '1 Month'] || 0}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-500 text-center py-2">No transactions recorded</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Active vs Expiry Donut */}
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-mono text-gray-400 uppercase mb-4">Member Status</h3>
                    <div className="relative w-24 h-24 mx-auto mb-4 scale-110">
                        <div
                            className="w-full h-full rounded-full"
                            style={{
                                background: `conic-gradient(
                                    #22c55e 0deg ${activePercent * 3.6}deg,
                                    #eab308 ${activePercent * 3.6}deg ${(activePercent + expiringPercent) * 3.6}deg,
                                    #ef4444 ${(activePercent + expiringPercent) * 3.6}deg 360deg
                                )`
                            }}
                        />
                        {/* Inner Mask for Donut Effect */}
                        <div className="absolute inset-3 bg-[#0c0c0c] rounded-full flex items-center justify-center border border-white/5">
                            <span className="text-lg font-black text-white">{total}</span>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs mt-6">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                Active
                            </span>
                            <span className="font-bold text-green-400">{stats.active}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                Expiring
                            </span>
                            <span className="font-bold text-yellow-400">{stats.expiring}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                Expired
                            </span>
                            <span className="font-bold text-red-400">{stats.expired}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Plans */}
            <div className="mt-6 bg-black/30 rounded-xl p-4 border border-white/5">
                <h3 className="text-sm font-mono text-gray-400 uppercase mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Popular Plans
                </h3>
                <div className="space-y-3">
                    {Object.entries(stats.planCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([plan, count]) => {
                            const maxCount = Math.max(...Object.values(stats.planCounts));
                            const percent = (count / maxCount) * 100;
                            return (
                                <div key={plan} className="flex items-center gap-3">
                                    <span className="text-xs font-mono w-24 text-gray-400">{plan}</span>
                                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                </div>
            </div>


        </motion.div>
    );
}
