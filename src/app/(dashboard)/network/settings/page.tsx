"use client"

import { useState, useEffect } from "react"

export default function NetworkSettingsPage() {
  const [companyName, setCompanyName] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/network/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.network) {
          setCompanyName(data.network.companyName ?? "")
          setWebsite(data.network.website ?? "")
          setDescription(data.network.description ?? "")
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/network/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, website, description }),
      })
      if (res.ok) {
        setMessage("Settings saved successfully.")
      } else {
        const data = await res.json()
        setMessage(data.error ?? "Failed to save settings.")
      }
    } catch {
      setMessage("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-32 rounded bg-gray-200" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Network Settings</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Name *</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell brands about your network..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !companyName}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
