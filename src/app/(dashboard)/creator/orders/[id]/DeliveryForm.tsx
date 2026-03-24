"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeliveryForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tiktokLink: "",
    screenshotUrl: "",
    impressions: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiktokLink: form.tiktokLink,
          screenshotUrl: form.screenshotUrl || undefined,
          impressions: form.impressions ? parseInt(form.impressions) : undefined,
          views: form.views ? parseInt(form.views) : undefined,
          likes: form.likes ? parseInt(form.likes) : undefined,
          comments: form.comments ? parseInt(form.comments) : undefined,
          shares: form.shares ? parseInt(form.shares) : undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        router.refresh();
        setForm({
          tiktokLink: "",
          screenshotUrl: "",
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
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">TikTok Link *</label>
        <input
          type="url"
          required
          value={form.tiktokLink}
          onChange={(e) => setForm({ ...form, tiktokLink: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="https://www.tiktok.com/@user/video/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Screenshot URL</label>
        <input
          type="url"
          value={form.screenshotUrl}
          onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Link to screenshot"
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
        {loading ? "Submitting..." : "Submit Delivery"}
      </button>
    </form>
  );
}
