"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Plus, Search, Edit2, Trash2, Camera, X, Save,
    User, Phone, Shield,
    Users, LogOut, TrendingUp, AlertTriangle, AlertCircle, CheckCircle,
    Download, MessageCircle, IndianRupee, FileText, Send, Gift, BarChart3,
    Clock, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/lib/auth-context';
import type { GymMember } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { PLAN_PRICES } from '@/lib/config';
import imageCompression from 'browser-image-compression';
import fuzzysort from 'fuzzysort';

const BulkMessageModal = dynamic(() => import('@/components/admin/BulkMessageModal'), {
    loading: () => <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
});

const AnalyticsPanel = dynamic(() => import('@/components/admin/AnalyticsPanel'), {
    loading: () => <div className="h-64 bg-white/5 animate-pulse rounded-xl mb-6" />
});

const ActivityLogPanel = dynamic(() => import('@/components/admin/ActivityLogPanel'));
const LeadsInbox = dynamic(() => import('@/components/admin/LeadsInbox'));
import DeploymentAlerts from '@/components/admin/DeploymentAlerts';

// Helper to calculate status
const getMemberStatus = (endDateString: string | null) => {
    if (!endDateString) return 'active';
    const end = new Date(endDateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring';
    return 'active';
};

// Date formatter helper - DD/Mon/YYYY format
const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Days until date helper
const getDaysUntil = (dateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setFullYear(today.getFullYear()); // Use current year for comparison
    if (target < today) target.setFullYear(today.getFullYear() + 1); // Next year if passed
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default function MembersPage() {
    const router = useRouter();
    const { isAdmin, isLoading, logout } = useAdmin();
    const [members, setMembers] = useState<GymMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState<GymMember | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z' | 'z-a'>('newest');
    const [error, setError] = useState('');
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [showBulkMessage, setShowBulkMessage] = useState(false);
    // const [bulkMessageText, setBulkMessageText] = useState(''); // Removed unused state
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [receiptMember, setReceiptMember] = useState<GymMember | null>(null);
    // const [searchTerm, setSearchTerm] = useState(''); // Removed unused state
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showLeadsInbox, setShowLeadsInbox] = useState(false);
    const [unreadLeadsCount, setUnreadLeadsCount] = useState(0);

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
    // Form state
    const [formData, setFormData] = useState<Partial<GymMember>>({
        full_name: '',
        email: '',
        mobile: '',
        address: '',
        date_of_birth: '',
        gender: 'Male',
        height_cm: null,
        weight_kg: null,
        membership_type: 'Monthly',
        membership_start: new Date().toISOString().split('T')[0],
        membership_end: '',
        emergency_contact: '',
        notes: ''
    });

    // Auto-calculate end date when start date or type changes
    useEffect(() => {
        if (formData.membership_start && formData.membership_type) {
            const start = new Date(formData.membership_start);
            let daysToAdd = 30; // Default Monthly

            switch (formData.membership_type) {
                case '15 Days':
                    daysToAdd = 15;
                    break;
                case '1 Month':
                case 'Monthly': // Legacy support
                    daysToAdd = 30;
                    break;
                case '3 Months':
                case 'Quarterly': // Legacy support
                    daysToAdd = 90;
                    break;
                case '6 Months':
                case 'Half-Yearly': // Legacy support
                    daysToAdd = 180;
                    break;
            }

            start.setDate(start.getDate() + daysToAdd);
            setFormData(prev => ({
                ...prev,
                membership_end: start.toISOString().split('T')[0]
            }));
        }
    }, [formData.membership_start, formData.membership_type]);

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


    // Export members to CSV
    const exportToCSV = useCallback(() => {
        const headers = ['Name', 'Mobile', 'Email', 'Plan', 'Start Date', 'End Date', 'Status'];
        const rows = members.map(m => [
            m.full_name || '',
            m.mobile || '',
            m.email || '',
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
        a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV Exported Successfully! 📁');
    }, [members]);

    // WhatsApp helper
    const openWhatsApp = (mobile: string, name: string) => {
        const message = encodeURIComponent(`Hi ${name}, this is a reminder from Brother's Fitness! 💪`);
        window.open(`https://wa.me/91${mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadPhoto = async (memberId: string): Promise<string | null> => {
        if (!photoFile) return null;

        try {
            console.log('Original size:', (photoFile.size / 1024 / 1024).toFixed(2), 'MB');

            const options = {
                maxSizeMB: 0.5, // Compress to ~500KB
                maxWidthOrHeight: 1200,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(photoFile, options);
            console.log('Compressed size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('memberId', memberId);

            const token = sessionStorage.getItem('admin_token');
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            return data.url || null;
        } catch (err) {
            console.error('Photo upload failed:', err);
            return null;
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError('');

        try {
            let photoUrl = editingMember?.photo_url || null;

            if (photoFile) {
                // Use member ID if editing, otherwise use timestamp to ensure uniqueness
                const uploadId = editingMember?.id || Date.now().toString();
                photoUrl = await uploadPhoto(uploadId);
            }

            const memberData = {
                ...formData,
                // Fields are already numbers or null in the state
                height_cm: formData.height_cm,
                weight_kg: formData.weight_kg,
                photo_url: photoUrl
            };

            const token = sessionStorage.getItem('admin_token');
            const res = await fetch('/api/admin/members', {
                method: editingMember ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingMember ? { id: editingMember.id, ...memberData } : memberData)
            });

            if (!res.ok) throw new Error('Failed to save member');

            // Close popup IMMEDIATELY before fetching
            resetForm();
            toast.success(editingMember ? 'Member Updated Successfully! ✅' : 'Member Registered! 🚀');

            // Fetch members in background
            fetchMembers();
        } catch {
            toast.error('Failed to save member. Please try again.');
            setError('Failed to save member. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
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

    const handleEdit = (member: GymMember) => {
        setEditingMember(member);
        setFormData({
            full_name: member.full_name || '',
            email: member.email || '',
            mobile: member.mobile || '',
            address: member.address || '',
            date_of_birth: member.date_of_birth || '',
            gender: member.gender || 'Male',
            height_cm: member.height_cm,
            weight_kg: member.weight_kg,
            membership_type: member.membership_type || 'Monthly',
            membership_start: member.membership_start || new Date().toISOString().split('T')[0],
            membership_end: member.membership_end || '',
            emergency_contact: member.emergency_contact || '',
            notes: member.notes || ''
        });
        setPhotoPreview(member.photo_url);
        setShowForm(true);
    };

    const handleRenew = (member: GymMember) => {
        setEditingMember(member);
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            full_name: member.full_name || '',
            email: member.email || '',
            mobile: member.mobile || '',
            address: member.address || '',
            date_of_birth: member.date_of_birth || '',
            gender: member.gender || 'Male',
            height_cm: member.height_cm,
            weight_kg: member.weight_kg,
            membership_type: member.membership_type || 'Monthly',
            membership_start: today, // Start from today
            membership_end: '', // Will be calculated by useEffect
            emergency_contact: member.emergency_contact || '',
            notes: member.notes || ''
        });
        setPhotoPreview(member.photo_url);
        setShowForm(true);
        toast.info(`Renewing membership for ${member.full_name}`);
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            mobile: '',
            address: '',
            date_of_birth: '',
            gender: 'Male',
            height_cm: null,
            weight_kg: null,
            membership_type: 'Monthly',
            membership_start: new Date().toISOString().split('T')[0],
            membership_end: '',
            emergency_contact: '',
            notes: ''
        });
        setEditingMember(null);
        setPhotoPreview(null);
        setPhotoFile(null);
        setShowForm(false);
    };

    const filteredMembers = useMemo(() => {
        // Apply fuzzy search if there's a query
        let searchResults = members;
        if (debouncedSearch.trim()) {
            const results = fuzzysort.go(debouncedSearch, members, {
                keys: ['full_name', 'mobile', 'email'],
                threshold: -10000, // Lower = more lenient
                limit: 100
            });
            searchResults = results.map(r => r.obj);
        }

        // Apply status filter
        let filtered = searchResults.filter(m => {
            const status = getMemberStatus(m.membership_end);
            if (filterStatus === 'all') return true;
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
    }, [members, debouncedSearch, filterStatus, sortBy]);

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

                {/* Birthday & Expiry Alerts */}
                {(stats.alerts.birthdays.length > 0 || stats.alerts.expiringToday.length > 0 || stats.alerts.upcomingBirthdays.length > 0) && (
                    <div className="mb-6 space-y-3">
                        {stats.alerts.birthdays.length > 0 && (
                            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4 flex items-start gap-3">
                                <div className="text-3xl">🎂</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-pink-300 mb-1">Birthday Today!</h3>
                                    <p className="text-sm text-gray-300 mb-2">
                                        {stats.alerts.birthdays.map(m => m.full_name).join(', ')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {stats.alerts.birthdays.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    const msg = encodeURIComponent(`🎂 Happy Birthday ${m.full_name}! 🎉\n\nWishing you strength, health, and gains! May this year bring you closer to all your fitness goals! 💪\n\n- Brother's Fitness Family`);
                                                    window.open(`https://wa.me/91${m.mobile?.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                                }}
                                                className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                <MessageCircle className="w-3 h-3" /> Wish {m.full_name?.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {stats.alerts.expiringToday.length > 0 && (
                            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                <div className="text-3xl">⏰</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-300 mb-1">
                                        {stats.alerts.expiringToday.length} Membership{stats.alerts.expiringToday.length > 1 ? 's' : ''} Expiring Today
                                    </h3>
                                    <p className="text-sm text-gray-300 mb-2">
                                        {stats.alerts.expiringToday.map(m => m.full_name).join(', ')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {stats.alerts.expiringToday.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    const msg = encodeURIComponent(`Hi ${m.full_name}! 👋\n\nYour Brother's Fitness membership expires TODAY. Renew now to continue your fitness journey without interruption! 💪\n\nVisit us or reply to renew.\n\n- Brother's Fitness`);
                                                    window.open(`https://wa.me/91${m.mobile?.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                                }}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                <MessageCircle className="w-3 h-3" /> Remind {m.full_name?.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {stats.alerts.upcomingBirthdays.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
                                <div className="text-3xl"><Gift className="w-8 h-8 text-purple-400" /></div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-purple-300 mb-1">🎁 Upcoming Birthdays (Next 7 Days)</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {stats.alerts.upcomingBirthdays.map(m => (
                                            <span key={m.id} className="bg-purple-500/20 text-purple-200 px-2 py-1 rounded text-xs">
                                                {m.full_name} <span className="text-purple-400">({m.daysUntil}d)</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Deployment Alerts (Tactical) */}
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
                                { id: 'expired', label: 'Expired' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id as 'all' | 'active' | 'expiring' | 'expired')}
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
                            onClick={() => { setShowForm(true); setEditingMember(null); }}
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

                {/* Members Grid */}
                {loading ? (
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
                        {filteredMembers.map((member) => {
                            const status = getMemberStatus(member.membership_end);
                            const statusColors = {
                                active: "text-green-400 bg-green-400/10 border-green-400/20",
                                expiring: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                                expired: "text-red-400 bg-red-400/10 border-red-400/20"
                            };

                            return (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    layout
                                    className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 hover:border-gym-red/40 transition-all group"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="relative w-14 h-14 bg-white/5 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer hover:ring-2 hover:ring-gym-red transition-all" onClick={() => member.photo_url && setSelectedImageUrl(member.photo_url)}>
                                            {member.photo_url ? (
                                                <Image src={member.photo_url} alt={member.full_name} fill className="object-cover" sizes="56px" />
                                            ) : (
                                                <User className="w-7 h-7 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-base truncate pr-2">{member.full_name}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[status]}`}>
                                                    {status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3 h-3" /> {member.mobile}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-300 border border-white/5">
                                                    {member.membership_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 rounded p-2 mb-4 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Started:</span>
                                            <span className="text-gray-300 font-mono">{formatDate(member.membership_start)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Ends:</span>
                                            <span className={`font-mono font-bold ${status === 'expired' ? 'text-red-400' : 'text-white'}`}>
                                                {formatDate(member.membership_end)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => member.mobile && openWhatsApp(member.mobile, member.full_name || '')}
                                            className="w-10 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors flex items-center justify-center"
                                            title="WhatsApp Reminder"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                        {status === 'expired' && (
                                            <button
                                                onClick={() => handleRenew(member)}
                                                className="bg-gym-red text-white px-3 py-2 rounded font-bold text-xs hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-lg shadow-red-900/20"
                                                title="Renew Subscription"
                                            >
                                                Renew
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(member)}
                                            className="flex-1 bg-white/5 text-gray-300 py-2 rounded text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Manage
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="w-10 bg-white/5 text-gray-400 rounded hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setReceiptMember(member)}
                                            className="w-10 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors flex items-center justify-center"
                                            title="Generate Receipt"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div >

            {/* Add/Edit Form Modal */}
            {
                showForm && (
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="bg-zinc-900/50 border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-gym-red" />
                                    {editingMember ? 'Edit Member Details' : 'Register New Member'}
                                </h2>
                                <button onClick={resetForm} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                                <form id="memberForm" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Photo Section */}
                                    <div className="space-y-4">
                                        {/* Photo Preview */}
                                        <div className="flex justify-center">
                                            <div className="relative w-32 h-32 bg-zinc-900 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                {photoPreview ? (
                                                    <Image
                                                        src={photoPreview}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover"
                                                        sizes="128px"
                                                    />
                                                ) : (
                                                    <div className="text-center text-gray-500">
                                                        <Camera className="w-10 h-10 mx-auto mb-1 opacity-50" />
                                                        <span className="text-xs uppercase font-bold">Photo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Large Visible Upload Buttons */}
                                        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                            <button
                                                type="button"
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500/40 hover:border-blue-500 text-white py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                                            >
                                                <Camera className="w-8 h-8" />
                                                <span className="text-sm font-bold uppercase tracking-wider">Open Camera</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => galleryInputRef.current?.click()}
                                                className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/40 hover:border-purple-500 text-white py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                                            >
                                                <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-white/50 rounded-sm" />
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-wider">Open Gallery</span>
                                            </button>
                                        </div>

                                        {/* Hidden Inputs */}
                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoCapture}
                                            className="hidden"
                                        />
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoCapture}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                                                <User className="w-3.5 h-3.5" /> Personal Info
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                        placeholder="e.g. Rahul Sharma"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Mobile Number *</label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={formData.mobile || ''}
                                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                        placeholder="10-digit mobile"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email || ''}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Date of Birth *</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.date_of_birth || ''}
                                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-4">
                                            <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                                                <TrendingUp className="w-3.5 h-3.5" /> Membership Details
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Plan Type</label>
                                                    <select
                                                        className="hidden" // Keep hidden select for form logic if needed, but we use buttons
                                                        value={formData.membership_type || 'Monthly'}
                                                        onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
                                                    >
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                        <option value="Half-Yearly">Half-Yearly</option>
                                                    </select>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        {[
                                                            { id: '15 Days', label: '15 Days', price: `₹${PLAN_PRICES['15 Days']}` },
                                                            { id: '1 Month', label: 'Monthly', price: `₹${PLAN_PRICES['1 Month']}` },
                                                            { id: '3 Months', label: 'Quarterly', price: `₹${PLAN_PRICES['3 Months']}` },
                                                            { id: '6 Months', label: 'Half-Yearly', price: `₹${PLAN_PRICES['6 Months']}` }
                                                        ].map(plan => (
                                                            <button
                                                                key={plan.id}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, membership_type: plan.id })}
                                                                className={`border rounded-lg p-2 text-center transition-all ${formData.membership_type === plan.id
                                                                    ? 'bg-gym-red border-gym-red text-white shadow-lg shadow-red-900/20'
                                                                    : 'bg-black border-white/20 text-gray-400 hover:border-white/40'
                                                                    }`}
                                                            >
                                                                <div className="text-[10px] font-bold uppercase tracking-wider">{plan.label}</div>
                                                                <div className="text-sm font-black">{plan.price}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between">
                                                        <label className="block text-xs font-medium text-gray-300 mb-1.5">Start Date</label>
                                                        <span className="text-[10px] text-gray-500 pt-0.5">Ends: {formData.membership_end}</span>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.membership_start || ''}
                                                        onChange={(e) => setFormData({ ...formData, membership_start: e.target.value })}
                                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Gender *</label>
                                                <select
                                                    required
                                                    value={formData.gender || 'Male'}
                                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Height (cm) *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.height_cm || ''}
                                                    onChange={e => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || null })}
                                                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                                    placeholder="e.g. 175"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Weight (kg) *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.weight_kg || ''}
                                                    onChange={e => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || null })}
                                                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                                    placeholder="e.g. 75"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Address / Notes (Optional)</label>
                                            <textarea
                                                value={formData.address || ''}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                rows={2}
                                                className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                placeholder="Optional: Enter address or notes..."
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Emergency Contact</label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_contact || ''}
                                                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
                                                className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                placeholder="Name & Number"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-4 border-t border-white/10 bg-zinc-900/50 shrink-0 flex gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={isSubmitting}
                                    className="flex-1 border border-white/10 bg-white/5 py-3 rounded-lg text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="memberForm"
                                    disabled={isSubmitting}
                                    className="flex-[2] bg-gym-red py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {photoFile ? 'Uploading Photo...' : 'Registering...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            {editingMember ? 'Update Member Profile' : 'Register Member'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
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
            {
                receiptMember && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setReceiptMember(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white text-black rounded-xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-4">
                                <h2 className="text-2xl font-black text-gym-red">BROTHER&apos;S FITNESS</h2>
                                <p className="text-xs text-gray-500">Pain is Temporary. Pride is Forever.</p>
                            </div>
                            <div className="border-t border-b border-gray-200 py-4 my-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Member:</span>
                                    <span className="font-bold">{receiptMember.full_name}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Mobile:</span>
                                    <span>{receiptMember.mobile}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Plan:</span>
                                    <span className="font-bold">{receiptMember.membership_type}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Valid From:</span>
                                    <span>{formatDate(receiptMember.membership_start)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Valid Until:</span>
                                    <span>{formatDate(receiptMember.membership_end)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-bold">Amount Paid:</span>
                                <span className="text-2xl font-black text-gym-red">
                                    ₹{(PLAN_PRICES as Record<string, number>)[receiptMember.membership_type || '1 Month']?.toLocaleString('en-IN') || '0'}
                                </span>
                            </div>
                            <div className="text-center text-xs text-gray-400 mb-4">
                                Receipt Date: {formatDate(new Date().toISOString())}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        const amount = (PLAN_PRICES as Record<string, number>)[receiptMember.membership_type || '1 Month'] || 0;
                                        const message = `🏋️ *BROTHER'S FITNESS RECEIPT*%0A%0A👤 Member: ${receiptMember.full_name}%0A📱 Mobile: ${receiptMember.mobile}%0A📋 Plan: ${receiptMember.membership_type}%0A📅 Valid: ${formatDate(receiptMember.membership_start)} to ${formatDate(receiptMember.membership_end)}%0A💰 Amount: ₹${amount}%0A%0A_Pain is Temporary. Pride is Forever._ 💪`;
                                        window.open(`https://wa.me/91${receiptMember.mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
                                        toast.success('Receipt sent via WhatsApp!');
                                        setReceiptMember(null);
                                    }}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                                </button>
                                <button
                                    onClick={() => setReceiptMember(null)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </>
    );
}
