"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import { PLAN_PRICES, WHATSAPP_COUNTRY_CODE } from '@/lib/config';
import { todayIST, getMemberStatus, getDaysUntil } from '@/lib/member-utils';
import MemberCard from '@/components/admin/MemberCard';
import MemberFormModal from '@/components/admin/MemberFormModal';
import MemberReceiptModal from '@/components/admin/MemberReceiptModal';

const BulkMessageModal = dynamic(() => import('@/components/admin/BulkMessageModal'), {
    loading: () => <div className="fixed inset-0 bg-black/50 z-[60]" />
});

const AnalyticsPanel = dynamic(() => import('@/components/admin/AnalyticsPanel'), {
    loading: () => <div className="h-64 skeleton mb-6" />
});

const ActivityLogPanel = dynamic(() => import('@/components/admin/ActivityLogPanel'));
const LeadsInbox = dynamic(() => import('@/components/admin/LeadsInbox'));
import DeploymentAlerts from '@/components/admin/DeploymentAlerts';
const ExpiringMembersTable = dynamic(() => import('@/components/admin/ExpiringMembersTable'), {
    loading: () => <div className="h-48 skeleton mb-8" />
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
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [receiptMember, setReceiptMember] = useState<GymMember | null>(null);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showLeadsInbox, setShowLeadsInbox] = useState(false);
    const [unreadLeadsCount, setUnreadLeadsCount] = useState(0);
    const [showExpiringSoon, setShowExpiringSoon] = useState(false);

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
                // L43: corrupt localStorage value would throw and abort the
                // whole fetch, leaving the unread count stale forever.
                let readLeads: string[] = [];
                try {
                    readLeads = JSON.parse(localStorage.getItem('brofit_admin_read_leads') || '[]');
                } catch {
                    // Corrupt value — treat as no read leads (all unread).
                }
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

    const fetchMembers = useCallback(async () => {
        try {
            const token = sessionStorage.getItem('admin_token');
            const res = await fetch('/api/admin/members', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // M14: expired token silently showed an empty grid — redirect to
            // login instead.
            if (res.status === 401 || res.status === 403) {
                sessionStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    }, [router]);

    // Fetch members
    useEffect(() => {
        if (isAdmin) {
            fetchMembers();
        }
    }, [isAdmin, fetchMembers]);

    // Calculate Stats with Birthday, Expiry Alerts, and Analytics
    const stats = useMemo(() => {
        const total = members.length;
        const expired = members.filter(m => getMemberStatus(m.membership_end) === 'expired').length;
        const expiring = members.filter(m => getMemberStatus(m.membership_end) === 'expiring').length;
        const active = total - expired - expiring;

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
            // L46: match the full date, not just month+day — otherwise a
            // membership that expired a year ago on this date still flags.
            return end.getFullYear() === today.getFullYear() &&
                end.getMonth() === todayMonth && end.getDate() === todayDate;
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

        // Neutralize CSV injection: Excel treats leading = + - @ as formulas.
        // A tab prefix neutralises the formula without affecting display.
        const safeCell = (val: string) => {
            const escaped = val.replace(/"/g, '""');
            return /^[=+\-@\t\r\n]/.test(escaped) ? `\t${escaped}` : `"${escaped}"`;
        };

        const rows = members.map(m => [
            m.full_name || '',
            m.mobile || '',
            m.membership_type || '',
            m.membership_start || '',
            m.membership_end || '',
            getMemberStatus(m.membership_end).toUpperCase()
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.map(safeCell).join(','))].join('\n');
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
        // L44: use the config country code AND dedup it so a stored "91xxx"
        // number doesn't become "9191xxx".
        const digits = mobile.replace(/\D/g, '');
        const number = digits.startsWith(WHATSAPP_COUNTRY_CODE) ? digits : WHATSAPP_COUNTRY_CODE + digits;
        window.open(`https://wa.me/${number}?text=${message}`, '_blank');
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
            <div className="min-h-[100svh] surface-canvas flex items-center justify-center">
                <div className="text-hi">Loading...</div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <>
            <Navbar />
            <div className="min-h-[100svh] surface-canvas text-hi p-4 md:p-8 pb-20 overflow-x-hidden">
                {/* Header */}
                <div className="max-w-6xl mx-auto overflow-x-hidden">
                    <div className="flex justify-between items-center mb-8 hairline-b pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="heading-display text-2xl uppercase flex items-center gap-2">
                                    <Users className="w-6 h-6 text-accent" />
                                    Manage Dashboard
                                </h1>
                                {/* L45: no admin identity exists in the password-only
                                    auth system, so avoid a hardcoded name that would
                                    mislabel any other admin who logs in. */}
                                <p className="text-low text-sm">Welcome back</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                            {/* Expiring Soon Toggle */}
                            <button
                                onClick={() => setShowExpiringSoon(!showExpiringSoon)}
                                className={`px-4 py-2 font-bold transition-colors duration-fast flex items-center gap-2 border ${showExpiringSoon
                                    ? 'bg-status-warning text-status-on border-status-warning'
                                    : 'surface-card hairline text-hi hover:border-accent'
                                    }`}
                            >
                                <AlertTriangle className={`w-4 h-4 ${showExpiringSoon ? 'fill-black stroke-black' : 'text-status-warning'}`} />
                                Expiring Soon
                            </button>

                            <div className="w-px h-8 surface-border mx-2" />

                            <button
                                onClick={() => setShowBulkMessage(true)}
                                className="surface-card hairline text-status-success px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2"
                                title="Bulk WhatsApp"
                            >
                                <Send className="w-4 h-4" />
                                <span className="inline">Bulk Message</span>
                            </button>
                            <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className="surface-card hairline text-status-info px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2"
                                title="Analytics"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="inline">Analytics</span>
                            </button>
                            <button
                                onClick={() => setShowActivityLog(true)}
                                className="surface-card hairline text-status-warning px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2"
                                title="Activity Log"
                            >
                                <Clock className="w-4 h-4" />
                                <span className="inline">History</span>
                            </button>
                            <button
                                onClick={() => setShowLeadsInbox(true)}
                                className="surface-card hairline text-accent px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2 relative"
                                title="Leads Inbox"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="inline">Inbox</span>
                                {unreadLeadsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadLeadsCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="surface-card hairline text-hi px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2"
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
                                className="surface-card hairline text-status-info px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2"
                                title="Backup Database"
                            >
                                <Shield className="w-4 h-4" />
                                <span className="inline">Backup</span>
                            </button>
                            <button
                                onClick={() => { logout(); router.push('/'); }}
                                className="surface-card hairline text-hi px-3 py-2 hover:border-accent transition-colors duration-fast flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expiring Members Table - Controlled by Toggle */}
                {showExpiringSoon && (
                    <div className="mb-8">
                        <ExpiringMembersTable members={members} />
                    </div>
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
                    <div className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast">
                        <div className="flex justify-between items-start mb-2">
                            <span className="label-text text-faint uppercase tracking-widest">Total Members</span>
                            <Users className="w-4 h-4 text-status-info" />
                        </div>
                        <div className="heading-section text-2xl text-hi">{stats.total}</div>
                    </div>
                    <div className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast">
                        <div className="flex justify-between items-start mb-2">
                            <span className="label-text text-faint uppercase tracking-widest">Active</span>
                            <CheckCircle className="w-4 h-4 text-status-success" />
                        </div>
                        <div className="heading-section text-2xl text-status-success">{stats.active}</div>
                    </div>
                    <div className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast">
                        <div className="flex justify-between items-start mb-2">
                            <span className="label-text text-faint uppercase tracking-widest">Expiring Soon</span>
                            <AlertTriangle className="w-4 h-4 text-status-warning" />
                        </div>
                        <div className="heading-section text-2xl text-status-warning">{stats.expiring}</div>
                        <div className="label-text text-faint text-[10px] mt-1">Expire in &lt; 7 days</div>
                    </div>
                    <div className="surface-card hairline p-4 hover:border-accent transition-colors duration-fast">
                        <div className="flex justify-between items-start mb-2">
                            <span className="label-text text-faint uppercase tracking-widest">Expired</span>
                            <AlertCircle className="w-4 h-4 text-status-danger" />
                        </div>
                        <div className="heading-section text-2xl text-status-danger">{stats.expired}</div>
                    </div>
                    {/* Revenue Card */}
                    <div className="surface-elevated hairline p-4 col-span-2 lg:col-span-4 relative overflow-hidden group hover:border-accent transition-colors duration-fast">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="label-text text-faint uppercase tracking-widest">Estimated Revenue</span>
                            <IndianRupee className="w-4 h-4 text-status-success" />
                        </div>
                        <div className="heading-section text-2xl text-status-success flex items-baseline gap-1 relative z-10">
                            <span className="text-base text-faint">₹</span>
                            {stats.revenue.total.toLocaleString('en-IN')}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3 text-[10px] text-faint hairline-t pt-2 relative z-10">
                            <div>
                                <span className="block label-text text-low mb-0.5">15d</span>
                                ₹{stats.revenue.fifteenDays.toLocaleString('en-IN')}
                            </div>
                            <div>
                                <span className="block label-text text-low mb-0.5">Mo</span>
                                ₹{stats.revenue.monthly.toLocaleString('en-IN')}
                            </div>
                            <div>
                                <span className="block label-text text-low mb-0.5">Qr</span>
                                ₹{stats.revenue.quarterly.toLocaleString('en-IN')}
                            </div>
                            <div>
                                <span className="block label-text text-low mb-0.5">Hy</span>
                                ₹{stats.revenue.halfYearly.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Area: Search + Add + Filter */}
                <div className="flex flex-col gap-4 mb-6">
                    {/* Row 1: Search */}
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                        <input
                            type="text"
                            placeholder="Find member by name, mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-9 pr-4"
                        />
                    </div>

                    {/* Row 2: Filter Tabs + Sort + New Member Button */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        {/* Filter Tabs */}
                        <div className="surface-card hairline p-1 flex flex-shrink-0">
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
                                    className={`px-3 py-1.5 text-xs font-bold transition-colors duration-fast ${filterStatus === tab.id
                                        ? 'bg-accent text-white'
                                        : 'text-faint hover:text-hi hover:bg-surface-elevated'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'a-z' | 'z-a')}
                            className="input-field px-3 py-2 pr-8 text-xs font-bold flex-shrink-0 cursor-pointer appearance-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 8px center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            <option value="newest" className="surface-canvas text-hi">Newest First</option>
                            <option value="oldest" className="surface-canvas text-hi">Oldest First</option>
                            <option value="a-z" className="surface-canvas text-hi">A → Z</option>
                            <option value="z-a" className="surface-canvas text-hi">Z → A</option>
                        </select>


                        {/* New Member Button */}
                        <button
                            onClick={openNewMember}
                            className="btn-primary flex-shrink-0 sm:ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-bold">New Member</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="surface-card hairline border-status-danger text-status-danger label-text p-3 mb-4 flex items-center gap-2">
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
                            <div key={i} className="surface-card hairline p-4">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 skeleton shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 skeleton" />
                                        <div className="h-3 w-1/2 skeleton" />
                                        <div className="h-3 w-1/4 skeleton" />
                                    </div>
                                </div>
                                <div className="skeleton h-12 mb-4" />
                                <div className="flex gap-2">
                                    <div className="flex-1 h-9 skeleton" />
                                    <div className="w-10 h-9 skeleton" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-20 text-low border border-dashed border-surface-border">
                        <div className="surface-card hairline w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-faint" />
                        </div>
                        <p className="heading-section text-lg text-hi">No members found</p>
                        <p className="text-sm text-low">Try adjusting your search or filters.</p>
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
                        className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4 modal-overlay-in"
                        onClick={() => setSelectedImageUrl(null)}
                    >
                        <div
                            className="relative max-w-md max-h-[80vh] w-full modal-panel-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={selectedImageUrl}
                                alt="Member Photo"
                                width={400}
                                height={600}
                                className="w-full h-auto object-contain"
                            />
                            <button
                                onClick={() => setSelectedImageUrl(null)}
                                className="absolute -top-3 -right-3 bg-accent p-2 hover:bg-accent-hover transition-colors duration-fast"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
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
