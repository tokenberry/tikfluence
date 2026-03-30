"use client"

import { useState } from "react"
import { BadgeCheck, Copy, Check, Loader2, AlertCircle } from "lucide-react"

interface VerificationBannerProps {
  creatorId: string
  isVerified: boolean
  verifiedAt: string | null
  verificationMethod: string | null
  existingCode: string | null
  codeExpiresAt: string | null
}

type BannerState = "idle" | "code-shown" | "checking" | "verified" | "failed"

export default function VerificationBanner({
  creatorId,
  isVerified,
  verifiedAt,
  verificationMethod,
  existingCode,
  codeExpiresAt,
}: VerificationBannerProps) {
  const hasActiveCode =
    existingCode && codeExpiresAt && new Date(codeExpiresAt) > new Date()

  const [state, setState] = useState<BannerState>(
    isVerified ? "verified" : hasActiveCode ? "code-shown" : "idle"
  )
  const [code, setCode] = useState(existingCode ?? "")
  const [expiresAt, setExpiresAt] = useState(codeExpiresAt ?? "")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const generateCode = async () => {
    setError("")
    try {
      const res = await fetch(`/api/creators/${creatorId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate code")
        return
      }
      setCode(data.verificationCode)
      setExpiresAt(data.expiresAt)
      setState("code-shown")
    } catch {
      setError("Network error. Please try again.")
    }
  }

  const checkVerification = async () => {
    setError("")
    setState("checking")
    try {
      const res = await fetch(`/api/creators/${creatorId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Verification failed")
        setState("code-shown")
        return
      }
      if (data.verified) {
        setState("verified")
      } else {
        setError(data.message || "Code not found in bio.")
        setState("failed")
      }
    } catch {
      setError("Network error. Please try again.")
      setState("code-shown")
    }
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Verified state
  if (state === "verified") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <BadgeCheck className="h-6 w-6 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-800">
            TikTok Account Verified
            {verificationMethod === "OAUTH" && " via TikTok Login"}
          </p>
          {verifiedAt && (
            <p className="text-sm text-emerald-600">
              Verified on {new Date(verifiedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Unverified states
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800">
            Verify your TikTok account
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Verified creators get a badge visible to brands, increasing trust and order opportunities.
          </p>

          {error && (
            <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
          )}

          {state === "idle" && (
            <button
              onClick={generateCode}
              className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              Start Verification
            </button>
          )}

          {(state === "code-shown" || state === "failed") && (
            <div className="mt-4 space-y-4">
              {/* Steps */}
              <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
                <li>
                  Copy this code:{" "}
                  <span className="inline-flex items-center gap-1.5 rounded bg-white px-2 py-1 font-mono text-sm font-bold text-gray-900 border border-gray-300">
                    {code}
                    <button
                      onClick={copyCode}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </span>
                </li>
                <li>
                  Open TikTok and paste this code anywhere in your bio
                </li>
                <li>
                  Come back here and click &quot;Verify Now&quot;
                </li>
              </ol>

              <p className="text-xs text-gray-500">
                Code expires{" "}
                {expiresAt
                  ? new Date(expiresAt).toLocaleString()
                  : "in 24 hours"}
                . You can remove the code from your bio after verification.
              </p>

              <button
                onClick={checkVerification}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Verify Now
              </button>
            </div>
          )}

          {state === "checking" && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your TikTok bio...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
