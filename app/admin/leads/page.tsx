"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Phone,
  Trash2,
  MessageCircle,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Inbox,
  Send,
  Paperclip,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLoader } from "@/components/admin/AdminUI";
import { adminFetch, openWhatsApp } from "@/lib/admin-api";
import { formatDate } from "@/lib/member-utils";
import { cn } from "@/lib/utils";

interface MessageInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

const READ_KEY = "brofit_admin_read_leads";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return formatDate(iso);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "—";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

const AVATAR_COLORS = [
  "from-red-500 to-rose-600",
  "from-orange-500 to-amber-600",
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-cyan-500 to-blue-600",
  "from-pink-500 to-rose-600",
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadRead = useCallback(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (!raw) return new Set<string>();
      const arr = JSON.parse(raw);
      return new Set<string>(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set<string>();
    }
  }, []);

  const saveRead = useCallback((ids: Set<string>) => {
    try {
      const arr = Array.from(ids).slice(-500);
      localStorage.setItem(READ_KEY, JSON.stringify(arr));
    } catch {
      // Ignored
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setError(null);
    try {
      const res = await adminFetch("/api/admin/leads");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please log in again.");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const raw = (data.leads || []) as MessageInquiry[];
      const sorted = [...raw].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMessages(sorted);
      const read = loadRead();
      setReadIds(read);

      // Auto select first message if none selected
      if (!selectedId && sorted.length > 0) {
        setSelectedId(sorted[0].id);
        if (!read.has(sorted[0].id)) {
          const next = new Set(read).add(sorted[0].id);
          setReadIds(next);
          saveRead(next);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [loadRead, saveRead, selectedId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const onSelect = (id: string) => {
    setSelectedId(id);
    if (!readIds.has(id)) {
      const next = new Set(readIds).add(id);
      setReadIds(next);
      saveRead(next);
    }
  };

  const markAllRead = () => {
    const next = new Set<string>(messages.map((l) => l.id));
    setReadIds(next);
    saveRead(next);
    toast.success("All messages marked as read");
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setMessages((prev) => {
        const next = prev.filter((l) => l.id !== id);
        if (selectedId === id) {
          setSelectedId(next[0]?.id || null);
        }
        return next;
      });

      const nextRead = new Set(readIds);
      nextRead.delete(id);
      setReadIds(nextRead);
      saveRead(nextRead);

      toast.success("Message inquiry deleted");
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = messages;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          l.email.toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, search]);

  const unreadCount = useMemo(
    () => messages.filter((l) => !readIds.has(l.id)).length,
    [messages, readIds]
  );

  const selected = selectedId ? messages.find((l) => l.id === selectedId) || null : null;

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col bg-surface-canvas text-hi overflow-hidden transition-colors">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <AdminLoader text="Loading messages…" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4 shadow-lg">
            <AlertCircle className="w-10 h-10 text-status-danger mx-auto" />
            <div className="text-hi font-semibold">Failed to load messages</div>
            <div className="text-xs text-low">{error}</div>
            <button
              type="button"
              onClick={fetchMessages}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        /* Full-Screen Messages Master-Detail Layout */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden h-full">
          
          {/* Left Column: Chats & Inquiries Stream */}
          <div className="md:col-span-5 lg:col-span-4 bg-surface-card border-r border-surface-border flex flex-col h-full overflow-hidden shadow-xs">
            
            {/* Search & Top Controls */}
            <div className="p-3 bg-surface-card border-b border-surface-border flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-low absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages, phone, email…"
                  className="w-full bg-surface-soft border border-surface-border focus:border-accent text-xs text-hi rounded-xl pl-9 pr-7 py-2 placeholder:text-low focus:outline-none transition-colors font-medium"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-low hover:text-hi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchMessages}
                className="p-2 rounded-xl hover:bg-surface-elevated text-low hover:text-hi transition-colors border border-transparent hover:border-surface-border"
                title="Refresh messages"
                aria-label="Refresh messages"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-2 rounded-xl hover:bg-surface-elevated text-accent transition-colors border border-transparent hover:border-surface-border"
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Message Conversation Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border/50">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-low text-xs">
                  No conversations found.
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedId === item.id;
                  const isUnread = !readIds.has(item.id);
                  const gradient = getAvatarGradient(item.name);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className={cn(
                        "w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors relative",
                        isSelected
                          ? "bg-accent/15 border-l-4 border-accent text-hi"
                          : "hover:bg-surface-elevated text-hi border-l-4 border-transparent"
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}
                      >
                        {initials(item.name)}
                      </div>

                      {/* Snippet & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-hi font-bold" : "text-hi"
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="text-[11px] tabular-nums text-low shrink-0">
                            {formatTime(item.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs truncate text-mid">
                            {item.message || "Contact Form Inquiry"}
                          </p>

                          {/* Unread Badge Pill */}
                          {isUnread && (
                            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                              1
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Full-Height Chat Canvas */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-surface-canvas relative overflow-hidden">
            {selected ? (
              <>
                {/* Header Bar */}
                <div className="px-5 py-3 bg-surface-card border-b border-surface-border flex items-center justify-between gap-4 shrink-0 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(
                        selected.name
                      )} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}
                    >
                      {initials(selected.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-hi truncate flex items-center gap-2">
                        <span>{selected.name}</span>
                      </div>
                      <div className="text-xs text-low truncate font-medium">
                        <span className="tabular-nums font-mono">{selected.phone}</span> · {selected.email}
                      </div>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          selected.phone,
                          `Hi ${selected.name}, this is Team Brother's Fitness Lakhnadon! We received your message: "${selected.message}". How can we help you crush your fitness goals? 💪`
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`tel:${selected.phone}`}
                      className="p-2 rounded-xl hover:bg-surface-elevated text-low hover:text-hi transition-colors border border-surface-border"
                      title="Call customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeletingId(selected.id)}
                      className="p-2 rounded-xl hover:bg-status-danger/10 text-low hover:text-status-danger transition-colors border border-surface-border"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Canvas Stream */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4 max-w-2xl mx-auto w-full">
                    
                    {/* Date Centered Bubble */}
                    <div className="flex justify-center">
                      <span className="text-xs font-medium text-low bg-surface-card border border-surface-border px-3 py-1 rounded-full shadow-xs tabular-nums">
                        {new Date(selected.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {/* Incoming Message Bubble */}
                    <div className="flex items-end gap-2.5 max-w-[85%]">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarGradient(
                          selected.name
                        )} flex items-center justify-center text-[10px] font-bold text-white shrink-0 mb-1 shadow-xs`}
                      >
                        {initials(selected.name)}
                      </div>

                      <div className="relative bg-surface-card border border-surface-border text-hi rounded-2xl rounded-bl-sm p-4 shadow-sm space-y-2">
                        <div className="text-xs font-semibold text-accent">
                          {selected.name}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-hi">
                          {selected.message}
                        </div>
                        
                        {/* Timestamp & Double Checkmarks */}
                        <div className="flex items-center justify-end gap-1 text-[11px] text-low font-medium pt-1 tabular-nums">
                          <span>
                            {new Date(selected.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <CheckCheck className="w-3.5 h-3.5 text-accent" />
                        </div>
                      </div>
                    </div>

                    {/* Information Card */}
                    <div className="mt-8 rounded-2xl bg-surface-card border border-surface-border p-4 space-y-3 shadow-xs">
                      <div className="text-xs text-accent uppercase tracking-wider font-semibold font-mono">
                        Inquiry Information
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-low block text-[10px] font-semibold uppercase tracking-wider font-mono">FULL NAME</span>
                          <span className="text-hi font-medium">{selected.name}</span>
                        </div>
                        <div>
                          <span className="text-low block text-[10px] font-semibold uppercase tracking-wider font-mono">MOBILE NUMBER</span>
                          <span className="text-accent font-semibold font-mono tabular-nums">{selected.phone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-low block text-[10px] font-semibold uppercase tracking-wider font-mono">EMAIL ADDRESS</span>
                          <span className="text-mid font-medium">{selected.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Quick Reply / Command Prompts */}
                  <div className="max-w-2xl mx-auto w-full space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(
                            selected.phone,
                            `Hi ${selected.name}, thank you for reaching out to Brother's Fitness Lakhnadon! When would you like to visit the gym for a tour? 🏋️`
                          )
                        }
                        className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-surface-card hover:bg-surface-elevated border border-surface-border text-mid hover:text-hi transition-colors shadow-xs"
                      >
                        /offer_gym_tour
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(
                            selected.phone,
                            `Hey ${selected.name}! We saw your inquiry about gym memberships. Our plans start from ₹600/month. Would you like our full fee structure? 💪`
                          )
                        }
                        className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-surface-card hover:bg-surface-elevated border border-surface-border text-mid hover:text-hi transition-colors shadow-xs"
                      >
                        /send_fee_structure
                      </button>
                    </div>

                    {/* Input Composer Bar */}
                    <div className="flex items-center gap-2 bg-surface-card border border-surface-border focus-within:border-accent rounded-2xl px-3 py-2 shadow-xs transition-colors">
                      <button
                        type="button"
                        className="p-1.5 text-low hover:text-hi transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a message for WhatsApp…"
                        className="flex-1 bg-transparent text-sm text-hi placeholder:text-low focus:outline-none font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && replyText.trim()) {
                            openWhatsApp(selected.phone, replyText);
                            setReplyText("");
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (replyText.trim()) {
                            openWhatsApp(selected.phone, replyText);
                            setReplyText("");
                          } else {
                            openWhatsApp(
                              selected.phone,
                              `Hi ${selected.name}, this is Team Brother's Fitness Lakhnadon! Following up on your inquiry.`
                            );
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-low space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-accent shadow-xs">
                  <Inbox className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg text-hi">Select a Message</div>
                <p className="text-xs max-w-xs text-low leading-relaxed">
                  Choose an inquiry from the left panel to inspect message payload and reply instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-modal p-5 space-y-4 shadow-2xl">
            <h3 className="font-semibold text-lg text-hi">Delete Conversation?</h3>
            <p className="text-xs text-low leading-relaxed">
              Are you sure you want to permanently delete this message inquiry?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface-card text-xs font-medium text-mid hover:text-hi hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-3.5 py-1.5 rounded-xl bg-status-danger hover:bg-red-600 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
