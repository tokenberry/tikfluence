"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import CreatorCard from "@/components/CreatorCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { DataPagination } from "@/components/ui/pagination";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface CreatorResult {
  id: string;
  tiktokUsername: string;
  followerCount: number;
  avgViews: number;
  score: number;
  tier: number;
  pricePerThousand: number;
  supportsLive: boolean;
  supportsShortVideo: boolean;
  user: { name: string; avatar: string | null };
  categories: Array<{ category: { name: string } }>;
}

export default function AgencyBrowseCreatorsPage() {
  const t = useTranslations("browse");
  const cardLabels = useMemo(
    () => ({
      followers: t("followers"),
      avgViews: t("avg_views"),
      score: t("score"),
      badgeVideo: t("badge_video"),
      badgeLive: t("badge_live"),
    }),
    [t]
  );
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [contentFilter, setContentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      if (tierFilter) params.set("tier", tierFilter);
      if (contentFilter) params.set("contentType", contentFilter);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/creators?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators ?? []);
        if (data.pagination) {
          setPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, tierFilter, contentFilter, page]);

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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("search")}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        >
          <option value="">{t("all_categories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        >
          <option value="">{t("all_tiers")}</option>
          <option value="1">Bronze</option>
          <option value="2">Silver</option>
          <option value="3">Gold</option>
          <option value="4">Platinum</option>
          <option value="5">Diamond</option>
        </select>
        <select
          value={contentFilter}
          onChange={(e) => { setContentFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
        >
          <option value="">{t("all_content_types")}</option>
          <option value="video">Short Video</option>
          <option value="live">LIVE Stream</option>
        </select>
      </div>

      {/* Creator Grid */}
      {loading ? (
        <LoadingSpinner message={t("loading")} />
      ) : creators.length === 0 ? (
        <EmptyState title={t("empty_title")} description={t("empty_desc")} icon={<Users className="h-6 w-6" />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              href={`/agency/browse/${creator.id}`}
              labels={cardLabels}
            />
          ))}
        </div>
      )}

      <DataPagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={12}
        onPageChange={setPage}
      />
    </div>
  );
}
