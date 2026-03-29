"use client"

import { useState, useEffect } from "react"

interface Analysis {
  performanceSummary: string
  performanceScore: number
  metricsBreakdown: string
  briefAlignment: string
  audienceEngagement: string
  strengths: string[]
  improvements: string[]
  whatsNext: string[]
  recommendedNextOrder: string | null
  createdAt: string
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-700"
      : score >= 60
      ? "bg-blue-100 text-blue-700"
      : score >= 40
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700"
  const label =
    score >= 80
      ? "Excellent"
      : score >= 60
      ? "Good"
      : score >= 40
      ? "Fair"
      : "Needs Improvement"

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-3 py-1 text-sm font-bold ${color}`}>
        {score}/100
      </span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  )
}

export default function DeliveryAiInsights({ orderId }: { orderId: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${orderId}/ai-analysis`)
      .then((res) => res.json())
      .then((data) => setAnalysis(data.analysis ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#d4772c]" />
          <span className="text-sm text-gray-500">Loading AI analysis...</span>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="text-sm text-gray-500">
          AI delivery analysis will appear here once the order is approved.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-[#fdf6e3] to-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Performance Analysis</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Generated {new Date(analysis.createdAt).toLocaleDateString()}
            </p>
          </div>
          <ScoreBadge score={analysis.performanceScore} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.performanceSummary}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-gray-100">
        <div className="px-6 py-4 sm:border-r border-b sm:border-b-0 border-gray-100">
          <h4 className="text-sm font-semibold text-green-700 mb-2">Strengths</h4>
          <ul className="space-y-1.5">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 py-4">
          <h4 className="text-sm font-semibold text-orange-700 mb-2">Areas to Improve</h4>
          <ul className="space-y-1.5">
            {analysis.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-500 mt-0.5 shrink-0">-</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* What's Next */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-[#d4772c] mb-2">What&apos;s Next</h4>
        <ul className="space-y-2">
          {analysis.whatsNext.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-[#d4772c] font-bold mt-0.5 shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ul>
        {analysis.recommendedNextOrder && (
          <div className="mt-3 rounded-md bg-[#fdf6e3] p-3">
            <p className="text-sm text-[#b85c1a]">
              <span className="font-semibold">Recommended next campaign:</span>{" "}
              {analysis.recommendedNextOrder}
            </p>
          </div>
        )}
      </div>

      {/* Expandable details */}
      <div className="px-6 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-[#d4772c] hover:text-[#b85c1a] transition-colors"
        >
          {expanded ? "Hide detailed analysis" : "Show detailed analysis"}
        </button>
      </div>

      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Metrics Breakdown</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.metricsBreakdown}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Brief Alignment</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.briefAlignment}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Audience Engagement</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{analysis.audienceEngagement}</p>
          </div>
        </div>
      )}
    </div>
  )
}
