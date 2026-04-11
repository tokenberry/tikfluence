"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Film, ImageIcon, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DraftType = "VIDEO" | "IMAGES";
type DraftStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

interface DraftUserRef {
  id: string;
  name: string | null;
  image: string | null;
  avatar: string | null;
}

interface ContentDraft {
  id: string;
  orderId: string;
  assignmentId: string;
  creatorUserId: string;
  draftType: DraftType;
  fileUrls: string[];
  notes: string | null;
  status: DraftStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  creatorUser: DraftUserRef | null;
  reviewerUser: DraftUserRef | null;
}

export interface ContentDraftsAssignmentOption {
  id: string;
  label: string;
}

export interface ContentDraftsPanelProps {
  orderId: string;
  /** "creator" may upload + view their own drafts; "reviewer" may view + approve/reject. */
  mode: "creator" | "reviewer";
  /**
   * Assignments the caller can see drafts for. Creator side will be a
   * single entry; reviewer side will be one per assigned creator (pick
   * which subthread to review).
   */
  assignments: ContentDraftsAssignmentOption[];
  /** Show the picker only when there's more than one assignment. */
  showAssignmentPicker?: boolean;
}

const MAX_FILES = 10;

export default function ContentDraftsPanel({
  orderId,
  mode,
  assignments,
  showAssignmentPicker = false,
}: ContentDraftsPanelProps) {
  const t = useTranslations("drafts");

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    assignments[0]?.id ?? null
  );
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload form state (creator mode)
  const [draftType, setDraftType] = useState<DraftType>("VIDEO");
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review form state (reviewer mode) — keyed by draft id
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!activeAssignmentId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/orders/${orderId}/drafts?assignmentId=${activeAssignmentId}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts ?? []);
      }
    } catch {
      // silent retry
    } finally {
      setLoading(false);
    }
  }, [orderId, activeAssignmentId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  async function handleFilePick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fileUrls.length + files.length > MAX_FILES) {
      toast.error(t("too_many_files", { max: MAX_FILES }));
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const isVideo = file.type.startsWith("video/");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", isVideo ? "video" : "image");
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
        setFileUrls((prev) => [...prev, ...urls]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeFile(url: string) {
    setFileUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeAssignmentId) return;
    if (fileUrls.length === 0) {
      toast.error(t("upload_at_least_one"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeAssignmentId,
          draftType,
          fileUrls,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? t("submit_failed"));
        return;
      }
      const created = await res.json();
      setDrafts((prev) => [created, ...prev]);
      setFileUrls([]);
      setNotes("");
      toast.success(t("submit_success"));
    } catch {
      toast.error(t("submit_failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(draftId: string, approved: boolean) {
    setReviewingId(draftId);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/drafts/${draftId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved,
            reviewNotes: reviewNotes[draftId]?.trim() || undefined,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? t("review_failed"));
        return;
      }
      const updated = await res.json();
      setDrafts((prev) =>
        prev.map((d) => (d.id === draftId ? { ...d, ...updated } : d))
      );
      setReviewNotes((prev) => ({ ...prev, [draftId]: "" }));
      toast.success(approved ? t("approved_toast") : t("rejected_toast"));
    } catch {
      toast.error(t("review_failed"));
    } finally {
      setReviewingId(null);
    }
  }

  const sortedDrafts = useMemo(
    () =>
      [...drafts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [drafts]
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
          <p className="text-xs text-gray-500">
            {mode === "creator" ? t("subtitle_creator") : t("subtitle_reviewer")}
          </p>
        </div>
        {showAssignmentPicker && assignments.length > 1 && (
          <Select
            value={activeAssignmentId ?? undefined}
            onValueChange={(v) => setActiveAssignmentId(v)}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t("pick_assignment")} />
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

      {/* Upload form (creator side only) */}
      {mode === "creator" && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-b border-gray-100 px-6 py-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={draftType}
              onValueChange={(v) => setDraftType(v as DraftType)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">{t("type_video")}</SelectItem>
                <SelectItem value="IMAGES">{t("type_images")}</SelectItem>
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              accept={draftType === "VIDEO" ? "video/*" : "image/*"}
              multiple={draftType === "IMAGES"}
              onChange={handleFilePick}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || fileUrls.length >= MAX_FILES}
            >
              <Upload className="h-4 w-4" />
              {uploading ? t("uploading") : t("pick_files")}
            </Button>
          </div>

          {fileUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {fileUrls.map((url) => (
                <div
                  key={url}
                  className="relative inline-block"
                >
                  {draftType === "VIDEO" ? (
                    <video
                      src={url}
                      className="h-24 w-40 rounded border border-gray-200 bg-black object-cover"
                      controls
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt=""
                      className="h-24 w-24 rounded border border-gray-200 object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(url)}
                    className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                    aria-label={t("remove_file")}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notes_placeholder")}
            rows={2}
            maxLength={2000}
            className="resize-none"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={submitting || uploading || fileUrls.length === 0}
            >
              {submitting ? t("submitting") : t("submit_draft")}
            </Button>
          </div>
        </form>
      )}

      {/* Drafts list */}
      <div className="space-y-4 px-6 py-4">
        {loading && drafts.length === 0 ? (
          <p className="text-center text-sm text-gray-400">{t("loading")}</p>
        ) : sortedDrafts.length === 0 ? (
          <p className="text-center text-sm text-gray-400">{t("empty_state")}</p>
        ) : (
          sortedDrafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {draft.draftType === "VIDEO" ? (
                    <Film className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {draft.creatorUser?.name ?? t("unknown_creator")}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(draft.createdAt).toLocaleString()}
                  </span>
                </div>
                <StatusBadge status={draft.status} t={t} />
              </div>

              {/* File previews */}
              <div className="mt-3 flex flex-wrap gap-3">
                {draft.fileUrls.map((url, i) =>
                  draft.draftType === "VIDEO" ? (
                    <video
                      key={i}
                      src={url}
                      className="h-40 w-64 rounded border border-gray-200 bg-black object-cover"
                      controls
                    />
                  ) : (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={t("file_alt", { number: i + 1 })}
                        className="h-24 w-24 rounded border border-gray-200 object-cover hover:opacity-80"
                      />
                    </a>
                  )
                )}
              </div>

              {draft.notes && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                  <span className="font-medium text-gray-700">
                    {t("creator_notes_label")}{" "}
                  </span>
                  {draft.notes}
                </p>
              )}

              {draft.reviewNotes && (
                <div className="mt-3 rounded border-l-4 border-gray-300 bg-white px-3 py-2">
                  <p className="text-xs font-medium text-gray-500">
                    {t("reviewer_notes_label")}
                    {draft.reviewerUser?.name
                      ? ` — ${draft.reviewerUser.name}`
                      : ""}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {draft.reviewNotes}
                  </p>
                </div>
              )}

              {/* Reviewer action bar */}
              {mode === "reviewer" && draft.status === "PENDING_REVIEW" && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={reviewNotes[draft.id] ?? ""}
                    onChange={(e) =>
                      setReviewNotes((prev) => ({
                        ...prev,
                        [draft.id]: e.target.value,
                      }))
                    }
                    placeholder={t("review_notes_placeholder")}
                    rows={2}
                    maxLength={2000}
                    className="resize-none bg-white"
                    disabled={reviewingId === draft.id}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(draft.id, false)}
                      disabled={reviewingId === draft.id}
                    >
                      <XCircle className="h-4 w-4" />
                      {t("request_changes")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleReview(draft.id, true)}
                      disabled={reviewingId === draft.id}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t("approve")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: DraftStatus;
  t: (key: string) => string;
}) {
  const styles: Record<DraftStatus, string> = {
    PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const labels: Record<DraftStatus, string> = {
    PENDING_REVIEW: t("status_pending"),
    APPROVED: t("status_approved"),
    REJECTED: t("status_rejected"),
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
