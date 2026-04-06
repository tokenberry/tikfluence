import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const roleRoutes: Record<string, string[]> = {
  CREATOR: ["/creator"],
  NETWORK: ["/network"],
  BRAND: ["/brand"],
  ADMIN: ["/admin"],
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

  // Rate limit API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
    const { allowed, retryAfter } = checkApiRateLimit(ip)
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      )
    }
  }

  // Public routes - no auth required
  const publicRoutes = ["/", "/login", "/register", "/api/auth"]
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // API routes with /api prefix that aren't auth - check in route handlers
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access for dashboard routes
  const role = user.role
  for (const [allowedRole, routes] of Object.entries(roleRoutes)) {
    for (const route of routes) {
      if (pathname.startsWith(route) && role !== allowedRole) {
        // Redirect to their own dashboard
        const dashboardMap: Record<string, string> = {
          CREATOR: "/creator/orders",
          NETWORK: "/network/creators",
          BRAND: "/brand/orders",
          ADMIN: "/admin/users",
        }
        return NextResponse.redirect(
          new URL(dashboardMap[role] || "/", req.nextUrl.origin)
        )
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
