"use client"

import { useState, useEffect } from "react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { useTranslations } from "next-intl"

export default function AgencySettingsPage() {
  const t = useTranslations("agency")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    description: "",
  })

  useEffect(() => {
    fetch("/api/agency/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.agency) {
          setForm({
            companyName: data.agency.companyName ?? "",
            website: data.agency.website ?? "",
            description: data.agency.description ?? "",
          })
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch("/api/agency/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMessage(t("settings_saved"))
      } else {
        setMessage(t("settings_save_error"))
      }
    } catch {
      setMessage("An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <LoadingSpinner message="Loading settings..." />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">{t("settings_title")}</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">{t("settings_name_label")}</label>
          <input
            type="text"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("settings_website_label")}</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
            placeholder={t("settings_website_placeholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t("settings_description_label")}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
            placeholder={t("settings_description_placeholder")}
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
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
  )
}
