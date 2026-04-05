"use client"

import { useState } from "react"

export default function ContentTypeEditor({
  creatorId,
  initialShortVideo,
  initialLive,
}: {
  creatorId: string
  initialShortVideo: boolean
  initialLive: boolean
}) {
  const [supportsShortVideo, setSupportsShortVideo] = useState(initialShortVideo)
  const [supportsLive, setSupportsLive] = useState(initialLive)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasChanges =
    supportsShortVideo !== initialShortVideo || supportsLive !== initialLive

  const handleSave = async () => {
    if (!supportsShortVideo && !supportsLive) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/creators/${creatorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportsShortVideo, supportsLive }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Content Types</h2>
      <p className="mt-1 text-sm text-gray-500">
        Select the content types you can create. Orders that require unsupported types won&apos;t be available to you.
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => setSupportsShortVideo(!supportsShortVideo)}
          className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            supportsShortVideo
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          Short Video
        </button>
        <button
          type="button"
          onClick={() => setSupportsLive(!supportsLive)}
          className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
            supportsLive
              ? "border-red-500 bg-red-50 text-red-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          LIVE Stream
        </button>
      </div>
      {!supportsShortVideo && !supportsLive && (
        <p className="mt-2 text-xs text-red-500">You must support at least one content type.</p>
      )}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving || (!supportsShortVideo && !supportsLive)}
          className="mt-3 rounded-md bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b85c1a] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}
      {saved && (
        <p className="mt-2 text-sm text-green-600">Content types updated.</p>
      )}
    </div>
  )
}
