"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type OrderType = "SHORT_VIDEO" | "LIVE" | "COMBO";

export default function NewOrderPage() {
  const t = useTranslations("brand");
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
    maxCreators: "1",
    deadline: "",
  });

  const ORDER_TYPES: { value: OrderType; label: string; description: string; icon: string }[] = [
    {
      value: "SHORT_VIDEO",
      label: t("new_order_type_video"),
      description: t("new_order_type_video_desc"),
      icon: "🎬",
    },
    {
      value: "LIVE",
      label: t("new_order_type_live"),
      description: t("new_order_type_live_desc"),
      icon: "🔴",
    },
    {
      value: "COMBO",
      label: t("new_order_type_combo"),
      description: t("new_order_type_combo_desc"),
      icon: "⚡",
    },
  ];

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
          maxCreators: parseInt(form.maxCreators) || 1,
          deadline: form.deadline,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/brand/orders/${data.id ?? data.order?.id ?? ""}`);
      } else {
        const data = await res.json();
        toast.error(data.error ?? t("new_order_error"));
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const inputClasses =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <a href="/brand/orders" className="text-gray-500 hover:text-gray-700">
          &larr; {t("new_order_back")}
        </a>
        <h1 className="text-3xl font-bold text-gray-900">{t("new_order_title")}</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Order Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t("new_order_type_label")}</label>
          {creatorSupport && (
            <p className="text-xs text-gray-500 mb-2">
              Creating order for <span className="font-medium text-gray-700">{creatorSupport.name}</span> —
              supports {[
                creatorSupport.supportsShortVideo && t("new_order_type_video"),
                creatorSupport.supportsLive && t("new_order_type_live"),
              ].filter(Boolean).join(" & ") || "no content types"}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {ORDER_TYPES.map((type) => {
              const isLocked = creatorSupport
                ? (type.value === "LIVE" && !creatorSupport.supportsLive) ||
                  (type.value === "SHORT_VIDEO" && !creatorSupport.supportsShortVideo) ||
                  (type.value === "COMBO" && (!creatorSupport.supportsLive || !creatorSupport.supportsShortVideo))
                : false;

              return (
                <button
                  key={type.value}
                  type="button"
                  disabled={isLocked}
                  onClick={() => !isLocked && setOrderType(type.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${
                    isLocked
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : orderType === type.value
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {isLocked ? "Creator doesn\u0027t support this type" : type.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LIVE Restriction Warning */}
        {showLiveFields && (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertTitle>{t("new_order_live_warning_title")}</AlertTitle>
            <AlertDescription>{t("new_order_live_warning")}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("new_order_field_title")}</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClasses}
            placeholder={t("new_order_field_title_placeholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("new_order_field_desc")}</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={inputClasses}
            placeholder={t("new_order_field_desc_placeholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("new_order_field_brief")}</label>
          <textarea
            value={form.brief}
            onChange={(e) => setForm({ ...form, brief: e.target.value })}
            rows={4}
            className={inputClasses}
            placeholder={t("new_order_field_brief_placeholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("new_order_field_category")}</label>
          <Select
            required
            value={form.categoryId}
            onValueChange={(value) => setForm({ ...form, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("new_order_field_category_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    {t("new_order_field_impressions")}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.impressionTarget}
                    onChange={(e) => setForm({ ...form, impressionTarget: e.target.value })}
                    className={inputClasses}
                    placeholder={t("new_order_field_impressions_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t("new_order_field_budget")}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className={inputClasses}
                    placeholder={t("new_order_field_budget_placeholder")}
                  />
                </div>
              </div>
            </div>

            {/* CPM Preview */}
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                {t("new_order_cpm_preview", { rate: cpmRate > 0 ? formatCurrency(cpmRate) : "--" })}
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
                  {t("new_order_field_flat_fee")}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={form.liveFlatFee}
                  onChange={(e) => setForm({ ...form, liveFlatFee: e.target.value })}
                  className={inputClasses}
                  placeholder={t("new_order_field_flat_fee_placeholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("new_order_field_min_duration")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.liveMinDuration}
                  onChange={(e) => setForm({ ...form, liveMinDuration: e.target.value })}
                  className={inputClasses}
                  placeholder={t("new_order_field_min_duration_placeholder")}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                {t("new_order_field_guidelines")}
              </label>
              <textarea
                value={form.liveGuidelines}
                onChange={(e) => setForm({ ...form, liveGuidelines: e.target.value })}
                rows={3}
                className={inputClasses}
                placeholder={t("new_order_field_guidelines_placeholder")}
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
          <label className="block text-sm font-medium text-gray-700">{t("new_order_field_max_creators")}</label>
          <input
            type="number"
            required
            min="1"
            max="100"
            value={form.maxCreators}
            onChange={(e) => setForm({ ...form, maxCreators: e.target.value })}
            className={inputClasses}
            placeholder="1"
          />
          <p className="mt-1 text-xs text-gray-400">
            {t("new_order_field_max_creators_hint")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("new_order_field_deadline")}</label>
          <input
            type="date"
            required
            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-gray-400">{t("new_order_field_deadline_hint")}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? t("new_order_submit_loading") : t("new_order_submit")}
        </button>
      </form>
    </div>
  );
}
