import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing, locales } from "@/i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

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

export default auth((req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user

  // Let API routes pass through without i18n
  if (pathname.startsWith("/api/")) {
    // Block admin API routes for non-admin users
    if (pathname.startsWith("/api/admin")) {
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    return NextResponse.next()
  }

  // Strip locale prefix for auth logic
  const path = stripLocale(pathname)

  // Authenticated users without a role must complete onboarding first
  if (user && !user.role) {
    if (path === "/onboarding") {
      return intlMiddleware(req)
    }
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin))
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
      return NextResponse.redirect(new URL(dest, req.nextUrl.origin))
    }
  }

  // Public routes - no auth required
  const publicRoutes = ["/", "/login", "/register", "/terms", "/privacy", "/dashboard", "/deck"]
  if (publicRoutes.some((route) => path === route || path.startsWith(route + "/"))) {
    return intlMiddleware(req)
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(loginUrl)
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
    return NextResponse.redirect(
      new URL(dashboardMap[role] || "/", req.nextUrl.origin)
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
        return NextResponse.redirect(
          new URL(dashboardMap[role] || "/", req.nextUrl.origin)
        )
      }
    }
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)"],
}
