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
import { Portal } from "@/components/ui/primitives/Portal";

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
  if (!parts[0]) return "-";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

// Telegram authentic avatar gradients
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
    <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col bg-[#eef2f5] dark:bg-[#0e1621] text-[#000000] dark:text-[#f5f5f5] overflow-hidden transition-colors">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <AdminLoader text="Loading messages…" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-white dark:bg-[#17212b] border border-[#dfe1e5] dark:border-[#232e3c] space-y-4 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <div className="text-zinc-900 dark:text-white font-semibold">Could not load messages</div>
            <div className="text-xs text-[#707579] dark:text-[#708499]">{error}</div>
            <button
              type="button"
              onClick={fetchMessages}
              className="px-4 py-2 rounded-xl bg-[#3390ec] hover:bg-[#2b7dd1] dark:bg-[#2481cc] dark:hover:bg-[#2074b8] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        /* Authentic Full-Screen Telegram Web Master-Detail Layout */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden h-full">
          
          {/* Left Column: Telegram Chats & Inquiries Stream */}
          <div className="md:col-span-5 lg:col-span-4 bg-white dark:bg-[#17212b] border-r border-[#dfe1e5] dark:border-[#0e1621] flex flex-col h-full overflow-hidden shadow-xs">
            
            {/* Search & Top Controls */}
            <div className="p-3 bg-white dark:bg-[#17212b] border-b border-[#dfe1e5] dark:border-[#0e1621] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#707579] dark:text-[#708499] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages, phone, email…"
                  className="w-full bg-[#f1f3f4] dark:bg-[#242f3d] border border-transparent focus:border-[#3390ec] dark:focus:border-[#2481cc] text-xs text-[#000000] dark:text-white rounded-2xl pl-9 pr-7 py-2 placeholder:text-[#707579] dark:placeholder:text-[#708499] focus:outline-none transition-colors font-medium"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#707579] dark:text-[#708499] hover:text-[#000000] dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={fetchMessages}
                className="p-2 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#242f3d] text-[#707579] dark:text-[#708499] hover:text-[#000000] dark:hover:text-white transition-colors"
                title="Refresh messages"
                aria-label="Refresh messages"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="p-2 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#242f3d] text-[#3390ec] dark:text-[#2481cc] transition-colors"
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Message Conversation Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f4f4f5] dark:divide-[#0e1621]">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-[#707579] dark:text-[#708499] text-xs">
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
                        "w-full text-left px-3.5 py-3 flex items-center gap-3 transition-colors",
                        isSelected
                          ? "bg-[#3390ec] text-white dark:bg-[#2b5278] dark:text-white shadow-xs"
                          : "hover:bg-[#f4f4f5] dark:hover:bg-[#202b36] text-[#000000] dark:text-[#f5f5f5]"
                      )}
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
                            className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-white" : "text-[#000000] dark:text-[#f5f5f5]"
                            )}
                          >
                            {item.name}
                          </span>
                          <span
                            className={cn(
                              "text-xs tabular-nums font-medium shrink-0",
                              isSelected
                                ? "text-blue-100 dark:text-[#8ca6bf]"
                                : "text-[#707579] dark:text-[#708499]"
                            )}
                          >
                            {formatTime(item.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-xs truncate",
                              isSelected
                                ? "text-blue-50 dark:text-[#b2c8de]"
                                : "text-[#707579] dark:text-[#708499]"
                            )}
                          >
                            {item.message || "Website Message"}
                          </p>

                          {/* Unread Badge Pill */}
                          {isUnread && (
                            <span className="w-5 h-5 rounded-full bg-[#3390ec] dark:bg-[#2481cc] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-sm">
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

          {/* Right Column: Full-Height Telegram Chat Canvas */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-[#eef2f5] dark:bg-[#0e1621] relative overflow-hidden">
            {selected ? (
              <>
                {/* Header Bar */}
                <div className="px-5 py-3 bg-white dark:bg-[#17212b] border-b border-[#dfe1e5] dark:border-[#0e1621] flex items-center justify-between gap-4 shrink-0 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                        selected.name
                      )} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}
                    >
                      {initials(selected.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#000000] dark:text-white truncate flex items-center gap-2">
                        <span>{selected.name}</span>
                      </div>
                      <div className="text-xs text-[#707579] dark:text-[#708499] truncate font-medium">
                        <span className="tabular-nums">{selected.phone}</span> · {selected.email}
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
                      className="px-3 py-1.5 rounded-xl bg-[#2481cc] hover:bg-[#2074b8] text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <a
                      href={`tel:${selected.phone}`}
                      className="p-2 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#242f3d] text-[#707579] dark:text-[#708499] hover:text-[#000000] dark:hover:text-white transition-colors"
                      title="Call person"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeletingId(selected.id)}
                      className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-[#707579] dark:text-[#708499] hover:text-red-500 transition-colors"
                      title="Delete message"
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
                      <span className="text-xs font-medium text-[#4a5568] dark:text-[#708499] bg-white/85 dark:bg-[#17212b]/85 border border-[#dfe1e5] dark:border-[#232e3c] px-3 py-1 rounded-full shadow-xs tabular-nums">
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
                        )} flex items-center justify-center text-[10px] font-bold text-white shrink-0 mb-1 shadow-xs`}
                      >
                        {initials(selected.name)}
                      </div>

                      <div className="relative bg-white dark:bg-[#182533] border border-[#dfe1e5] dark:border-[#232e3c] text-[#000000] dark:text-[#f5f5f5] rounded-2xl rounded-bl-sm p-4 shadow-sm space-y-2">
                        <div className="text-xs font-semibold text-[#3390ec] dark:text-[#5288c1]">
                          {selected.name}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-[#000000] dark:text-[#f5f5f5]">
                          {selected.message}
                        </div>
                        
                        {/* Timestamp & Double Checkmarks */}
                        <div className="flex items-center justify-end gap-1 text-[11px] text-[#707579] dark:text-[#708499] font-medium pt-1 tabular-nums">
                          <span>
                            {new Date(selected.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <CheckCheck className="w-3.5 h-3.5 text-[#3390ec] dark:text-[#5288c1]" />
                        </div>
                      </div>
                    </div>

                    {/* Information Card */}
                    <div className="mt-8 rounded-2xl bg-white dark:bg-[#17212b] border border-[#dfe1e5] dark:border-[#232e3c] p-4 space-y-3 shadow-xs">
                      <div className="text-xs text-[#3390ec] dark:text-[#5288c1] uppercase tracking-wider font-semibold">
                        Inquiry Information
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#707579] dark:text-[#708499] block text-[10px] font-semibold uppercase tracking-wider">FULL NAME</span>
                          <span className="text-[#000000] dark:text-white font-medium">{selected.name}</span>
                        </div>
                        <div>
                          <span className="text-[#707579] dark:text-[#708499] block text-[10px] font-semibold uppercase tracking-wider">MOBILE NUMBER</span>
                          <span className="text-[#3390ec] dark:text-[#5288c1] font-semibold tabular-nums">{selected.phone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#707579] dark:text-[#708499] block text-[10px] font-semibold uppercase tracking-wider">EMAIL ADDRESS</span>
                          <span className="text-zinc-700 dark:text-[#e4ecf2] font-medium">{selected.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Quick Reply Actions */}
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
                        className="text-xs font-medium px-4 py-1.5 rounded-full bg-white dark:bg-[#17212b] hover:bg-[#f1f3f4] dark:hover:bg-[#242f3d] border border-[#dfe1e5] dark:border-[#232e3c] text-[#222222] dark:text-[#e4ecf2] transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <span>Schedule Gym Tour</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(
                            selected.phone,
                            `Hey ${selected.name}! We saw your inquiry about gym memberships. Our plans start from ₹600/month. Would you like our full fee structure? 💪`
                          )
                        }
                        className="text-xs font-medium px-4 py-1.5 rounded-full bg-white dark:bg-[#17212b] hover:bg-[#f1f3f4] dark:hover:bg-[#242f3d] border border-[#dfe1e5] dark:border-[#232e3c] text-[#222222] dark:text-[#e4ecf2] transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <span>Share Fee Structure</span>
                      </button>
                    </div>

                    {/* Input Composer Bar */}
                    <div className="flex items-center gap-2 bg-white dark:bg-[#17212b] border border-[#dfe1e5] dark:border-[#232e3c] focus-within:border-[#3390ec] dark:focus-within:border-[#2481cc] rounded-2xl px-3 py-2 shadow-xs transition-colors">
                      <button
                        type="button"
                        className="p-1.5 text-[#707579] dark:text-[#708499] hover:text-[#000000] dark:hover:text-white transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a message for WhatsApp…"
                        className="flex-1 bg-transparent text-sm text-[#000000] dark:text-white placeholder:text-[#707579] dark:placeholder:text-[#708499] focus:outline-none font-medium"
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
                        className="w-8 h-8 rounded-full bg-[#3390ec] hover:bg-[#2b7dd1] dark:bg-[#2481cc] dark:hover:bg-[#2074b8] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#707579] dark:text-[#708499] space-y-3">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-[#17212b] border border-[#dfe1e5] dark:border-[#232e3c] flex items-center justify-center text-[#3390ec] dark:text-[#2481cc] shadow-xs">
                  <Inbox className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg text-[#000000] dark:text-white">Select a Message</div>
                <p className="text-xs max-w-xs text-[#707579] dark:text-[#708499] leading-relaxed">
                  Choose an inquiry from the left panel to inspect message payload and reply instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-full z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain scrollbar-hide modal-overlay-in">
            <div className="w-full max-w-sm my-auto rounded-3xl border border-[#dfe1e5] dark:border-[#232e3c] bg-white dark:bg-[#17212b] p-5 sm:p-6 space-y-4 shadow-2xl modal-panel-in relative">
              <h3 className="font-semibold text-lg text-[#000000] dark:text-white">Delete Conversation?</h3>
              <p className="text-xs text-[#707579] dark:text-[#708499] leading-relaxed">
                Are you sure you want to permanently delete this message inquiry?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#dfe1e5] dark:border-[#232e3c] bg-[#f1f3f4] dark:bg-[#242f3d] text-xs font-medium text-[#000000] dark:text-white hover:bg-zinc-200 dark:hover:bg-[#2e3b4c] transition-colors"
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
        </Portal>
      )}
    </div>
  );
}
