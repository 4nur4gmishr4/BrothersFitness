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
  "from-[#e17076] to-[#d65057]",
  "from-[#faa774] to-[#f48a52]",
  "from-[#a695e7] to-[#7f6fd3]",
  "from-[#7bc862] to-[#5ba742]",
  "from-[#6ec9cb] to-[#45a4a7]",
  "from-[#65aadd] to-[#4082b7]",
  "from-[#ee7aae] to-[#d44e88]",
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
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch(`/api/admin/leads?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: MessageInquiry[] = (data.leads || []).slice().sort(
        (a: MessageInquiry, b: MessageInquiry) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMessages(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    setReadIds(loadRead());
    fetchMessages();
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") fetchMessages();
    }, 30000);
    return () => clearInterval(iv);
  }, [fetchMessages, loadRead]);

  const markRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveRead(next);
      return next;
    });
  };

  const markAllRead = () => {
    const allIds = new Set(messages.map((l) => l.id));
    setReadIds(allIds);
    saveRead(allIds);
    toast.success("Marked all messages as read");
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    markRead(id);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("HTTP error");
      setMessages((prev) => {
        const next = prev.filter((l) => l.id !== id);
        if (selectedId === id) {
          setSelectedId(next[0]?.id || null);
        }
        return next;
      });
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        saveRead(next);
        return next;
      });
      setDeletingId(null);
      toast.success("Message conversation deleted");
    } catch {
      toast.error("Failed to delete message");
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
    <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col bg-[#eef2f5] dark:bg-[#0e1621] overflow-hidden transition-colors">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <AdminLoader text="Loading messages…" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-white dark:bg-[#17212b] border border-zinc-200 dark:border-[#232e3c] space-y-4 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <div className="text-zinc-900 dark:text-white font-semibold">Failed to load messages</div>
            <div className="text-xs text-zinc-500 dark:text-[#708499]">{error}</div>
            <button
              type="button"
              onClick={fetchMessages}
              className="px-4 py-2 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        /* Full-Screen Messages Master-Detail Layout */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden h-full">
          
          {/* Left Column: Chats & Inquiries Stream */}
          <div className="md:col-span-5 lg:col-span-4 bg-white dark:bg-[#17212b] border-r border-zinc-200 dark:border-[#0e1621] flex flex-col h-full overflow-hidden shadow-sm">
            
            {/* Search & Top Controls */}
            <div className="p-3 bg-white dark:bg-[#17212b] border-b border-zinc-200 dark:border-[#0e1621] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 dark:text-[#708499] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages, phone, email…"
                  className="w-full bg-zinc-100 dark:bg-[#242f3d] border border-transparent focus:border-[#2481cc] text-xs text-zinc-900 dark:text-white rounded-2xl pl-9 pr-7 py-2 placeholder:text-zinc-400 dark:placeholder:text-[#708499] focus:outline-none transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#708499] hover:text-zinc-900 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchMessages}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#242f3d] text-zinc-500 dark:text-[#708499] hover:text-zinc-900 dark:hover:text-white transition-colors"
                title="Refresh messages"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#242f3d] text-[#2481cc] transition-colors"
                  title="Mark all as read"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Message Conversation Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#0e1621]">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 dark:text-[#708499] text-xs">
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
                      className={`w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors ${
                        isSelected
                          ? "bg-[#3390ec] text-white dark:bg-[#2b5278] dark:text-white shadow-sm"
                          : "hover:bg-zinc-50 dark:hover:bg-[#202b36] text-zinc-900 dark:text-[#e4ecf2]"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}
                      >
                        {initials(item.name)}
                      </div>

                      {/* Snippet & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-sm font-semibold truncate ${
                              isSelected ? "text-white" : "text-zinc-900 dark:text-[#f5f5f5]"
                            }`}
                          >
                            {item.name}
                          </span>
                          <span
                            className={`text-xs tabular-nums font-medium shrink-0 ${
                              isSelected
                                ? "text-blue-100 dark:text-[#b2c8de]"
                                : "text-zinc-500 dark:text-[#708499]"
                            }`}
                          >
                            {formatTime(item.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs truncate ${
                              isSelected
                                ? "text-blue-50 dark:text-[#c2d7eb]"
                                : "text-zinc-500 dark:text-[#7f91a4]"
                            }`}
                          >
                            {item.message || "Contact Form Inquiry"}
                          </p>

                          {/* Unread Badge Pill */}
                          {isUnread && (
                            <span className="w-5 h-5 rounded-full bg-[#2481cc] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
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
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-[#eef2f5] dark:bg-[#0e1621] relative overflow-hidden">
            {selected ? (
              <>
                {/* Header Bar */}
                <div className="px-5 py-3 bg-white dark:bg-[#17212b] border-b border-zinc-200 dark:border-[#0e1621] flex items-center justify-between gap-4 shrink-0 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                        selected.name
                      )} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}
                    >
                      {initials(selected.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate flex items-center gap-2">
                        <span>{selected.name}</span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-[#708499] truncate font-medium">
                        <span className="tabular-nums">{selected.phone}</span> · {selected.email}
                      </div>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          selected.phone,
                          `Hi ${selected.name}, this is Team Brother's Fitness Lakhnadon! We received your message: "${selected.message}". How can we help you crush your fitness goals? 💪`
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`tel:${selected.phone}`}
                      className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#242f3d] text-zinc-500 dark:text-[#708499] hover:text-zinc-900 dark:hover:text-white transition-colors"
                      title="Call customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeletingId(selected.id)}
                      className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#242f3d] text-zinc-500 dark:text-[#708499] hover:text-red-500 transition-colors"
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
                      <span className="text-xs font-medium text-zinc-600 dark:text-[#708499] bg-white/80 dark:bg-[#17212b]/80 border border-zinc-200 dark:border-[#232e3c] px-3 py-1 rounded-full shadow-sm tabular-nums">
                        {new Date(selected.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {/* Incoming Message Bubble */}
                    <div className="flex items-end gap-2.5 max-w-[85%]">
                      <div
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(
                          selected.name
                        )} flex items-center justify-center text-[10px] font-bold text-white shrink-0 mb-1 shadow-sm`}
                      >
                        {initials(selected.name)}
                      </div>

                      <div className="relative bg-white dark:bg-[#182533] border border-zinc-200 dark:border-[#232e3c] text-zinc-900 dark:text-[#f5f5f5] rounded-2xl rounded-bl-sm p-3.5 shadow-md space-y-1.5">
                        <div className="text-xs font-semibold text-[#2481cc] dark:text-[#5288c1]">
                          {selected.name}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {selected.message}
                        </div>
                        
                        {/* Timestamp & Double Checkmarks */}
                        <div className="flex items-center justify-end gap-1 text-[11px] text-zinc-400 dark:text-[#708499] font-medium pt-1 tabular-nums">
                          <span>
                            {new Date(selected.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <CheckCheck className="w-3.5 h-3.5 text-[#2481cc] dark:text-[#5288c1]" />
                        </div>
                      </div>
                    </div>

                    {/* Information Card */}
                    <div className="mt-8 rounded-2xl bg-white dark:bg-[#17212b] border border-zinc-200 dark:border-[#232e3c] p-4 space-y-3 shadow-sm">
                      <div className="text-xs text-[#2481cc] dark:text-[#5288c1] uppercase tracking-wider font-semibold">
                        Inquiry Information
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-zinc-400 dark:text-[#708499] block text-[10px] font-semibold uppercase tracking-wider">FULL NAME</span>
                          <span className="text-zinc-900 dark:text-white font-medium">{selected.name}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 dark:text-[#708499] block text-[10px] font-semibold uppercase tracking-wider">MOBILE NUMBER</span>
                          <span className="text-[#2481cc] dark:text-[#5288c1] font-semibold tabular-nums">{selected.phone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-400 dark:text-[#708499] block text-[10px] font-semibold uppercase tracking-wider">EMAIL ADDRESS</span>
                          <span className="text-zinc-700 dark:text-[#e4ecf2] font-medium">{selected.email}</span>
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
                        className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white dark:bg-[#17212b] hover:bg-zinc-100 dark:hover:bg-[#242f3d] border border-zinc-200 dark:border-[#232e3c] text-zinc-700 dark:text-[#e4ecf2] transition-colors shadow-sm"
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
                        className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white dark:bg-[#17212b] hover:bg-zinc-100 dark:hover:bg-[#242f3d] border border-zinc-200 dark:border-[#232e3c] text-zinc-700 dark:text-[#e4ecf2] transition-colors shadow-sm"
                      >
                        /send_fee_structure
                      </button>
                    </div>

                    {/* Input Composer Bar */}
                    <div className="flex items-center gap-2 bg-white dark:bg-[#17212b] border border-zinc-200 dark:border-[#232e3c] rounded-2xl px-3 py-2 shadow-sm">
                      <button
                        type="button"
                        className="p-1.5 text-zinc-400 dark:text-[#708499] hover:text-zinc-900 dark:hover:text-white transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a message for WhatsApp…"
                        className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#708499] focus:outline-none font-medium"
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
                        className="w-8 h-8 rounded-full bg-[#2481cc] hover:bg-[#2074b8] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-[#708499] space-y-3">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-[#17212b] border border-zinc-200 dark:border-[#232e3c] flex items-center justify-center text-[#2481cc] shadow-sm">
                  <Inbox className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg text-zinc-900 dark:text-white">Select a Message</div>
                <p className="text-xs max-w-xs text-zinc-500 dark:text-[#708499] leading-relaxed">
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
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-[#232e3c] bg-white dark:bg-[#17212b] p-5 space-y-4 shadow-2xl">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Delete Conversation?</h3>
            <p className="text-xs text-zinc-500 dark:text-[#708499] leading-relaxed">
              Are you sure you want to permanently delete this message inquiry?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-[#232e3c] bg-zinc-100 dark:bg-[#242f3d] text-xs font-medium text-zinc-700 dark:text-white hover:bg-zinc-200 dark:hover:bg-[#2e3b4c] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm"
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
