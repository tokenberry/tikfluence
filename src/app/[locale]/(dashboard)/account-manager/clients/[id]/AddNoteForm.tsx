"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddNoteFormProps {
  brandId?: string;
  agencyId?: string;
}

export default function AddNoteForm({ brandId, agencyId }: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account-manager/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          ...(brandId ? { brandId } : {}),
          ...(agencyId ? { agencyId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add note");
        return;
      }

      setContent("");
      router.refresh();
    } catch {
      setError("Failed to add note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write an internal note..."
        aria-label="Internal note content"
        rows={3}
        className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Note"}
      </button>
    </form>
  );
}
