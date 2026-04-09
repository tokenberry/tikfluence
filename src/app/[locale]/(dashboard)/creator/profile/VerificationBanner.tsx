"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BadgeCheck, Copy, Check, Loader2, AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface VerificationBannerProps {
  creatorId: string
  isVerified: boolean
  verifiedAt: string | null
  verificationMethod: string | null
  existingCode: string | null
  codeExpiresAt: string | null
}

type BannerState = "idle" | "redirecting" | "code-shown" | "checking" | "verified" | "failed"

const ERROR_MESSAGES: Record<string, string> = {
  denied: "You cancelled the TikTok authorization. Please try again.",
  expired: "Verification session expired. Please try again.",
  user_mismatch: "Session mismatch. Please log in and try again.",
  token_failed: "Failed to connect to TikTok. Please try again.",
  no_token: "TikTok did not return an access token. Please try again.",
  userinfo_failed: "Could not fetch your TikTok profile. Please try again.",
  no_username: "TikTok did not return your username. Please try again.",
  username_mismatch: "The TikTok account you logged into does not match the username on your profile.",
  server: "Something went wrong. Please try again later.",
  missing_params: "Invalid callback. Please try again.",
  config: "Server configuration error. Please contact support.",
}

export default function VerificationBanner({
  creatorId,
  isVerified,
  verifiedAt,
  verificationMethod,
  existingCode,
  codeExpiresAt,
}: VerificationBannerProps) {
  const searchParams = useSearchParams()
  const tv = useTranslations("verification")
  const hasActiveCode =
    existingCode && codeExpiresAt && new Date(codeExpiresAt) > new Date()

  const [state, setState] = useState<BannerState>(
    isVerified ? "verified" : hasActiveCode ? "code-shown" : "idle"
  )
  const [code, setCode] = useState(existingCode ?? "")
  const [expiresAt, setExpiresAt] = useState(codeExpiresAt ?? "")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [showBioCode, setShowBioCode] = useState(!!hasActiveCode)

  // Handle redirect params from OAuth callback. This is a one-shot effect that
  // syncs URL state into local component state on mount / when params change;
  // it doesn't cascade because the deps don't change as a result of setState.
  useEffect(() => {
    const verify = searchParams.get("verify")
    const reason = searchParams.get("reason")

    if (verify === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("verified")
    } else if (verify === "error" && reason) {
      let msg = ERROR_MESSAGES[reason] || "Verification failed. Please try again."

      if (reason === "username_mismatch") {
        const got = searchParams.get("got")
        const expected = searchParams.get("expected")
        if (got && expected) {
          msg = `The TikTok account you logged into (@${got}) does not match your profile username (@${expected}). Please update your profile or log in with the correct TikTok account.`
        }
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(msg)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("idle")
    }
  }, [searchParams])

  const startOAuthVerification = async () => {
    setError("")
    setState("redirecting")
    try {
      const res = await fetch(`/api/creators/${creatorId}/verify-tiktok`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to start verification")
        setState("idle")
        return
      }
      // Redirect to TikTok
      window.location.href = data.authUrl
    } catch {
      setError("Network error. Please try again.")
      setState("idle")
    }
  }

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
    <Alert variant="warning" className="p-5 shadow-sm">
      <AlertCircle />
      <AlertTitle className="font-semibold">Verify your TikTok account</AlertTitle>
      <AlertDescription>
        <p>
          Verified creators get a badge visible to brands, increasing trust and order opportunities.
        </p>

        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}

        {/* Primary: OAuth verification */}
        {(state === "idle" || state === "redirecting") && !showBioCode && (
          <div className="mt-4 space-y-3">
            <button
              onClick={startOAuthVerification}
              disabled={state === "redirecting"}
              className="flex items-center gap-3 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900 disabled:opacity-50"
            >
              {state === "redirecting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" fill="currentColor"/>
                </svg>
              )}
              {state === "redirecting"
                ? "Redirecting to TikTok..."
                : "Verify with TikTok"}
            </button>
            <p className="text-xs text-gray-500">
              You&apos;ll be redirected to TikTok to log in. We&apos;ll match your TikTok username to confirm ownership.
            </p>
          </div>
        )}

        {/* Bio code flow (fallback) */}
        {showBioCode && (state === "idle" || state === "failed") && !code && (
          <button
            onClick={generateCode}
            className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Generate Verification Code
          </button>
        )}

        {(state === "code-shown" || state === "failed") && (
          <div className="mt-4 space-y-4">
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
              <li>{tv("bio_code_step_paste")}</li>
              <li>{tv("bio_code_step_verify")}</li>
            </ol>

            <p className="text-xs text-gray-500">
              {tv("bio_code_expires", {
                time: expiresAt
                  ? new Date(expiresAt).toLocaleString()
                  : tv("bio_code_expires_default"),
              })}
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
      </AlertDescription>
    </Alert>
  )
}
