"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import NotificationBell from "./NotificationBell"

const roleNavLinks: Record<string, { label: string; href: string }[]> = {
  CREATOR: [
    { label: "Orders", href: "/creator/orders" },
    { label: "Earnings", href: "/creator/earnings" },
    { label: "Profile", href: "/creator/profile" },
  ],
  NETWORK: [
    { label: "Creators", href: "/network/creators" },
    { label: "Orders", href: "/network/orders" },
    { label: "Earnings", href: "/network/earnings" },
  ],
  BRAND: [
    { label: "Browse", href: "/brand/browse" },
    { label: "Orders", href: "/brand/orders" },
    { label: "Settings", href: "/brand/settings" },
  ],
  ADMIN: [
    { label: "Users", href: "/admin/users" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Transactions", href: "/admin/transactions" },
    { label: "Tickets", href: "/admin/tickets" },
    { label: "Settings", href: "/admin/settings" },
  ],
  AGENCY: [
    { label: "Brands", href: "/agency/brands" },
    { label: "Creators", href: "/agency/creators" },
    { label: "Orders", href: "/agency/orders" },
    { label: "Earnings", href: "/agency/earnings" },
  ],
  ACCOUNT_MANAGER: [
    { label: "Clients", href: "/account-manager/clients" },
    { label: "Orders", href: "/account-manager/orders" },
    { label: "Notes", href: "/account-manager/notes" },
    { label: "Analytics", href: "/account-manager/analytics" },
  ],
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navLinks = session?.user?.role
    ? roleNavLinks[session.user.role] ?? []
    : []

  return (
    <nav className="bg-[#2d3436] border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <img src="/fox-logo.png" alt="Foxolog" className="h-8 w-8 rounded-full" />
            Foxolog
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {status === "authenticated" && (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-gray-300 hover:text-[#d4772c] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-[#d4772c]"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#d4772c]/20 text-[#d4772c] flex items-center justify-center text-sm font-semibold">
                      {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                    <span>{session.user.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#2d3436] rounded-md shadow-lg border border-gray-600 py-1 z-50">
                      <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-600">
                        {session.user.email}
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {status === "unauthenticated" && (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-300 hover:text-[#d4772c]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-[#d4772c] hover:bg-[#c86b1e] px-4 py-2 rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:bg-gray-700"
            aria-label="Toggle menu"
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
        <div className="md:hidden border-t border-gray-700 bg-[#2d3436]">
          <div className="px-4 py-3 space-y-2">
            {status === "authenticated" && (
              <>
                <div className="pb-2 mb-2 border-b border-gray-600">
                  <p className="text-sm font-medium text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-400">{session.user.email}</p>
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-medium text-gray-300 hover:text-[#d4772c] py-1"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left text-sm font-medium text-red-400 hover:text-red-300 py-1 mt-2"
                >
                  Sign out
                </button>
              </>
            )}

            {status === "unauthenticated" && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-gray-300 hover:text-[#d4772c] py-1"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-[#d4772c] hover:text-[#c86b1e] py-1"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
