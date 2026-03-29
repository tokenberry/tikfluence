"use client";

import { useState, useEffect } from "react";

interface Analysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bestContentTypes: string[];
  audienceInsights: string | null;
  contentStyle: string | null;
  recommendedCpm: number | null;
  createdAt: string;
}

export default function AiInsights({ creatorId }: { creatorId: string }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`/api/creators/${creatorId}/ai-analyze`)
      .then((res) => res.json())
      .then((data) => setAnalysis(data.analysis ?? null))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [creatorId]);

  async function runAnalysis() {
    setLoading(true);
    try {
      const res = await fetch(`/api/creators/${creatorId}/ai-analyze`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis({ ...data, createdAt: new Date().toISOString() });
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to run AI analysis.");
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const contentTypeLabels: Record<string, { label: string; color: string }> = {
    SHORT_VIDEO: { label: "Short Video", color: "bg-blue-100 text-blue-700" },
    LIVE: { label: "LIVE Stream", color: "bg-red-100 text-red-700" },
    COMBO: { label: "Combo", color: "bg-purple-100 text-purple-700" },
  };

  if (fetching) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        <p className="mt-2 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : analysis ? "Refresh Analysis" : "Run AI Analysis"}
        </button>
      </div>

      {!analysis ? (
        <p className="mt-3 text-sm text-gray-500">
          No AI analysis yet. Click &quot;Run AI Analysis&quot; to get personalized insights about your profile.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Summary */}
          <p className="text-sm text-gray-700">{analysis.summary}</p>

          {/* Best Content Types */}
          {analysis.bestContentTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1.5">Best Suited For</h4>
              <div className="flex gap-2">
                {analysis.bestContentTypes.map((type) => {
                  const ct = contentTypeLabels[type];
                  return (
                    <span
                      key={type}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ct?.color ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {ct?.label ?? type}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase text-green-600 mb-1.5">Strengths</h4>
              <ul className="space-y-1">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-amber-600 mb-1.5">Areas to Improve</h4>
              <ul className="space-y-1">
                {analysis.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5">-</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Audience & Content Style */}
          {analysis.audienceInsights && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Audience Insights</h4>
              <p className="text-sm text-gray-600">{analysis.audienceInsights}</p>
            </div>
          )}

          {analysis.contentStyle && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Content Style</h4>
              <p className="text-sm text-gray-600">{analysis.contentStyle}</p>
            </div>
          )}

          {/* Recommended CPM */}
          {analysis.recommendedCpm != null && (
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-sm text-orange-700">
                AI Recommended CPM: <span className="font-bold">${analysis.recommendedCpm.toFixed(2)}</span> per 1,000 impressions
              </p>
            </div>
          )}

          {/* Last updated */}
          {analysis.createdAt && (
            <p className="text-xs text-gray-400">
              Analysis generated: {new Date(analysis.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
