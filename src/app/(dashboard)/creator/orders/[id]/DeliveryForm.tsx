"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function DeliveryForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tiktokLinks, setTiktokLinks] = useState<string[]>([""]);
  const [screenshots, setScreenshots] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    impressions: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const MAX_SCREENSHOTS = 10;

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const newFiles: { file: File; preview: string }[] = [];

      for (const file of Array.from(files)) {
        if (screenshots.length + newFiles.length >= MAX_SCREENSHOTS) break;
        if (!allowed.includes(file.type)) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        newFiles.push({ file, preview: URL.createObjectURL(file) });
      }

      setScreenshots((prev) => [...prev, ...newFiles].slice(0, MAX_SCREENSHOTS));
    },
    [screenshots.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    },
    [addFiles]
  );

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const addLinkField = () => {
    setTiktokLinks((prev) => [...prev, ""]);
  };

  const removeLinkField = (index: number) => {
    if (tiktokLinks.length === 1) return;
    setTiktokLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, value: string) => {
    setTiktokLinks((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  async function uploadScreenshots(): Promise<string[]> {
    const urls: string[] = [];
    for (const { file } of screenshots) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        urls.push(data.url);
      }
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLinks = tiktokLinks.filter((l) => l.trim());
    if (validLinks.length === 0) {
      alert("Please add at least one TikTok link.");
      return;
    }

    setLoading(true);
    try {
      setUploading(true);
      const uploadedUrls = await uploadScreenshots();
      setUploading(false);

      const [primaryLink, ...additionalLinks] = validLinks;

      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktokLink: primaryLink,
          tiktokLinks: additionalLinks,
          screenshots: uploadedUrls,
          impressions: form.impressions ? parseInt(form.impressions) : undefined,
          views: form.views ? parseInt(form.views) : undefined,
          likes: form.likes ? parseInt(form.likes) : undefined,
          comments: form.comments ? parseInt(form.comments) : undefined,
          shares: form.shares ? parseInt(form.shares) : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        screenshots.forEach((s) => URL.revokeObjectURL(s.preview));
        router.refresh();
        setTiktokLinks([""]);
        setScreenshots([]);
        setForm({
          impressions: "",
          views: "",
          likes: "",
          comments: "",
          shares: "",
          notes: "",
        });
      } else {
        alert("Failed to submit delivery.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" onPaste={handlePaste}>
      {/* TikTok Links */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            TikTok Links *
          </label>
          <button
            type="button"
            onClick={addLinkField}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            + Add another link
          </button>
        </div>
        <div className="mt-1 space-y-2">
          {tiktokLinks.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => updateLink(i, e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://www.tiktok.com/@user/video/..."
                required={i === 0}
              />
              {tiktokLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinkField(i)}
                  className="rounded-lg border border-gray-300 px-2.5 text-gray-400 hover:border-red-300 hover:text-red-500"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Screenshots Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Screenshots ({screenshots.length}/{MAX_SCREENSHOTS})
        </label>
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={() => fileInputRef.current?.click()}
          className="mt-1 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30"
        >
          {screenshots.length === 0 ? (
            <>
              <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">
                Drag & drop images here, click to browse, or paste from clipboard
              </p>
              <p className="mt-1 text-xs text-gray-400">
                JPEG, PNG, WebP, GIF up to 10MB each
              </p>
            </>
          ) : (
            <div className="flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
              {screenshots.map((s, i) => (
                <div key={i} className="group relative">
                  <img
                    src={s.preview}
                    alt={`Screenshot ${i + 1}`}
                    className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {screenshots.length < MAX_SCREENSHOTS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-2xl text-gray-400 hover:border-indigo-400 hover:text-indigo-500"
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {(["impressions", "views", "likes", "comments", "shares"] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium capitalize text-gray-700">{field}</label>
            <input
              type="number"
              min="0"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {uploading ? "Uploading screenshots..." : loading ? "Submitting..." : "Submit Delivery"}
      </button>
    </form>
  );
}
