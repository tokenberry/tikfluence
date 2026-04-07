import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { logger } from "@/lib/logger"

/**
 * Web Vitals sink.
 *
 * Receives the beacon payload posted by `src/components/web-vitals-reporter.tsx`
 * and emits a structured log line per metric. The log line is the
 * permanent home of these events — from Vercel's log drain you can
 * forward them to whatever analytics store you like (Datadog, Honeycomb,
 * a BigQuery table, etc.) without having to change this endpoint.
 *
 * This route is deliberately:
 *   • unauthenticated (Web Vitals arrive before auth cookies matter)
 *   • rate-limited by the middleware (same bucket as other /api routes)
 *   • validated with Zod so a malformed beacon can't poison the logs
 *   • returns 204 on success so `navigator.sendBeacon` sees it as OK
 */

const WebVitalSchema = z.object({
  name: z.enum(["LCP", "CLS", "INP", "FID", "TTFB", "FCP"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  id: z.string().min(1).max(128),
  navigationType: z.string().max(32).optional(),
  url: z.string().max(512).optional(),
})

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = WebVitalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid web vital payload" },
      { status: 400 }
    )
  }

  const requestId = request.headers.get("x-request-id") ?? undefined
  const log = requestId ? logger.child({ requestId }) : logger

  log.info(
    {
      event: "web_vital",
      name: parsed.data.name,
      value: parsed.data.value,
      rating: parsed.data.rating,
      metricId: parsed.data.id,
      navigationType: parsed.data.navigationType,
      url: parsed.data.url,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
    `Web vital: ${parsed.data.name}=${parsed.data.value.toFixed(1)}`
  )

  return new NextResponse(null, { status: 204 })
}
