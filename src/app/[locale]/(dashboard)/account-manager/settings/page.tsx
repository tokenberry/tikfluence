"use client"

import { useState, useEffect } from "react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { useTranslations } from "next-intl"

export default function AccountManagerSettingsPage() {
  const t = useTranslations("common")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
  })

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setForm({
            name: data.user.name ?? "",
            email: data.user.email ?? "",
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
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      })
      if (res.ok) {
        setMessage("Settings saved successfully.")
      } else {
        setMessage("Failed to save settings.")
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
      <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            disabled
            value={form.email}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
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
          {loading ? t("saving") : "Save Settings"}
        </button>
      </form>
    </div>
  )
}
