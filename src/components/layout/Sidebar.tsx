"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { APP_VERSION } from "@/lib/constants"

const roleNavLinks: Record<string, { label: string; href: string }[]> = {
  CREATOR: [
    { label: "Orders", href: "/creator/orders" },
    { label: "Earnings", href: "/creator/earnings" },
    { label: "Tickets", href: "/creator/tickets" },
    { label: "Profile", href: "/creator/profile" },
    { label: "Settings", href: "/creator/settings" },
  ],
  NETWORK: [
    { label: "Creators", href: "/network/creators" },
    { label: "Orders", href: "/network/orders" },
    { label: "Earnings", href: "/network/earnings" },
    { label: "Settings", href: "/network/settings" },
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
    { label: "Agency Claims", href: "/admin/agency-brands" },
    { label: "Settings", href: "/admin/settings" },
  ],
  AGENCY: [
    { label: "Brands", href: "/agency/brands" },
    { label: "Browse", href: "/agency/browse" },
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

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user?.role) {
    return null
  }

  const links = roleNavLinks[session.user.role] ?? []

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 hidden lg:flex flex-col">
      <div className="p-6 flex-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Navigation
        </h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#fdf6e3] text-[#d4772c]"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#d4772c]"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">v{APP_VERSION}</p>
      </div>
    </aside>
  )
}
