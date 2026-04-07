"use client"

import { useEffect } from "react"
import { logger } from "@/lib/logger"

/**
 * Root-level error boundary.
 *
 * `src/app/[locale]/error.tsx` already handles errors thrown within a
 * locale segment (which covers 99% of the app), but errors that bubble
 * out of the root layout itself — e.g. a crash in `next-intl` message
 * loading or the auth cookie parsing — escape that boundary entirely.
 * Next.js falls back to `app/global-error.tsx` for those cases, and
 * without this file the user sees the framework's raw default error
 * page with no way to recover.
 *
 * This component must render its own `<html>` + `<body>` because it
 * completely replaces the root layout when it fires. It also must be a
 * client component (same rule as any error boundary in the App Router).
 *
 * On mount we log the error through the structured logger so it shows
 * up in `console.error` in dev and as a JSON line in prod — same shape
 * as every other error in the system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error(
      { event: "root_error_boundary", err: error, digest: error.digest },
      "Unhandled error in root layout"
    )
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdf6e3",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "3.5rem", fontWeight: 700, color: "#1f2937" }}>
          500
        </h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.25rem",
            color: "#4b5563",
          }}
        >
          Something went wrong.
        </p>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          Our team has been notified. Try reloading the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "2rem",
            background: "#d4772c",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
