"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCreatorPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<"email" | "tiktok">("email");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{
    id: string;
    tiktokUsername: string;
    user: { name: string; email: string };
    followerCount: number;
    score: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/network/creators/search?type=${searchType}&q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.creators ?? []);
        if ((data.creators ?? []).length === 0) {
          setMessage("No creators found.");
        }
      } else {
        setMessage("Search failed.");
      }
    } catch {
      setMessage("An error occurred.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(creatorId: string) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/network/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      if (res.ok) {
        router.push("/network/creators");
      } else {
        const data = await res.json();
        setMessage(data.error ?? "Failed to add creator.");
      }
    } catch {
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <a href="/network/creators" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </a>
        <h1 className="text-3xl font-bold text-gray-900">Add Creator</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setSearchType("email")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                searchType === "email"
                  ? "bg-[#d4772c] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Search by Email
            </button>
            <button
              type="button"
              onClick={() => setSearchType("tiktok")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                searchType === "tiktok"
                  ? "bg-[#d4772c] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Search by TikTok Username
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === "email" ? "creator@example.com" : "@username"}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-4 text-sm text-gray-600">{message}</p>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            {results.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{creator.user.name}</p>
                  <p className="text-sm text-gray-500">
                    @{creator.tiktokUsername} &middot; {creator.user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {creator.followerCount.toLocaleString()} followers &middot; Score: {creator.score.toFixed(1)}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(creator.id)}
                  disabled={loading}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Add to Network
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
