"use client";

import { useState, useEffect } from 'react';
import { X, FileText, Plus, Edit, Trash2, ShieldAlert, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useModalDismiss } from '@/components/hooks/useModalDismiss';

interface Log {
    id: string;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE';
    member_name: string;
    member_id: string;
    details: unknown;
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
            case 'CREATE': return <Plus className="w-4 h-4 text-status-success" />;
            case 'UPDATE': return <Edit className="w-4 h-4 text-status-info" />;
            case 'DELETE': return <Trash2 className="w-4 h-4 text-status-danger" />;
            default: return <FileText className="w-4 h-4 text-low" />;
        }
    };

    const getActionColor = (type: string) => {
        switch (type) {
            case 'CREATE': return 'text-status-success';
            case 'UPDATE': return 'text-status-info';
            case 'DELETE': return 'text-status-danger';
            default: return 'text-low';
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleString('en-IN', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // M33: call unconditionally (hooks order) before the early return.
    const modalProps = useModalDismiss(onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-start sm:items-center justify-center overflow-y-auto modal-overlay-in" onClick={onClose}>
            <div
                {...modalProps}
                aria-label="Activity history"
                className="surface-modal hairline p-4 sm:p-6 w-full sm:max-w-xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto sm:my-4 modal-panel-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="heading-section text-lg text-hi uppercase flex items-center gap-2">
                        <Clock className="w-5 h-5 text-low" />
                        Activity History
                    </h2>
                    <button onClick={onClose} className="text-low hover:text-hi p-1 hover:bg-surface-elevated transition-colors duration-fast" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 skeleton" />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-low py-10">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No activity recorded yet.</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="surface-card hairline p-3 hover:border-accent transition-colors duration-fast">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2 font-mono text-xs font-bold surface-canvas px-2 py-1">
                                        {getActionIcon(log.action_type)}
                                        <span className={getActionColor(log.action_type)}>
                                            {log.action_type}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-faint">{formatTime(log.created_at)}</span>
                                </div>
                                <p className="font-medium text-sm text-hi mt-1">{log.member_name || 'Unknown Member'}</p>
                                {!!log.details && (
                                    <pre className="mt-2 text-[10px] text-faint surface-canvas p-2 overflow-x-auto">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
