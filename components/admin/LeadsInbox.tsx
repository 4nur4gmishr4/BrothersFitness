"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Mail, Phone, Trash2, User, MessageSquare, Lock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useModalDismiss } from '@/components/hooks/useModalDismiss';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    created_at: string;
}

export default function LeadsInbox({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);


    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [readLeads, setReadLeads] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    // Ref (not leads.length) so fetchLeads stays stable and the polling
    // interval isn't torn down every time the list updates.
    const hasLoadedRef = useRef(false);

    const fetchLeads = useCallback(async () => {
        try {
            // Only show loading spinner on first load, not polling
            if (!hasLoadedRef.current) setLoading(true);

            const token = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/leads?t=' + Date.now(), { // Cache bust
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await res.json();
            if (res.ok && data.leads) {
                // Sort by date desc (newest first)
                const sorted = data.leads.sort((a: Lead, b: Lead) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setLeads(sorted);
                hasLoadedRef.current = true;
            }
        } catch {
            // Silent fail on polling
            if (!hasLoadedRef.current) toast.error('Could not load inbox');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
            // Load read status from local storage
            const saved = localStorage.getItem('brofit_admin_read_leads');
            if (saved) {
                // A corrupt value must not crash the inbox.
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) setReadLeads(parsed.filter((id): id is string => typeof id === 'string'));
                } catch {
                    setReadLeads([]);
                }
            }

            // Poll for new messages every 10 seconds while open. M30: skip
            // ticks when the tab is backgrounded — wastes API calls + battery
            // on data that the user won't see until they return.
            const interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    fetchLeads();
                }
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchLeads]);

    const markAsRead = (id: string) => {
        if (!readLeads.includes(id)) {
            const updated = [...readLeads, id];
            setReadLeads(updated);
            localStorage.setItem('brofit_admin_read_leads', JSON.stringify(updated));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this chat?')) return;
        try {
            const token = sessionStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/leads?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setLeads(prev => prev.filter(l => l.id !== id));
                if (selectedLeadId === id) setSelectedLeadId(null);
                toast.success('Chat deleted');
            }
        } catch {
            toast.error('Failed to delete');
        }
    };

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone?.includes(searchQuery)
    );

    // M29: avoid `91` + `91xxx` = `9191xxx`. If the number already has the
    // country code, leave it; otherwise prefix it.
    const whatsappHref = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        return `https://wa.me/${digits.startsWith('91') ? digits : `91${digits}`}`;
    };

    const formatMessageTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' }); // DD/MM/YY
        }
    };

    const selectedLead = leads.find(l => l.id === selectedLeadId);

    // M33: call unconditionally (hooks order) before the early return.
    const modalProps = useModalDismiss(onClose);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 modal-overlay-in" onClick={onClose}>
            <div
                {...modalProps}
                aria-label="Leads inbox"
                className="surface-modal hairline w-full max-w-5xl h-[85vh] overflow-hidden flex relative modal-panel-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar (List) */}
                <div className={`${selectedLeadId ? 'hidden md:flex' : 'flex'} w-full md:w-[35%] border-r border-surface-border flex-col surface-canvas`}>
                    {/* Header */}
                    <div className="surface-elevated hairline-b p-3 flex justify-between items-center">
                        <div className="p-2 surface-modal hairline">
                            <User className="w-6 h-6 text-low" />
                        </div>
                        <div className="flex gap-4 text-faint">
                            <MessageSquare className="w-5 h-5 cursor-pointer hover:text-hi transition-colors" />
                            <button type="button" onClick={onClose} className="hover:text-hi transition-colors" aria-label="Close inbox"><X className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-2 hairline-b">
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="input-field"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        {loading ? (
                            <div className="p-4 text-center text-faint text-xs">Loading chats...</div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="p-6 text-center text-faint text-sm">No messages found</div>
                        ) : (
                            filteredLeads.map(lead => {
                                const isRead = readLeads.includes(lead.id);
                                return (
                                    <div
                                        key={lead.id}
                                        onClick={() => { setSelectedLeadId(lead.id); markAsRead(lead.id); }}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors duration-fast hairline-b ${selectedLeadId === lead.id ? 'bg-surface-elevated' : 'hover:bg-surface-elevated/50'}`}
                                    >
                                        <div className="w-12 h-12 surface-modal hairline flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-low" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className="text-hi font-normal truncate max-w-[70%]">{lead.name}</h4>
                                                <span className={`text-xs ${!isRead ? 'text-accent font-bold' : 'text-faint'}`}>
                                                    {formatMessageTime(lead.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-sm text-low truncate max-w-[80%]">{lead.message}</p>
                                                {!isRead && (
                                                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-[10px] font-bold">1</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area (Right) */}
                <div className={`${!selectedLeadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[65%] surface-canvas relative`}>
                    {selectedLead ? (
                        <>
                            {/* Chat Header */}
                            <div className="surface-elevated hairline-b p-3 flex items-center gap-4">
                                <button type="button" onClick={() => setSelectedLeadId(null)} className="md:hidden text-faint hover:text-hi transition-colors" aria-label="Back to list"><X className="w-5 h-5" /></button>
                                <div className="w-10 h-10 surface-modal hairline flex items-center justify-center">
                                    <User className="w-5 h-5 text-low" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-hi font-medium">{selectedLead.name}</h3>
                                    <p className="text-xs text-low">{selectedLead.phone || selectedLead.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(selectedLead.id)}
                                    className="p-2 text-faint hover:text-status-danger transition-colors duration-fast"
                                    title="Delete Chat"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 surface-canvas relative">
                                {/* Message Bubble (Left/Received) */}
                                <div className="surface-elevated hairline p-3 inline-block max-w-[85%] md:max-w-[70%] text-sm text-hi">
                                    <div className="mb-1 font-bold text-accent text-xs">{selectedLead.name}</div>
                                    <div className="whitespace-pre-wrap leading-relaxed">{selectedLead.message}</div>
                                    <div className="text-[10px] text-faint text-right mt-1 flex items-center justify-end gap-1">
                                        {formatMessageTime(selectedLead.created_at)}
                                    </div>
                                </div>

                                {/* Details Bubble (System) */}
                                <div className="flex justify-center my-4">
                                    <div className="surface-modal hairline px-3 py-1.5 text-xs text-low font-medium flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> {selectedLead.email}
                                        {selectedLead.phone && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <Phone className="w-3 h-3" /> {selectedLead.phone}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer (Actions) */}
                            <div className="surface-elevated hairline-t p-3 flex items-center gap-2">
                                {selectedLead.phone ? (
                                    <a
                                        href={whatsappHref(selectedLead.phone)}
                                        target="_blank"
                                        className="flex-1 flex items-center justify-center gap-2 bg-status-success text-status-on py-2.5 font-bold hover:bg-status-success/90 transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" /> Reply on WhatsApp
                                    </a>
                                ) : (
                                    <a
                                        href={`mailto:${selectedLead.email}`}
                                        className="flex-1 flex items-center justify-center gap-2 surface-modal hairline text-mid py-2.5 font-bold hover:border-accent hover:text-hi transition-colors duration-fast"
                                    >
                                        <Mail className="w-5 h-5" /> Reply via Email
                                    </a>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 surface-elevated">
                            <div className="w-24 h-24 mb-6 relative">
                                <MessageSquare className="w-full h-full text-faint/30" />
                                <div className="absolute top-0 right-0 w-8 h-8 bg-accent rounded-full" />
                            </div>
                            <h3 className="heading-section text-2xl text-hi mb-4">Brothers Fitness Inbox for WhatsApp</h3>
                            <p className="text-low max-w-md text-sm leading-relaxed">
                                Send and receive messages without keeping your phone online.<br />
                                Use Brothers Fitness Web on up to 4 linked devices and 1 phone.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-faint text-xs">
                                <Lock className="w-3 h-3" /> End-to-end encrypted
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
