"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Paperclip, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageSender {
  id: string;
  name: string;
  image: string | null;
  avatar: string | null;
  role: string | null;
}

interface OrderMessage {
  id: string;
  orderId: string;
  assignmentId: string | null;
  senderId: string;
  body: string;
  attachments: string[];
  createdAt: string;
  sender: MessageSender;
}

export interface OrderChatAssignmentOption {
  id: string;
  label: string;
}

export interface OrderChatPanelProps {
  orderId: string;
  currentUserId: string;
  /**
   * List of assignments the current user can see chat for. When the user
   * is on the creator side this will be a single entry (their own
   * assignment). Brand / agency / AM / admin users get one entry per
   * creator, so they can pick which creator's thread to view.
   */
  assignments: OrderChatAssignmentOption[];
  /** Hide the picker for single-thread users (creators). */
  showAssignmentPicker?: boolean;
}

const POLL_INTERVAL_MS = 15_000;
const MAX_ATTACHMENTS = 5;

export default function OrderChatPanel({
  orderId,
  currentUserId,
  assignments,
  showAssignmentPicker = false,
}: OrderChatPanelProps) {
  const t = useTranslations("chat");
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    assignments[0]?.id ?? null
  );
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!activeAssignmentId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/orders/${orderId}/messages?assignmentId=${activeAssignmentId}&limit=100`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // silently fail — polling will retry
    } finally {
      setLoading(false);
    }
  }, [orderId, activeAssignmentId]);

  // Poll on mount + every 15s; pause when tab hidden.
  useEffect(() => {
    fetchMessages();
    let interval = setInterval(fetchMessages, POLL_INTERVAL_MS);

    function handleVisibility() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchMessages();
        interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchMessages]);

  // Scroll to bottom when new messages arrive.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function handleFilePick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      toast.error(t("too_many_attachments", { max: MAX_ATTACHMENTS }));
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error ?? t("upload_failed"));
          continue;
        }
        const data = await res.json();
        if (data?.url) urls.push(data.url);
      }
      if (urls.length) {
        setAttachments((prev) => [...prev, ...urls]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a !== url));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeAssignmentId) return;
    const trimmed = body.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      toast.error(t("message_too_long"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeAssignmentId,
          body: trimmed,
          attachments: attachments.length ? attachments : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? t("send_failed"));
        return;
      }
      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setBody("");
      setAttachments([]);
    } catch {
      toast.error(t("send_failed"));
    } finally {
      setSending(false);
    }
  }

  const formattedMessages = useMemo(
    () =>
      messages.map((msg) => ({
        ...msg,
        isOwn: msg.senderId === currentUserId,
        time: new Date(msg.createdAt).toLocaleString(),
      })),
    [messages, currentUserId]
  );

  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-gray-500">{t("no_assignments_yet")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <p className="text-xs text-gray-500">{t("subtitle")}</p>
        </div>
        {showAssignmentPicker && assignments.length > 1 && (
          <Select
            value={activeAssignmentId ?? undefined}
            onValueChange={(v) => setActiveAssignmentId(v)}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t("pick_thread")} />
            </SelectTrigger>
            <SelectContent>
              {assignments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div
        ref={scrollRef}
        className="h-80 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4 sm:px-6"
      >
        {loading && messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">{t("loading")}</p>
        ) : formattedMessages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">{t("empty_state")}</p>
        ) : (
          formattedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                  msg.isOwn
                    ? "bg-[#d4772c] text-white"
                    : "border border-gray-200 bg-white text-gray-900"
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-xs font-semibold opacity-80">
                    {msg.sender.name}
                    {msg.sender.role ? ` · ${msg.sender.role}` : ""}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm">
                  {msg.body}
                </p>
                {msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={t("attachment_alt", { number: i + 1 })}
                          className="h-16 w-16 rounded-md border border-black/10 object-cover hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p
                  className={`mt-1 text-[10px] ${
                    msg.isOwn ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-2 border-t border-gray-100 px-4 py-4 sm:px-6"
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((url) => (
              <div
                key={url}
                className="relative inline-block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-14 w-14 rounded border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(url)}
                  className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                  aria-label={t("remove_attachment")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("composer_placeholder")}
          rows={2}
          maxLength={2000}
          className="resize-none"
          disabled={sending}
        />
        <div className="flex items-center justify-between gap-2">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilePick}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
            >
              <Paperclip className="h-4 w-4" />
              {uploading ? t("uploading") : t("attach")}
            </Button>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={sending || !body.trim() || !activeAssignmentId}
          >
            <Send className="h-4 w-4" />
            {sending ? t("sending") : t("send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
