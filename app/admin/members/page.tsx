"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Plus, Search, Edit2, Trash2, Camera, X, Save,
    User, Phone, Mail, MapPin, Calendar, Ruler, Weight, Shield,
    Users, LogOut, TrendingUp, AlertTriangle, AlertCircle, CheckCircle,
    Download, MessageCircle, IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/lib/auth-context';
import type { GymMember } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

// Helper to calculate status
const getMemberStatus = (endDateString: string | null) => {
    if (!endDateString) return 'active';
    const end = new Date(endDateString);
    const now = new Date();
    // Reset hours for accurate date comparison
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring';
    return 'active';
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
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        mobile: '',
        address: '',
        date_of_birth: '',
        gender: 'Male',
        height_cm: '',
        weight_kg: '',
        membership_type: 'Monthly',
        membership_start: new Date().toISOString().split('T')[0], // Default to today
        membership_end: '',
        emergency_contact: '',
        notes: ''
    });

    // Auto-calculate end date when start date or type changes
    useEffect(() => {
        if (formData.membership_start && formData.membership_type) {
            const start = new Date(formData.membership_start);
            let daysToAdd = 30; // Default Monthly

            if (formData.membership_type === 'Quarterly') daysToAdd = 90;
            if (formData.membership_type === 'Half-Yearly') daysToAdd = 180;
            if (formData.membership_type === 'Yearly') daysToAdd = 365;

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
            const res = await fetch('/api/admin/members');
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

    // Calculate Stats
    // Calculate Stats with Birthday and Expiry Alerts
    const stats = useMemo(() => {
        const total = members.length;
        const expired = members.filter(m => getMemberStatus(m.membership_end) === 'expired').length;
        const expiring = members.filter(m => getMemberStatus(m.membership_end) === 'expiring').length;
        const active = total - expired;

        // Revenue Calculation (Fixed Pricing Model)
        let monthly = 0, quarterly = 0, halfYearly = 0;
        members.forEach(m => {
            if (m.membership_type === 'Monthly') monthly += 700;
            if (m.membership_type === 'Quarterly') quarterly += 1800;
            if (m.membership_type === 'Half-Yearly') halfYearly += 3300;
        });
        const totalRevenue = monthly + quarterly + halfYearly;

        // Birthday & Expiry Alerts
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        const birthdays = members.filter(m => {
            if (!m.date_of_birth) return false;
            const dob = new Date(m.date_of_birth);
            return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
        });

        const expiringToday = members.filter(m => {
            if (!m.membership_end) return false;
            const end = new Date(m.membership_end);
            return end.getMonth() === todayMonth && end.getDate() === todayDate;
        });

        return {
            total, active, expiring, expired,
            revenue: { monthly, quarterly, halfYearly, total: totalRevenue },
            alerts: { birthdays, expiringToday }
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
            setShowImageOptions(false);
        }
    };

    const uploadPhoto = async (memberId: string): Promise<string | null> => {
        if (!photoFile) return null;

        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('memberId', memberId);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            return data.url || null;
        } catch {
            console.error('Photo upload failed');
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
                weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
                photo_url: photoUrl
            };

            const res = await fetch('/api/admin/members', {
                method: editingMember ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingMember ? { id: editingMember.id, ...memberData } : memberData)
            });

            if (!res.ok) throw new Error('Failed to save member');

            await fetchMembers();
            resetForm();
            toast.success(editingMember ? 'Member Updated Successfully! ✅' : 'Member Registered! 🚀');
        } catch {
            toast.error('Failed to save member. Please try again.');
            setError('Failed to save member. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this member?')) return;

        try {
            const res = await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
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
            height_cm: member.height_cm?.toString() || '',
            weight_kg: member.weight_kg?.toString() || '',
            membership_type: member.membership_type || 'Monthly',
            membership_start: member.membership_start || new Date().toISOString().split('T')[0],
            membership_end: member.membership_end || '',
            emergency_contact: member.emergency_contact || '',
            notes: member.notes || ''
        });
        setPhotoPreview(member.photo_url);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            mobile: '',
            address: '',
            date_of_birth: '',
            gender: 'Male',
            height_cm: '',
            weight_kg: '',
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

    const filteredMembers = members.filter(m => {
        const matchesSearch = (
            m.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            m.mobile?.includes(debouncedSearch) ||
            m.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );

        if (!matchesSearch) return false;

        const status = getMemberStatus(m.membership_end);
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return status === 'active' || status === 'expiring';
        return status === filterStatus;
    });

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
            <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-20">
                {/* Header */}
                <div className="max-w-6xl mx-auto">
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
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={exportToCSV}
                                className="bg-white/10 text-white px-3 py-2 rounded hover:bg-white/20 transition-colors flex items-center gap-2"
                                title="Export Members"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button
                                onClick={() => { logout(); router.push('/'); }}
                                className="bg-white/10 text-white px-3 py-2 rounded hover:bg-white/20 transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Birthday & Expiry Alerts */}
                {(stats.alerts.birthdays.length > 0 || stats.alerts.expiringToday.length > 0) && (
                    <div className="mb-6 space-y-3">
                        {stats.alerts.birthdays.length > 0 && (
                            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4 flex items-start gap-3">
                                <div className="text-3xl">🎂</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-pink-300 mb-1">Birthday Today!</h3>
                                    <p className="text-sm text-gray-300">
                                        {stats.alerts.birthdays.map(m => m.full_name).join(', ')} - Wish them a happy birthday!
                                    </p>
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
                                    <p className="text-sm text-gray-300">
                                        {stats.alerts.expiringToday.map(m => m.full_name).join(', ')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Members</span>
                            <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-black">{stats.total}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Active</span>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-2xl font-black text-green-400">{stats.active}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Expiring Soon</span>
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="text-2xl font-black text-yellow-400">{stats.expiring}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Expire in &lt; 7 days</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Expired</span>
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="text-2xl font-black text-red-500">{stats.expired}</div>
                    </div>
                    {/* Revenue Card */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl md:col-span-2 lg:col-span-4 xl:col-span-1 min-w-[200px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <IndianRupee className="w-16 h-16" />
                        </div>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Estimated Revenue</span>
                            <IndianRupee className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-1 relative z-10">
                            <span className="text-base text-gray-500">₹</span>
                            {stats.revenue.total.toLocaleString('en-IN')}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-gray-500 border-t border-white/10 pt-2 relative z-10">
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">Mo</span>
                                ₹{(stats.revenue.monthly / 1000).toFixed(1)}k
                            </div>
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">Qr</span>
                                ₹{(stats.revenue.quarterly / 1000).toFixed(1)}k
                            </div>
                            <div>
                                <span className="block text-gray-400 font-bold mb-0.5">Hy</span>
                                ₹{(stats.revenue.halfYearly / 1000).toFixed(1)}k
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Area: Search + Add + Filter */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full md:w-auto flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Find member by name, mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red focus:bg-white/10 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Filter Tabs */}
                        <div className="bg-white/5 p-1 rounded-lg flex border border-white/10">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'active', label: 'Active' },
                                { id: 'expiring', label: 'Expiring' },
                                { id: 'expired', label: 'Expired' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id as any)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${filterStatus === tab.id
                                        ? 'bg-gym-red text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => { setShowForm(true); setEditingMember(null); }}
                            className="bg-gym-red text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 w-full sm:w-auto"
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
                                        <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer hover:ring-2 hover:ring-gym-red transition-all" onClick={() => member.photo_url && setSelectedImageUrl(member.photo_url)}>
                                            {member.photo_url ? (
                                                <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
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
                                            <span className="text-gray-300 font-mono">{member.membership_start || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Ends:</span>
                                            <span className={`font-mono font-bold ${status === 'expired' ? 'text-red-400' : 'text-white'}`}>
                                                {member.membership_end || 'N/A'}
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
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Form Modal */}
            {
                showForm && (
                    <div className="fixed inset-0 bg-black/80 z-[70] flex items-start justify-center pt-20 p-4 overflow-y-auto backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
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

                            <div className="overflow-y-auto p-6">
                                <form id="memberForm" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Photo Section */}
                                    <div className="space-y-4">
                                        {/* Photo Preview */}
                                        <div className="flex justify-center">
                                            <div className="w-32 h-32 bg-zinc-900 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center overflow-hidden">
                                                {photoPreview ? (
                                                    <img src={photoPreview || undefined} alt="Preview" className="w-full h-full object-cover" />
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
                                                        value={formData.mobile}
                                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                        className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white focus:border-gym-red focus:outline-none transition-colors"
                                                        placeholder="10-digit mobile"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
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
                                                        value={formData.date_of_birth}
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
                                                        value={formData.membership_type}
                                                        onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
                                                    >
                                                        <option value="Monthly">Monthly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                        <option value="Half-Yearly">Half-Yearly</option>
                                                    </select>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        {[
                                                            { id: 'Monthly', label: 'Monthly', price: '₹700' },
                                                            { id: 'Quarterly', label: 'Quarterly', price: '₹1,800' },
                                                            { id: 'Half-Yearly', label: 'Half-Yearly', price: '₹3,300' }
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
                                                        value={formData.membership_start}
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
                                                    value={formData.gender}
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
                                                    value={formData.height_cm}
                                                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                                                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                                    placeholder="e.g. 175"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-300 mb-1.5">Weight (kg) *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.weight_kg}
                                                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                                    className="w-full bg-black border border-white/20 rounded-lg p-2.5 text-white"
                                                    placeholder="e.g. 75"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-300 mb-1.5">Address / Notes (Optional)</label>
                                            <textarea
                                                value={formData.address}
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
                                                value={formData.emergency_contact}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
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
                                    className="flex-1 border border-white/10 bg-white/5 py-3 rounded-lg text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="memberForm"
                                    className="flex-[2] bg-gym-red py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                                >
                                    <Save className="w-5 h-5" />
                                    {editingMember ? 'Update Member Profile' : 'Register Member'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
            {/* Fullscreen Image Modal */}
            {selectedImageUrl && (
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
                        <img
                            src={selectedImageUrl}
                            alt="Member Photo"
                            className="w-full h-full object-contain rounded-xl shadow-2xl"
                        />
                        <button
                            onClick={() => setSelectedImageUrl(null)}
                            className="absolute -top-3 -right-3 bg-gym-red p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
}
