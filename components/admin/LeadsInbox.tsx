"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Trash2, User, MessageSquare, Lock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

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

    const fetchLeads = useCallback(async () => {
        try {
            // Only show loading spinner on first load, not polling
            if (leads.length === 0) setLoading(true);

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
            }
        } catch {
            // Silent fail on polling
            if (leads.length === 0) toast.error('Could not load inbox');
        } finally {
            setLoading(false);
        }
    }, [leads.length]);

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
            // Load read status from local storage
            const saved = localStorage.getItem('brofit_admin_read_leads');
            if (saved) setReadLeads(JSON.parse(saved));

            // Poll for new messages every 10 seconds while open
            const interval = setInterval(fetchLeads, 10000);
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#111b21] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sidebar (List) */}
                        <div className={`${selectedLeadId ? 'hidden md:flex' : 'flex'} w-full md:w-[35%] border-r border-white/10 flex-col bg-[#111b21]`}>
                            {/* Header */}
                            <div className="p-3 bg-[#202c33] flex justify-between items-center border-b border-white/5">
                                <div className="p-2 rounded-full bg-gray-600/20">
                                    <User className="w-6 h-6 text-gray-300" />
                                </div>
                                <div className="flex gap-4 text-gray-400">
                                    <MessageSquare className="w-5 h-5 cursor-pointer hover:text-white" />
                                    <button onClick={onClose}><X className="w-5 h-5 hover:text-white" /></button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="p-2 border-b border-white/5">
                                <div className="bg-[#202c33] rounded-lg flex items-center px-3 py-1.5">
                                    <input
                                        type="text"
                                        placeholder="Search or start new chat"
                                        className="bg-transparent border-none text-sm text-white focus:outline-none w-full ml-2"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Chat List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-4 text-center text-gray-500 text-xs">Loading chats...</div>
                                ) : filteredLeads.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-sm">No messages found</div>
                                ) : (
                                    filteredLeads.map(lead => {
                                        const isRead = readLeads.includes(lead.id);
                                        return (
                                            <div
                                                key={lead.id}
                                                onClick={() => { setSelectedLeadId(lead.id); markAsRead(lead.id); }}
                                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#202c33] transition-colors border-b border-white/5 ${selectedLeadId === lead.id ? 'bg-[#2a3942]' : ''}`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline">
                                                        <h4 className="text-white font-normal truncate max-w-[70%]">{lead.name}</h4>
                                                        <span className={`text-xs ${!isRead ? 'text-[#25D366] font-bold' : 'text-gray-500'}`}>
                                                            {formatMessageTime(lead.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-0.5">
                                                        <p className="text-sm text-gray-400 truncate max-w-[80%]">{lead.message}</p>
                                                        {!isRead && (
                                                            <div className="w-5 h-5 bg-[#25D366] rounded-full flex items-center justify-center text-black text-[10px] font-bold">1</div>
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
                        <div className={`${!selectedLeadId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[65%] bg-[#0b141a] relative`}>
                            {selectedLead ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="bg-[#202c33] p-3 flex items-center gap-4 border-b border-white/5">
                                        <button onClick={() => setSelectedLeadId(null)} className="md:hidden text-gray-400"><X className="w-5 h-5" /></button>
                                        <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium">{selectedLead.name}</h3>
                                            <p className="text-xs text-gray-400">{selectedLead.phone || selectedLead.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(selectedLead.id)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            title="Delete Chat"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Messages Area (Background with pattern) */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0b141a] relative">
                                        {/* Message Bubble (Left/Received) */}
                                        <div className="bg-[#202c33] p-3 rounded-lg rounded-tl-none max-w-[85%] md:max-w-[70%] inline-block text-sm text-gray-100 relative shadow-md">
                                            <div className="mb-1 font-bold text-[#fab01c] text-xs">{selectedLead.name}</div>
                                            <div className="whitespace-pre-wrap leading-relaxed">{selectedLead.message}</div>
                                            <div className="text-[10px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                                                {formatMessageTime(selectedLead.created_at)}
                                            </div>
                                        </div>

                                        {/* Details Bubble (System) */}
                                        <div className="flex justify-center my-4">
                                            <div className="bg-[#182229] px-3 py-1.5 rounded-lg text-xs text-[#8696a0] font-medium shadow-sm flex items-center gap-2">
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
                                    <div className="bg-[#202c33] p-3 flex items-center gap-2 border-t border-white/5">
                                        {selectedLead.phone ? (
                                            <a
                                                href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-black py-2.5 rounded-lg font-bold hover:bg-[#20b857] transition-colors"
                                            >
                                                <MessageCircle className="w-5 h-5" /> Reply on WhatsApp
                                            </a>
                                        ) : (
                                            <a
                                                href={`mailto:${selectedLead.email}`}
                                                className="flex-1 flex items-center justify-center gap-2 bg-[#202c33] border border-white/20 text-gray-300 py-2.5 rounded-lg font-bold hover:bg-white/5 transition-colors"
                                            >
                                                <Mail className="w-5 h-5" /> Reply via Email
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Empty State */
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#222e35] border-b-[6px] border-[#25D366]">
                                    <div className="w-24 h-24 mb-6 relative">
                                        <MessageSquare className="w-full h-full text-gray-500/30" />
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-[#25D366] rounded-full animate-bounce" />
                                    </div>
                                    <h3 className="text-2xl text-[#e9edef] font-light mb-4">BroFit Inbox for WhatsApp</h3>
                                    <p className="text-[#8696a0] max-w-md text-sm leading-relaxed">
                                        Send and receive messages without keeping your phone online.<br />
                                        Use BroFit Web on up to 4 linked devices and 1 phone.
                                    </p>
                                    <div className="mt-8 flex items-center gap-2 text-[#8696a0] text-xs">
                                        <Lock className="w-3 h-3" /> End-to-end encrypted
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
