"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Plus, Search, X, Shield, Users, LogOut, AlertTriangle, AlertCircle, CheckCircle,
    Download, IndianRupee, Send, BarChart3, Clock, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/lib/auth-context';
import type { GymMember } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { PLAN_PRICES } from '@/lib/config';
import { todayIST, getMemberStatus, getDaysUntil } from '@/lib/member-utils';
import MemberCard from '@/components/admin/MemberCard';
import MemberFormModal from '@/components/admin/MemberFormModal';
import MemberReceiptModal from '@/components/admin/MemberReceiptModal';

const BulkMessageModal = dynamic(() => import('@/components/admin/BulkMessageModal'), {
    loading: () => <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
});

const AnalyticsPanel = dynamic(() => import('@/components/admin/AnalyticsPanel'), {
    loading: () => <div className="h-64 bg-white/5 animate-pulse rounded-xl mb-6" />
});

const ActivityLogPanel = dynamic(() => import('@/components/admin/ActivityLogPanel'));
const LeadsInbox = dynamic(() => import('@/components/admin/LeadsInbox'));
import DeploymentAlerts from '@/components/admin/DeploymentAlerts';
const ExpiringMembersTable = dynamic(() => import('@/components/admin/ExpiringMembersTable'), {
    loading: () => <div className="h-48 bg-white/5 animate-pulse rounded-xl mb-8" />
});
import IncompleteProfiles from '@/components/admin/IncompleteProfiles';

type FilterStatus = 'all' | 'active' | 'expiring' | 'expired' | 'incomplete';

export default function MembersPage() {
    const router = useRouter();
    const { isAdmin, isLoading, logout } = useAdmin();
    const [members, setMembers] = useState<GymMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState<GymMember | null>(null);
    const [renewMode, setRenewMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
    const [error, setError] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [showBulkMessage, setShowBulkMessage] = useState(false);
    // const [bulkMessageText, setBulkMessageText] = useState(''); // Removed unused state
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [receiptMember, setReceiptMember] = useState<GymMember | null>(null);
    // const [searchTerm, setSearchTerm] = useState(''); // Removed unused state
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showLeadsInbox, setShowLeadsInbox] = useState(false);
    const [unreadLeadsCount, setUnreadLeadsCount] = useState(0);
    const [showExpiringSoon, setShowExpiringSoon] = useState(false); // NEW: Toggle state

    // Fetch unread leads count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('admin_token');
            if (!token) return;

            const res = await fetch('/api/admin/leads', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await res.json();

            if (res.ok && data.leads) {
                const readLeads = JSON.parse(localStorage.getItem('brofit_admin_read_leads') || '[]');
                const unread = data.leads.filter((l: { id: string }) => !readLeads.includes(l.id)).length;
                setUnreadLeadsCount(unread);
            }
        } catch (err) {
            console.error('Failed to fetch lead count', err);
        }
    }, []);

    // Poll for unread messages every 30s
    useEffect(() => {
        if (isAdmin) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isAdmin, fetchUnreadCount]);

    // Refresh count when inbox closes
    useEffect(() => {
        if (!showLeadsInbox) {
            fetchUnreadCount();
        }
    }, [showLeadsInbox, fetchUnreadCount]);
    // Redirect if not admin
    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push('/admin/login');
        }
    }, [isAdmin, isLoading, router]);

    // Fetch members
    useEffect(() => {
        if (isAdmin) {
            fetchMembers();
        }
    }, [isAdmin]);

    const fetchMembers = async () => {
        try {
            const token = sessionStorage.getItem('admin_token');
            const res = await fetch('/api/admin/members', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.members) {
                setMembers(data.members);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
            setError('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Stats with Birthday, Expiry Alerts, and Analytics
    const stats = useMemo(() => {
        const total = members.length;
        const expired = members.filter(m => getMemberStatus(m.membership_end) === 'expired').length;
        const expiring = members.filter(m => getMemberStatus(m.membership_end) === 'expiring').length;
        const active = total - expired;

        // Revenue & Plan Calculation
        let monthlyCount = 0, quarterlyCount = 0, halfYearlyCount = 0, fifteenDaysCount = 0;
        let monthly = 0, quarterly = 0, halfYearly = 0, fifteenDays = 0;
        members.forEach(m => {
            const price = (PLAN_PRICES as Record<string, number>)[m.membership_type || 'Monthly'] || 0;
            if (m.membership_type === 'Monthly' || m.membership_type === '1 Month') { monthly += price; monthlyCount++; }
            else if (m.membership_type === 'Quarterly' || m.membership_type === '3 Months') { quarterly += price; quarterlyCount++; }
            else if (m.membership_type === 'Half-Yearly' || m.membership_type === '6 Months') { halfYearly += price; halfYearlyCount++; }
            else if (m.membership_type === '15 Days') { fifteenDays += price; fifteenDaysCount++; }
        });
        const totalRevenue = monthly + quarterly + halfYearly + fifteenDays;

        // Growth Analytics - members joined this month vs last month
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const joinedThisMonth = members.filter(m => {
            if (!m.created_at) return false;
            const created = new Date(m.created_at);
            return created >= thisMonthStart;
        }).length;

        const joinedLastMonth = members.filter(m => {
            if (!m.created_at) return false;
            const created = new Date(m.created_at);
            return created >= lastMonthStart && created <= lastMonthEnd;
        }).length;

        // Revenue projection (based on expiring memberships)
        const potentialRenewalRevenue = members.filter(m => getMemberStatus(m.membership_end) === 'expiring').reduce((sum, m) => {
            return sum + ((PLAN_PRICES as Record<string, number>)[m.membership_type || 'Monthly'] || 0);
        }, 0);

        // Birthday & Expiry Alerts
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        const birthdays = members.filter(m => {
            if (!m.date_of_birth) return false;
            const dob = new Date(m.date_of_birth);
            return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
        });

        // Upcoming birthdays in next 7 days (excluding today)
        const upcomingBirthdays = members.filter(m => {
            if (!m.date_of_birth) return false;
            const days = getDaysUntil(m.date_of_birth);
            return days > 0 && days <= 7;
        }).map(m => ({ ...m, daysUntil: getDaysUntil(m.date_of_birth!) })).sort((a, b) => a.daysUntil - b.daysUntil);

        const expiringToday = members.filter(m => {
            if (!m.membership_end) return false;
            const end = new Date(m.membership_end);
            return end.getMonth() === todayMonth && end.getDate() === todayDate;
        });

        return {
            total, active, expiring, expired,
            revenue: { monthly, quarterly, halfYearly, fifteenDays, total: totalRevenue },
            plans: { monthly: monthlyCount, quarterly: quarterlyCount, halfYearly: halfYearlyCount, fifteenDays: fifteenDaysCount },
            growth: { thisMonth: joinedThisMonth, lastMonth: joinedLastMonth, projectedRevenue: potentialRenewalRevenue },
            alerts: { birthdays, upcomingBirthdays, expiringToday }
        };
    }, [members]);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Server-side search results (page 1). The full `members` list stays for
    // stats/analytics/export; the grid prefers these server rows while a query
    // is active, so a large member table never ships wholesale to the client.
    const [serverSearchResults, setServerSearchResults] = useState<GymMember[] | null>(null);
    useEffect(() => {
        const q = debouncedSearch.trim();
        if (!q) { setServerSearchResults(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const token = sessionStorage.getItem('admin_token');
                const res = await fetch(`/api/admin/members?search=${encodeURIComponent(q)}&pageSize=100`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    cache: 'no-store'
                });
                const data = await res.json();
                if (!cancelled && data.members) setServerSearchResults(data.members);
            } catch (err) {
                console.error('Error searching members:', err);
                if (!cancelled) setServerSearchResults([]);
            }
        })();
        return () => { cancelled = true; };
    }, [debouncedSearch]);


    // Export members to CSV
    const exportToCSV = useCallback(() => {
        const headers = ['Name', 'Mobile', 'Plan', 'Start Date', 'End Date', 'Status'];
        const rows = members.map(m => [
            m.full_name || '',
            m.mobile || '',
            m.membership_type || '',
            m.membership_start || '',
            m.membership_end || '',
            getMemberStatus(m.membership_end).toUpperCase()
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `members_${todayIST()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV Exported Successfully! 📁');
    }, [members]);

    // WhatsApp helper
    const openWhatsApp = (mobile: string, name: string) => {
        const message = encodeURIComponent(`Hi ${name}, this is a reminder from Brother's Fitness! 💪`);
        window.open(`https://wa.me/91${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this member?')) return;

        try {
            const token = sessionStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/members?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete');
            await fetchMembers();
            toast.success('Member Deleted');
        } catch {
            toast.error('Failed to delete member');
            setError('Failed to delete member');
        }
    };

    // The form modal seeds its own fields from the member prop, so these
    // handlers just pick the mode + target and let MemberFormModal take over.
    const openNewMember = () => {
        setEditingMember(null);
        setRenewMode(false);
        setShowForm(true);
    };

    const handleEdit = (member: GymMember) => {
        setEditingMember(member);
        setRenewMode(false);
        setShowForm(true);
    };

    const handleRenew = (member: GymMember) => {
        setEditingMember(member);
        setRenewMode(true);
        setShowForm(true);
        toast.info(`Renewing membership for ${member.full_name}`);
    };

    const filteredMembers = useMemo(() => {
        // Server-side search results take precedence while a query is active;
        // otherwise fall back to the client list. The API filters name/mobile
        // via ILIKE, so no client-side fuzzy matching is needed.
        let searchResults = members;
        if (debouncedSearch.trim() && serverSearchResults) {
            searchResults = serverSearchResults;
        }

        // Apply status filter
        let filtered = searchResults.filter(m => {
            if (filterStatus === 'all') return true;
            if (filterStatus === 'incomplete') return true; // Pass all searched members to IncompleteProfiles component for internal filtering
            const status = getMemberStatus(m.membership_end);
            if (filterStatus === 'active') return status === 'active' || status === 'expiring';
            return status === filterStatus;
        });

        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'a-z':
                    return (a.full_name || '').localeCompare(b.full_name || '');
                case 'z-a':
                    return (b.full_name || '').localeCompare(a.full_name || '');
                case 'oldest':
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                case 'newest':
                default:
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
        });

        return filtered;
    }, [members, serverSearchResults, debouncedSearch, filterStatus, sortBy]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-20 overflow-x-hidden">
                {/* Header */}
                <div className="max-w-6xl mx-auto overflow-x-hidden">
                    <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Users className="w-6 h-6 text-gym-red" />
                                    Manage Dashboard
                                </h1>
                                <p className="text-gray-400 text-sm">Welcome back, Aman</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                            {/* Expiring Soon Toggle */}
                            <button
                                onClick={() => setShowExpiringSoon(!showExpiringSoon)}
                                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg border ${showExpiringSoon
                                    ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400'
                                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <AlertTriangle className={`w-4 h-4 ${showExpiringSoon ? 'fill-black stroke-black' : 'text-yellow-500'}`} />
                                Expiring Soon
                            </button>

                            <div className="w-px h-8 bg-white/10 mx-2" />

                            <button
                                onClick={() => setShowBulkMessage(true)}
                                className="bg-green-600/20 text-green-400 px-3 py-2 rounded hover:bg-green-600/30 transition-colors flex items-center gap-2"
                                title="Bulk WhatsApp"
                            >
                                <Send className="w-4 h-4" />
                                <span className="inline">Bulk Message</span>
                            </button>
                            <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className="bg-purple-600/20 text-purple-400 px-3 py-2 rounded hover:bg-purple-600/30 transition-colors flex items-center gap-2"
                                title="Analytics"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="inline">Analytics</span>
                            </button>
                            <button
                                onClick={() => setShowActivityLog(true)}
                                className="bg-orange-600/20 text-orange-400 px-3 py-2 rounded hover:bg-orange-600/30 transition-colors flex items-center gap-2"
                                title="Activity Log"
                            >
                                <Clock className="w-4 h-4" />
                                <span className="inline">History</span>
                            </button>
                            <button
                                onClick={() => setShowLeadsInbox(true)}
                                className="bg-pink-600/20 text-pink-400 px-3 py-2 rounded hover:bg-pink-600/30 transition-colors flex items-center gap-2 relative"
                                title="Leads Inbox"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="inline">Inbox</span>
                                {unreadLeadsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                        {unreadLeadsCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="bg-white/10 text-white px-3 py-2 rounded hover:bg-white/20 transition-colors flex items-center gap-2"
                                title="Export Members"
                            >
                                <Download className="w-4 h-4" />
                                <span className="inline">Export</span>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        toast.loading('Creating backup...', { id: 'backup' });
                                        const token = sessionStorage.getItem('admin_token');
                                        if (!token) throw new Error('No admin token found');

                                        const res = await fetch('/api/admin/backup', {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${token}` }
                                        });

                                        const data = await res.json();

                                        if (!res.ok) {
                                            if (res.status === 401) {
                                                toast.error('Session expired. Please login again.', { id: 'backup' });
                                                logout();
                                                router.push('/');
                                                return;
                                            }
                                            throw new Error(data.details || data.error || 'Backup failed');
                                        }

                                        // Download as file
                                        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = data.filename || 'backup.json';
                                        a.click();
                                        URL.revokeObjectURL(url);

                                        toast.success(`Backup created: ${data.total_members} members`, { id: 'backup' });
                                    } catch (err: unknown) {
                                        console.error('Backup error:', err);
                                        toast.error(`Backup failed: ${(err as Error).message}`, { id: 'backup' });
                                    }
                                }}
                                className="bg-blue-600/20 text-blue-400 px-3 py-2 rounded hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                                title="Backup Database"
                            >
                                <Shield className="w-4 h-4" />
                                <span className="inline">Backup</span>
                            </button>
                            <button
                                onClick={() => { logout(); router.push('/'); }}
                                className="bg-white/10 text-white px-3 py-2 rounded hover:bg-white/20 transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expiring Members Table - Controlled by Toggle */}
                {showExpiringSoon && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden mb-8"
                    >
                        <ExpiringMembersTable members={members} />
                    </motion.div>
                )}

                {/* Deployment Alerts (Birthdays Only) */}
                <DeploymentAlerts members={members} />

                {/* Analytics Panel */}
                {showAnalytics && (
                    <AnalyticsPanel
                        members={members}
                        onClose={() => setShowAnalytics(false)}
                    />
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-full">
                    <div className="glass-panel p-4 rounded-xl transition-all hover:bg-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Members</span>
                            <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-black">{stats.total}</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl transition-all hover:bg-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Active</span>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-2xl font-black text-green-400">{stats.active}</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl transition-all hover:bg-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Expiring Soon</span>
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="text-2xl font-black text-yellow-400">{stats.expiring}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Expire in &lt; 7 days</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl transition-all hover:bg-white/5">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Expired</span>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-2xl font-black text-red-500">{stats.expired}</div>
                    </div>
                    {/* Revenue Card */}
                    <div className="glass-panel-strong p-4 rounded-xl col-span-2 lg:col-span-4 relative overflow-hidden group transition-all hover:bg-white/5">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Estimated Revenue</span>
                            <IndianRupee className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-1 relative z-10">
                            <span className="text-base text-gray-500">₹</span>
                            {stats.revenue.total.toLocaleString('en-IN')}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3 text-[10px] text-gray-500 border-t border-white/10 pt-2 relative z-10">
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">15d</span>
                                ₹{stats.revenue.fifteenDays.toLocaleString('en-IN')}
                            </div>
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">Mo</span>
                                ₹{stats.revenue.monthly.toLocaleString('en-IN')}
                            </div>
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">Qr</span>
                                ₹{stats.revenue.quarterly.toLocaleString('en-IN')}
                            </div>
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">Hy</span>
                                ₹{stats.revenue.halfYearly.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>



                {/* Controls Area: Search + Add + Filter */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Row 1: Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Find member by name, mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red focus:bg-white/10 transition-colors"
                        />
                    </div>

                    {/* Row 2: Filter Tabs + Sort + New Member Button */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        {/* Filter Tabs */}
                        <div className="bg-white/5 p-1 rounded-lg flex border border-white/10 flex-shrink-0">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'active', label: 'Active' },
                                { id: 'expiring', label: 'Expiring' },
                                { id: 'expired', label: 'Expired' },
                                { id: 'incomplete', label: 'Incomplete' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id as FilterStatus)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${filterStatus === tab.id
                                        ? 'bg-gym-red text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown - White Arrow */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'a-z' | 'z-a')}
                            className="bg-black border border-white/20 rounded-lg px-3 py-2 pr-8 text-xs font-bold text-white focus:outline-none focus:border-gym-red cursor-pointer flex-shrink-0 appearance-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 8px center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            <option value="newest" className="bg-black text-white">Newest First</option>
                            <option value="oldest" className="bg-black text-white">Oldest First</option>
                            <option value="a-z" className="bg-black text-white">A → Z</option>
                            <option value="z-a" className="bg-black text-white">Z → A</option>
                        </select>


                        {/* New Member Button */}
                        <button
                            onClick={openNewMember}
                            className="bg-gym-red text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 flex-shrink-0 sm:ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-bold">New Member</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded mb-4 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Members Grid or Incomplete List */}
                {filterStatus === 'incomplete' ? (
                    <IncompleteProfiles
                        members={filteredMembers}
                        onEdit={handleEdit}
                    />
                ) : loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full skeleton" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 skeleton" />
                                        <div className="h-3 w-1/2 skeleton" />
                                        <div className="h-3 w-1/4 skeleton" />
                                    </div>
                                </div>
                                <div className="skeleton h-12 mb-4 rounded" />
                                <div className="flex gap-2">
                                    <div className="flex-1 h-9 skeleton rounded" />
                                    <div className="w-10 h-9 skeleton rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 border border-dashed border-white/10 rounded-xl">
                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-lg font-bold">No members found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMembers.map((member) => (
                            <MemberCard
                                key={member.id}
                                member={member}
                                onWhatsApp={openWhatsApp}
                                onRenew={handleRenew}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewPhoto={setSelectedImageUrl}
                                onReceipt={setReceiptMember}
                            />
                        ))}
                    </div>
                )}
            </div >

            {/* Add/Edit Form Modal */}
            <MemberFormModal
                open={showForm}
                member={editingMember}
                renew={renewMode}
                onClose={() => { setShowForm(false); setEditingMember(null); setRenewMode(false); }}
                onSaved={fetchMembers}
            />

            {/* Fullscreen Image Modal */}
            {
                selectedImageUrl && (
                    <div
                        className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
                        onClick={() => setSelectedImageUrl(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="relative max-w-md max-h-[80vh] w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={selectedImageUrl}
                                alt="Member Photo"
                                width={400}
                                height={600}
                                className="w-full h-auto object-contain rounded-xl shadow-2xl"
                            />
                            <button
                                onClick={() => setSelectedImageUrl(null)}
                                className="absolute -top-3 -right-3 bg-gym-red p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </motion.div>
                    </div>
                )
            }

            {/* Modals */}
            <ActivityLogPanel
                isOpen={showActivityLog}
                onClose={() => setShowActivityLog(false)}
            />
            <LeadsInbox
                isOpen={showLeadsInbox}
                onClose={() => setShowLeadsInbox(false)}
            />

            {showBulkMessage && (
                <BulkMessageModal
                    members={filteredMembers}
                    onClose={() => setShowBulkMessage(false)}
                />
            )}

            {/* PDF Receipt Modal */}
            {receiptMember && (
                <MemberReceiptModal
                    member={receiptMember}
                    onClose={() => setReceiptMember(null)}
                />
            )}
        </>
    );
}
