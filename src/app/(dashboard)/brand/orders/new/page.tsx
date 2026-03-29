"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type OrderType = "SHORT_VIDEO" | "LIVE" | "COMBO";

const ORDER_TYPES: { value: OrderType; label: string; description: string; icon: string }[] = [
  {
    value: "SHORT_VIDEO",
    label: "Short Video",
    description: "Standard TikTok video ads with flexible brand placement",
    icon: "🎬",
  },
  {
    value: "LIVE",
    label: "LIVE Stream",
    description: "Sponsored live streams with product placement",
    icon: "🔴",
  },
  {
    value: "COMBO",
    label: "Combo",
    description: "Both LIVE stream + Short Video in one campaign",
    icon: "⚡",
  },
];

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorId = searchParams.get("creatorId");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("SHORT_VIDEO");
  const [creatorSupport, setCreatorSupport] = useState<{
    name: string;
    supportsShortVideo: boolean;
    supportsLive: boolean;
  } | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    brief: "",
    categoryId: "",
    impressionTarget: "",
    budget: "",
    liveFlatFee: "",
    liveMinDuration: "",
    liveGuidelines: "",
    deadline: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!creatorId) return;
    fetch(`/api/creators/${creatorId}`)
      .then((res) => res.json())
      .then((data) => {
        setCreatorSupport({
          name: data.user?.name ?? "Creator",
          supportsShortVideo: data.supportsShortVideo ?? true,
          supportsLive: data.supportsLive ?? false,
        });
        // Auto-select the best available type
        if (data.supportsShortVideo && !data.supportsLive) {
          setOrderType("SHORT_VIDEO");
        } else if (!data.supportsShortVideo && data.supportsLive) {
          setOrderType("LIVE");
        }
      })
      .catch(() => {});
  }, [creatorId]);

  const impressions = parseInt(form.impressionTarget) || 0;
  const budget = parseFloat(form.budget) || 0;
  const cpmRate = impressions > 0 ? (budget / impressions) * 1000 : 0;
  const liveFlatFee = parseFloat(form.liveFlatFee) || 0;

  const showVideoFields = orderType === "SHORT_VIDEO" || orderType === "COMBO";
  const showLiveFields = orderType === "LIVE" || orderType === "COMBO";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          brief: form.brief || undefined,
          categoryId: form.categoryId,
          type: orderType,
          impressionTarget: showVideoFields ? impressions : 0,
          budget: showVideoFields ? budget : 0,
          liveFlatFee: showLiveFields ? liveFlatFee : undefined,
          liveMinDuration: showLiveFields && form.liveMinDuration
            ? parseInt(form.liveMinDuration)
            : undefined,
          liveGuidelines: showLiveFields ? form.liveGuidelines || undefined : undefined,
          deadline: form.deadline,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/brand/orders/${data.id ?? data.order?.id ?? ""}`);
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to create order.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const inputClasses =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <a href="/brand/orders" className="text-gray-500 hover:text-gray-700">
          &larr; Back
        </a>
        <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Order Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Order Type *</label>
          {creatorSupport && (
            <p className="text-xs text-gray-500 mb-2">
              Creating order for <span className="font-medium text-gray-700">{creatorSupport.name}</span> —
              supports {[
                creatorSupport.supportsShortVideo && "Short Video",
                creatorSupport.supportsLive && "LIVE Stream",
              ].filter(Boolean).join(" & ") || "no content types"}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {ORDER_TYPES.map((t) => {
              const isLocked = creatorSupport
                ? (t.value === "LIVE" && !creatorSupport.supportsLive) ||
                  (t.value === "SHORT_VIDEO" && !creatorSupport.supportsShortVideo) ||
                  (t.value === "COMBO" && (!creatorSupport.supportsLive || !creatorSupport.supportsShortVideo))
                : false;

              return (
                <button
                  key={t.value}
                  type="button"
                  disabled={isLocked}
                  onClick={() => !isLocked && setOrderType(t.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    isLocked
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : orderType === t.value
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xl mb-1">{t.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {isLocked ? "Creator doesn\u0027t support this type" : t.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LIVE Restriction Warning */}
        {showLiveFields && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-lg">&#9888;</span>
              <div>
                <p className="text-sm font-medium text-amber-800">LIVE Stream Content Restrictions</p>
                <p className="text-xs text-amber-700 mt-1">
                  LIVE streams must use <strong>product placement</strong> or <strong>sponsored gameplay</strong>.
                  Direct brand logos, explicit mentions, or traditional ad formats may result in stream bans or restrictions from TikTok.
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClasses}
            placeholder="Campaign title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={inputClasses}
            placeholder="Describe the campaign..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brief</label>
          <textarea
            value={form.brief}
            onChange={(e) => setForm({ ...form, brief: e.target.value })}
            rows={4}
            className={inputClasses}
            placeholder="Detailed creator brief, talking points, requirements..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className={inputClasses}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* SHORT_VIDEO Fields */}
        {showVideoFields && (
          <>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                {orderType === "COMBO" ? "Short Video Portion" : "Video Metrics & Budget"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Impression Target *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.impressionTarget}
                    onChange={(e) => setForm({ ...form, impressionTarget: e.target.value })}
                    className={inputClasses}
                    placeholder="e.g. 100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget (USD) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className={inputClasses}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
            </div>

            {/* CPM Preview */}
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Calculated CPM Rate:{" "}
                <span className="font-bold">{cpmRate > 0 ? formatCurrency(cpmRate) : "--"}</span>
                <span className="ml-1 text-blue-500">per 1,000 impressions</span>
              </p>
            </div>
          </>
        )}

        {/* LIVE Fields */}
        {showLiveFields && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {orderType === "COMBO" ? "LIVE Stream Portion" : "LIVE Stream Details"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Flat Fee per Stream (USD) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={form.liveFlatFee}
                  onChange={(e) => setForm({ ...form, liveFlatFee: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.liveMinDuration}
                  onChange={(e) => setForm({ ...form, liveMinDuration: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. 60"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Content Guidelines for LIVE
              </label>
              <textarea
                value={form.liveGuidelines}
                onChange={(e) => setForm({ ...form, liveGuidelines: e.target.value })}
                rows={3}
                className={inputClasses}
                placeholder="Describe how the product should be featured during the stream (e.g., product placement on desk, gameplay with sponsored items...)"
              />
            </div>

            {/* LIVE Fee Preview */}
            <div className="mt-3 rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-700">
                LIVE Flat Fee:{" "}
                <span className="font-bold">{liveFlatFee > 0 ? formatCurrency(liveFlatFee) : "--"}</span>
                <span className="ml-1 text-red-500">per stream</span>
              </p>
            </div>
          </div>
        )}

        {/* Total Budget Preview for COMBO */}
        {orderType === "COMBO" && (budget > 0 || liveFlatFee > 0) && (
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-sm text-purple-700">
              Total Campaign Budget:{" "}
              <span className="font-bold">{formatCurrency(budget + liveFlatFee)}</span>
              <span className="ml-1 text-purple-500">
                ({formatCurrency(budget)} video + {formatCurrency(liveFlatFee)} LIVE)
              </span>
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Deadline *</label>
          <input
            type="date"
            required
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-gray-400">The latest date the creator must deliver by</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}
