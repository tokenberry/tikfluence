"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import NotificationBell from "./NotificationBell"
import LanguageSwitcher from "./LanguageSwitcher"
import FoxLogo from "@/components/FoxLogo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const roleDashboardPath: Record<string, string> = {
  CREATOR: "/creator",
  NETWORK: "/network",
  BRAND: "/brand",
  ADMIN: "/admin/users",
  AGENCY: "/agency",
  ACCOUNT_MANAGER: "/account-manager/clients",
}

const roleSettingsPath: Record<string, string> = {
  CREATOR: "/creator/settings",
  NETWORK: "/network/settings",
  BRAND: "/brand/settings",
  ADMIN: "/admin/settings",
  AGENCY: "/agency/settings",
  ACCOUNT_MANAGER: "/account-manager/settings",
}

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations("nav")

  const role = session?.user?.role ?? ""
  const dashboardHref = roleDashboardPath[role] || "/"
  const settingsHref = roleSettingsPath[role] || "#"

  // Landing page and auth pages have their own header
  const isAuthPage = pathname.includes("/login") || pathname.includes("/register")
  if ((pathname === "/" && status !== "authenticated") || isAuthPage) return null

  return (
    <nav className="bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <FoxLogo />
            {t("app_name")}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {status === "authenticated" && (
              <>
                <Link
                  href={dashboardHref}
                  className="text-sm font-medium text-gray-300 hover:text-[#d4772c] transition-colors"
                >
                  {t("dashboard")}
                </Link>

                {/* Language switcher */}
                <LanguageSwitcher />

                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-[#d4772c] focus:outline-none">
                    <span className="w-8 h-8 rounded-full bg-[#d4772c]/20 text-[#d4772c] flex items-center justify-center text-sm font-semibold">
                      {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                    <span>{session.user.name}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-[#141414] border-white/10 text-white/80"
                  >
                    <DropdownMenuLabel className="text-xs font-normal text-white/40">
                      {session.user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      asChild
                      className="text-white/70 focus:bg-white/5 focus:text-white"
                    >
                      <Link href={settingsHref}>{t("settings")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => signOut({ callbackUrl: "/" })}
                      className="text-white/70 focus:bg-white/5 focus:text-white"
                    >
                      {t("sign_out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {status === "unauthenticated" && (
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-300 hover:text-[#d4772c]"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-[#d4772c] hover:bg-[#c86b1e] px-4 py-2 rounded-md transition-colors"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-white/60 hover:bg-white/5"
            aria-label={t("toggle_menu")}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]">
          <div className="px-4 py-3 space-y-2">
            {status === "authenticated" && (
              <>
                <div className="pb-2 mb-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-white/40">{session.user.email}</p>
                </div>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-white/60 hover:text-[#d4772c] py-1"
                >
                  {t("dashboard")}
                </Link>
                <Link
                  href={settingsHref}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-white/60 hover:text-[#d4772c] py-1"
                >
                  {t("settings")}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left text-sm font-medium text-red-400 hover:text-red-300 py-1 mt-2"
                >
                  {t("sign_out")}
                </button>
              </>
            )}

            {status === "unauthenticated" && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-white/60 hover:text-white py-1"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-[#d4772c] hover:text-[#e8883a] py-1"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
