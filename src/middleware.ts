import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const roleRoutes: Record<string, string[]> = {
  CREATOR: ["/creator"],
  NETWORK: ["/network"],
  BRAND: ["/brand"],
  ADMIN: ["/admin"],
  AGENCY: ["/agency"],
  ACCOUNT_MANAGER: ["/account-manager"],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user

  // Authenticated users without a role must complete onboarding first
  if (user && !user.role) {
    if (pathname === "/onboarding") {
      return NextResponse.next()
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin))
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

  const role = user.role!

  // Users with a role cannot access onboarding
  if (pathname === "/onboarding") {
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
  for (const [allowedRole, routes] of Object.entries(roleRoutes)) {
    for (const route of routes) {
      if (pathname.startsWith(route) && role !== allowedRole) {
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
