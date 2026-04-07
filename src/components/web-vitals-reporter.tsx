"use client"

import { useReportWebVitals } from "next/web-vitals"

/**
 * Reports Core Web Vitals (LCP, CLS, INP, FID, TTFB, FCP) emitted by
 * Next.js's built-in metric collector.
 *
 * In development we log each metric to the console so we can eyeball
 * regressions locally. In production we beacon them to `/api/web-vitals`
 * (a lightweight sink that #7b observability will wire up to structured
 * logging / analytics). For now the send path is a no-op when the
 * endpoint doesn't exist — `navigator.sendBeacon` returns false and we
 * silently fall back.
 *
 * This component renders nothing. Mount it once, as high in the tree as
 * possible, so it captures metrics for every route.
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[web-vitals] ${metric.name}=${metric.value.toFixed(1)} (${metric.rating})`
      )
      return
    }

    // Production: fire-and-forget beacon. #7b will add the server sink.
    try {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.pathname,
      })
      if (typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/web-vitals", body)
      }
    } catch {
      // Swallow — telemetry must never break the page.
    }
  })

  return null
}
