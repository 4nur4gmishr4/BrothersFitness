"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, AlertTriangle, Crown, X } from 'lucide-react';
import type { GymMember } from '@/lib/supabase';

interface AnalyticsPanelProps {
    members: GymMember[];
    onClose: () => void;
}

// Pricing for revenue calculation
const PLAN_PRICES: Record<string, number> = {
    'Monthly': 500,
    'Quarterly': 1350,
    'Half-Yearly': 2500,
    'Yearly': 4500
};

export default function AnalyticsPanel({ members, onClose }: AnalyticsPanelProps) {
    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let active = 0, expiring = 0, expired = 0;
        const planCounts: Record<string, number> = {};
        const monthlyRevenue: Record<string, number> = {};

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

            // Monthly revenue (based on membership start)
            if (m.membership_start) {
                const startDate = new Date(m.membership_start);
                const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                const price = PLAN_PRICES[plan] || 500;
                monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + price;
            }
        });

        // Get last 6 months of revenue
        const revenueData: { month: string; amount: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            revenueData.push({
                month: monthNames[d.getMonth()],
                amount: monthlyRevenue[key] || 0
            });
        }

        const maxRevenue = Math.max(...revenueData.map(r => r.amount), 1);
        const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);

        return { active, expiring, expired, planCounts, revenueData, maxRevenue, totalRevenue };
    }, [members]);

    const total = stats.active + stats.expiring + stats.expired;
    const activePercent = total > 0 ? (stats.active / total) * 100 : 0;
    const expiringPercent = total > 0 ? (stats.expiring / total) * 100 : 0;
    const expiredPercent = total > 0 ? (stats.expired / total) * 100 : 0;

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
                <div className="md:col-span-2 bg-black/30 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-mono text-gray-400 uppercase mb-4">Monthly Revenue Growth</h3>
                    <div className="flex items-end justify-between gap-2 h-32">
                        {stats.revenueData.map((data, i) => (
                            <div key={data.month} className="flex-1 flex flex-col items-center">
                                <motion.div
                                    className="w-full bg-gradient-to-t from-gym-red to-red-400 rounded-t"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(data.amount / stats.maxRevenue) * 100}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    style={{ minHeight: data.amount > 0 ? '8px' : '2px' }}
                                />
                                <span className="text-[10px] text-gray-500 mt-2">{data.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-3">
                        <span className="text-xs text-gray-500">Last 6 Months</span>
                        <span className="text-lg font-black text-gym-red">₹{stats.totalRevenue.toLocaleString()}</span>
                    </div>
                </div>

                {/* Active vs Expiry Donut */}
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-mono text-gray-400 uppercase mb-4">Member Status</h3>
                    <div className="relative w-24 h-24 mx-auto mb-4">
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
                        <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                            <span className="text-lg font-black">{total}</span>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                                Active
                            </span>
                            <span className="font-bold text-green-400">{stats.active}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                                Expiring
                            </span>
                            <span className="font-bold text-yellow-400">{stats.expiring}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
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
