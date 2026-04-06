"use client";

import { useState, useEffect, useCallback } from "react";
import { formatNumber, formatCurrency } from "@/lib/utils";

const tierLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Bronze", color: "bg-amber-700 text-white" },
  2: { label: "Silver", color: "bg-gray-400 text-white" },
  3: { label: "Gold", color: "bg-yellow-500 text-white" },
  4: { label: "Platinum", color: "bg-cyan-400 text-gray-900" },
  5: { label: "Diamond", color: "bg-purple-500 text-white" },
};

interface CreatorResult {
  id: string;
  tiktokUsername: string;
  followerCount: number;
  avgViews: number;
  score: number;
  tier: number;
  pricePerThousand: number;
  user: { name: string; avatar: string | null };
  categories: Array<{ category: { name: string } }>;
}

export default function BrowseCreatorsPage() {
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (tierFilter) params.set("tier", tierFilter);

      const res = await fetch(`/api/creators?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, tierFilter]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchCreators, 300);
    return () => clearTimeout(timeout);
  }, [fetchCreators]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Creators</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Tiers</option>
          <option value="1">Bronze</option>
          <option value="2">Silver</option>
          <option value="3">Gold</option>
          <option value="4">Platinum</option>
          <option value="5">Diamond</option>
        </select>
      </div>

      {/* Creator Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading creators...</div>
      ) : creators.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No creators found matching your filters.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => {
            const tier = tierLabels[creator.tier] ?? tierLabels[1];
            return (
              <a
                key={creator.id}
                href={`/brand/browse/${creator.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                    {creator.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{creator.user.name}</h3>
                    <p className="text-sm text-gray-500">@{creator.tiktokUsername}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(creator.followerCount)}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(creator.avgViews)}</p>
                    <p className="text-xs text-gray-500">Avg Views</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-indigo-600">{creator.score.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {creator.categories.slice(0, 2).map(({ category }, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(creator.pricePerThousand)}/1K
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
