"use client"

import dynamic from "next/dynamic"

/**
 * Lazy re-exports for the four recharts-backed chart components in
 * `AnalyticsCharts.tsx`.
 *
 * `next/dynamic` requires a client component, so this file exists purely
 * as a thin wrapper that defers loading recharts (~400KB gzipped) until
 * the browser actually needs it. `ssr: false` means recharts is never
 * bundled into the server render for the analytics route either —
 * we render a skeleton on the server and hydrate the real charts after.
 *
 * The page stays a server component and just imports from here instead
 * of from `./AnalyticsCharts` directly.
 */

function ChartSkeleton() {
  return (
    <div
      className="h-64 w-full animate-pulse rounded-lg bg-gray-100"
      aria-hidden
    />
  )
}

export const OrderStatusChart = dynamic(
  () =>
    import("./AnalyticsCharts").then((m) => ({ default: m.OrderStatusChart })),
  { ssr: false, loading: ChartSkeleton }
)

export const UserRoleChart = dynamic(
  () =>
    import("./AnalyticsCharts").then((m) => ({ default: m.UserRoleChart })),
  { ssr: false, loading: ChartSkeleton }
)

export const OrderTrendChart = dynamic(
  () =>
    import("./AnalyticsCharts").then((m) => ({ default: m.OrderTrendChart })),
  { ssr: false, loading: ChartSkeleton }
)

export const RevenueTrendChart = dynamic(
  () =>
    import("./AnalyticsCharts").then((m) => ({
      default: m.RevenueTrendChart,
    })),
  { ssr: false, loading: ChartSkeleton }
)
