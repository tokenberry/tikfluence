"use client";

import { useState } from "react";

export default function RefreshTikTokButton({ creatorId }: { creatorId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/creators/${creatorId}/score`, { method: "POST" });
      if (res.ok) {
        setMessage("TikTok data refreshed successfully!");
        window.location.reload();
      } else {
        setMessage("Failed to refresh data. Please try again.");
      }
    } catch {
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
      >
        {loading ? "Refreshing..." : "Refresh TikTok Data"}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
