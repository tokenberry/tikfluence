"use client"

import { useState, useEffect } from "react"

export default function CreatorSettingsPage() {
  const [bio, setBio] = useState("")
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [creatorId, setCreatorId] = useState("")

  useEffect(() => {
    fetch("/api/creators/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.creator) {
          setCreatorId(data.creator.id)
          setBio(data.creator.bio ?? "")
          setPortfolioLinks(data.creator.portfolioLinks ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const addLink = () => {
    const trimmed = newLink.trim()
    if (trimmed && !portfolioLinks.includes(trimmed)) {
      setPortfolioLinks([...portfolioLinks, trimmed])
      setNewLink("")
    }
  }

  const removeLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch(`/api/creators/${creatorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, portfolioLinks }),
      })
      if (res.ok) {
        setMessage("Settings saved successfully.")
      } else {
        setMessage("Failed to save settings.")
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
      <h1 className="text-2xl font-bold text-gray-900">Creator Settings</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={1000}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
            placeholder="Tell brands about yourself..."
          />
          <p className="mt-1 text-xs text-gray-400">{bio.length}/1000</p>
        </div>

        {/* Portfolio Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Portfolio Links</label>
          <div className="mt-2 space-y-2">
            {portfolioLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-[#d4772c] hover:underline"
                >
                  {link}
                </a>
                <button
                  onClick={() => removeLink(i)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {portfolioLinks.length < 10 && (
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:ring-1 focus:ring-[#d4772c]"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
              />
              <button
                onClick={addLink}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Add
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">{portfolioLinks.length}/10 links</p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
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
