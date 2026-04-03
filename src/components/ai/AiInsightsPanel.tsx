"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/Toast"

interface Analysis {
  summary: string
  strengths: string[]
  weaknesses: string[]
  bestContentTypes: string[]
  audienceInsights: string | null
  contentStyle: string | null
  recommendedCpm: number | null
  createdAt: string
}

const contentTypeLabels: Record<string, { label: string; color: string }> = {
  SHORT_VIDEO: { label: "Short Video", color: "bg-blue-100 text-blue-700" },
  LIVE: { label: "LIVE Stream", color: "bg-red-100 text-red-700" },
  COMBO: { label: "Combo", color: "bg-purple-100 text-purple-700" },
}

export default function AiInsightsPanel({
  creatorId,
  initialAnalysis,
}: {
  creatorId: string
  initialAnalysis: Analysis | null
}) {
  const { toast } = useToast()
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch(`/api/creators/${creatorId}/ai-analyze`, {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis({ ...data, createdAt: new Date().toISOString() })
        toast("success", "AI analysis complete!")
      } else {
        const err = await res.json()
        toast("error", err.error ?? "Failed to run AI analysis.")
      }
    } catch {
      toast("error", "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50/50 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">AI Insights</h2>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-lg bg-[#d4772c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
        >
          {loading ? "Analyzing..." : analysis ? "Refresh Analysis" : "Run AI Analysis"}
        </button>
      </div>

      {!analysis ? (
        <p className="mt-3 text-sm text-gray-500">
          Click &quot;Run AI Analysis&quot; to get AI-powered insights about this creator to help you decide.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700">{analysis.summary}</p>

          {analysis.bestContentTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Best for:</p>
              <div className="flex gap-1.5">
                {analysis.bestContentTypes.map((type) => {
                  const ct = contentTypeLabels[type]
                  return (
                    <span
                      key={type}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ct?.color ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {ct?.label ?? type}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
              <ul className="space-y-0.5">
                {analysis.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-xs text-gray-600">+ {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 mb-1">Consider</p>
              <ul className="space-y-0.5">
                {analysis.weaknesses.slice(0, 2).map((w, i) => (
                  <li key={i} className="text-xs text-gray-600">- {w}</li>
                ))}
              </ul>
            </div>
          </div>

          {analysis.audienceInsights && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Audience Insights</p>
              <p className="text-xs text-gray-600">{analysis.audienceInsights}</p>
            </div>
          )}

          {analysis.contentStyle && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Content Style</p>
              <p className="text-xs text-gray-600">{analysis.contentStyle}</p>
            </div>
          )}

          {analysis.recommendedCpm != null && (
            <p className="text-xs text-orange-700">
              AI Recommended CPM: <span className="font-bold">${analysis.recommendedCpm.toFixed(2)}</span>
            </p>
          )}

          {analysis.createdAt && (
            <p className="text-xs text-gray-400">
              Analysis generated: {new Date(analysis.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
