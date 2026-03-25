"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const roleNavLinks: Record<string, { label: string; href: string }[]> = {
  CREATOR: [
    { label: "Orders", href: "/orders" },
    { label: "Earnings", href: "/earnings" },
    { label: "Profile", href: "/profile" },
  ],
  NETWORK: [
    { label: "Creators", href: "/creators" },
    { label: "Orders", href: "/orders" },
    { label: "Earnings", href: "/earnings" },
  ],
  BRAND: [
    { label: "Browse", href: "/browse" },
    { label: "Orders", href: "/orders" },
    { label: "Settings", href: "/settings" },
  ],
  ADMIN: [
    { label: "Users", href: "/admin/users" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Transactions", href: "/admin/transactions" },
    { label: "Tickets", href: "/admin/tickets" },
    { label: "Settings", href: "/admin/settings" },
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
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 hidden lg:block">
      <div className="p-6">
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
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
