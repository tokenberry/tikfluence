import { auth } from "@/lib/auth"
import { NextResponse, type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing, locales } from "@/i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const REQUEST_ID_HEADER = "x-request-id"

/**
 * Get or mint a correlation ID for this request. Upstream proxies
 * (Vercel's edge) typically set `x-request-id` already — we pass theirs
 * through unchanged so our logs line up with the platform's. Locally /
 * when absent we generate a fresh UUID.
 */
function resolveRequestId(req: NextRequest): string {
  return req.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID()
}

/**
 * Wrap a raw middleware response so the correlation ID travels on:
 *   • the response headers (visible to the browser / Vercel log view)
 *   • the forwarded request headers (so API routes can read it and
 *     bind a child logger to it — see `getRequestId()` in lib/logger
 *     follow-ups)
 *
 * This is called for every exit path in the `auth((req) => …)` handler
 * below so the header is always attached regardless of whether we
 * rate-limited, redirected, or passed through.
 */
function withRequestId(res: NextResponse, requestId: string): NextResponse {
  res.headers.set(REQUEST_ID_HEADER, requestId)
  return res
}

const roleRoutes: Record<string, string[]> = {
  CREATOR: ["/creator"],
  NETWORK: ["/network"],
  BRAND: ["/brand"],
  ADMIN: ["/admin"],
  AGENCY: ["/agency"],
  ACCOUNT_MANAGER: ["/account-manager"],
}

function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1)
    }
    if (pathname === `/${locale}`) {
      return "/"
    }
  }
  return pathname
}

// Simple in-memory rate limiter for middleware (per-instance)
const apiHits = new Map<string, { count: number; resetAt: number }>()
const API_RATE_LIMIT = 60
const API_WINDOW_MS = 60 * 1000

function checkApiRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = apiHits.get(ip)

  if (!entry || now > entry.resetAt) {
    apiHits.set(ip, { count: 1, resetAt: now + API_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  entry.count++
  if (entry.count > API_RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true, retryAfter: 0 }
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user
  const requestId = resolveRequestId(req)

  // Forward the request ID to downstream handlers. API routes can read
  // it from `headers().get("x-request-id")` and bind it to a child logger.
  const forwardedHeaders = new Headers(req.headers)
  forwardedHeaders.set(REQUEST_ID_HEADER, requestId)
  const passthrough = () =>
    withRequestId(
      NextResponse.next({ request: { headers: forwardedHeaders } }),
      requestId
    )
  const intlPassthrough = () => {
    const res = intlMiddleware(req as unknown as NextRequest) as NextResponse
    return withRequestId(res, requestId)
  }

  // Let API routes pass through without i18n
  if (pathname.startsWith("/api/")) {
    // Rate limit API routes (except auth)
    if (!pathname.startsWith("/api/auth")) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
      const { allowed, retryAfter } = checkApiRateLimit(ip)
      if (!allowed) {
        return withRequestId(
          new NextResponse(
            JSON.stringify({ error: "Too many requests" }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfter),
              },
            }
          ),
          requestId
        )
      }
    }

    // Block admin API routes for non-admin users
    if (pathname.startsWith("/api/admin")) {
      if (!user || user.role !== "ADMIN") {
        return withRequestId(
          NextResponse.json({ error: "Forbidden" }, { status: 403 }),
          requestId
        )
      }
    }
    return passthrough()
  }

  // Strip locale prefix for auth logic
  const path = stripLocale(pathname)

  // Authenticated users without a role must complete onboarding first
  if (user && !user.role) {
    if (path === "/onboarding") {
      return intlPassthrough()
    }
    return withRequestId(
      NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin)),
      requestId
    )
  }

  // Redirect authenticated users from landing page to their dashboard
  if (user && user.role && path === "/") {
    const roleDashboard: Record<string, string> = {
      CREATOR: "/creator",
      NETWORK: "/network",
      BRAND: "/brand",
      ADMIN: "/admin/users",
      AGENCY: "/agency",
      ACCOUNT_MANAGER: "/account-manager/clients",
    }
    const dest = roleDashboard[user.role] || "/"
    if (dest !== "/") {
      return withRequestId(
        NextResponse.redirect(new URL(dest, req.nextUrl.origin)),
        requestId
      )
    }
  }

  // Public routes - no auth required
  const publicRoutes = ["/", "/login", "/register", "/terms", "/privacy", "/dashboard", "/deck"]
  if (publicRoutes.some((route) => path === route || path.startsWith(route + "/"))) {
    return intlPassthrough()
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", path)
    return withRequestId(NextResponse.redirect(loginUrl), requestId)
  }

  const role = user.role!

  // Users with a role cannot access onboarding
  if (path === "/onboarding") {
    const dashboardMap: Record<string, string> = {
      CREATOR: "/creator",
      NETWORK: "/network",
      BRAND: "/brand",
      ADMIN: "/admin/users",
      AGENCY: "/agency",
      ACCOUNT_MANAGER: "/account-manager/clients",
    }
    return withRequestId(
      NextResponse.redirect(
        new URL(dashboardMap[role] || "/", req.nextUrl.origin)
      ),
      requestId
    )
  }

  // Role-based route protection
  for (const [allowedRole, routes] of Object.entries(roleRoutes)) {
    for (const route of routes) {
      if (path.startsWith(route) && role !== allowedRole) {
        const dashboardMap: Record<string, string> = {
          CREATOR: "/creator/orders",
          NETWORK: "/network/creators",
          BRAND: "/brand/orders",
          ADMIN: "/admin/users",
          AGENCY: "/agency/brands",
          ACCOUNT_MANAGER: "/account-manager/clients",
        }
        return withRequestId(
          NextResponse.redirect(
            new URL(dashboardMap[role] || "/", req.nextUrl.origin)
          ),
          requestId
        )
      }
    }
  }

  return intlPassthrough()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"],
}
