"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { APP_VERSION } from "@/lib/constants"
import {
  ShoppingBag,
  DollarSign,
  MessageCircle,
  User,
  Users,
  Search,
  Building2,
  BarChart3,
  FileText,
  Link2,
  CreditCard,
  StickyNote,
  LayoutDashboard,
  X,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Orders: ShoppingBag,
  Earnings: DollarSign,
  Tickets: MessageCircle,
  Profile: User,
  Creators: Users,
  Browse: Search,
  Brands: Building2,
  Analytics: BarChart3,
  Users: Users,
  Transactions: CreditCard,
  "Agency Claims": Link2,
  Clients: Building2,
  Notes: StickyNote,
}

export const roleNavLinks: Record<string, { label: string; href: string }[]> = {
  CREATOR: [
    { label: "Dashboard", href: "/creator" },
    { label: "Orders", href: "/creator/orders" },
    { label: "Earnings", href: "/creator/earnings" },
    { label: "Tickets", href: "/creator/tickets" },
    { label: "Profile", href: "/creator/profile" },
  ],
  NETWORK: [
    { label: "Dashboard", href: "/network" },
    { label: "Creators", href: "/network/creators" },
    { label: "Orders", href: "/network/orders" },
    { label: "Earnings", href: "/network/earnings" },
    { label: "Tickets", href: "/network/tickets" },
  ],
  BRAND: [
    { label: "Dashboard", href: "/brand" },
    { label: "Browse", href: "/brand/browse" },
    { label: "Orders", href: "/brand/orders" },
    { label: "Tickets", href: "/brand/tickets" },
  ],
  ADMIN: [
    { label: "Users", href: "/admin/users" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Transactions", href: "/admin/transactions" },
    { label: "Agency Claims", href: "/admin/agency-brands" },
    { label: "Tickets", href: "/admin/tickets" },
    { label: "Analytics", href: "/admin/analytics" },
  ],
  AGENCY: [
    { label: "Dashboard", href: "/agency" },
    { label: "Browse", href: "/agency/browse" },
    { label: "Orders", href: "/agency/orders" },
    { label: "Brands", href: "/agency/brands" },
    { label: "Creators", href: "/agency/creators" },
    { label: "Earnings", href: "/agency/earnings" },
    { label: "Tickets", href: "/agency/tickets" },
  ],
  ACCOUNT_MANAGER: [
    { label: "Clients", href: "/account-manager/clients" },
    { label: "Orders", href: "/account-manager/orders" },
    { label: "Notes", href: "/account-manager/notes" },
    { label: "Analytics", href: "/account-manager/analytics" },
    { label: "Tickets", href: "/account-manager/tickets" },
  ],
}

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user?.role) return null

  const links = roleNavLinks[session.user.role] ?? []

  return (
    <>
      <div className="p-6 flex-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Navigation
        </h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isExactDashboard = link.label === "Dashboard"
            const isActive = isExactDashboard
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/")
            const Icon = iconMap[link.label] ?? FileText
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#fdf6e3] text-[#d4772c]"
                    : "text-gray-700 hover:bg-gray-50 hover:text-[#d4772c]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">v{APP_VERSION}</p>
      </div>
    </>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 hidden lg:flex flex-col">
      <SidebarNav />
    </aside>
  )
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-sm font-bold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav onLinkClick={onClose} />
      </aside>
    </>
  )
}
