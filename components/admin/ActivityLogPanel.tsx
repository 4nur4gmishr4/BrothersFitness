"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Plus, Edit, Trash2, ShieldAlert, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Log {
    id: string;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE';
    member_name: string;
    member_id: string;
    details: any;
    created_at: string;
}

export default function ActivityLogPanel({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/activity-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Could not load activity history');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'CREATE': return <Plus className="w-4 h-4 text-green-400" />;
            case 'UPDATE': return <Edit className="w-4 h-4 text-blue-400" />;
            case 'DELETE': return <Trash2 className="w-4 h-4 text-red-400" />;
            default: return <FileText className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-IN', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-start sm:items-center justify-center overflow-y-auto" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-zinc-900/95 border border-white/20 rounded-none sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto sm:my-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                                Activity History
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 bg-white/5 animate-pulse rounded-lg" />
                                    ))}
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No activity recorded yet.</p>
                                </div>
                            ) : (
                                logs.map(log => (
                                    <div key={log.id} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 font-mono text-xs font-bold bg-black/30 px-2 py-1 rounded">
                                                {getActionIcon(log.action_type)}
                                                <span className={
                                                    log.action_type === 'CREATE' ? 'text-green-400' :
                                                        log.action_type === 'DELETE' ? 'text-red-400' : 'text-blue-400'
                                                }>
                                                    {log.action_type}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-500">{formatTime(log.created_at)}</span>
                                        </div>
                                        <p className="font-medium text-sm mt-1">{log.member_name || 'Unknown Member'}</p>
                                        {log.details && (
                                            <pre className="mt-2 text-[10px] text-gray-500 bg-black/30 p-2 rounded overflow-x-auto">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
