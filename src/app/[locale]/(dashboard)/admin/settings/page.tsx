"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminSettingsPage() {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    platformFeeRate: "0.15",
    minOrderBudget: "5.00",
    maxOrderBudget: "100000",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setForm({
            platformFeeRate: String(data.settings.platformFeeRate),
            minOrderBudget: String(data.settings.minOrderBudget),
            maxOrderBudget: String(data.settings.maxOrderBudget),
          });
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformFeeRate: parseFloat(form.platformFeeRate),
          minOrderBudget: parseFloat(form.minOrderBudget),
          maxOrderBudget: parseFloat(form.maxOrderBudget),
        }),
      });
      if (res.ok) {
        setMessage(t("settings_saved"));
      } else {
        setMessage(t("settings_save_error"));
      }
    } catch {
      setMessage(t("settings_save_error"));
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("settings_title")}</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("settings_fee_label")}
          </label>
          <p className="text-xs text-gray-500">
            {t("settings_fee_hint")}
          </p>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            required
            value={form.platformFeeRate}
            onChange={(e) => setForm({ ...form, platformFeeRate: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("settings_min_budget")}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.minOrderBudget}
            onChange={(e) => setForm({ ...form, minOrderBudget: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t("settings_max_budget")}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.maxOrderBudget}
            onChange={(e) => setForm({ ...form, maxOrderBudget: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message === t("settings_saved") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#d4772c] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
        >
          {loading ? "Saving..." : t("settings_save")}
        </button>
      </form>
    </div>
  );
}
