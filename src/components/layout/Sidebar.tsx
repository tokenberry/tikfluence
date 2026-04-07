"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
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
  ScrollText,
  X,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  earnings: DollarSign,
  tickets: MessageCircle,
  profile: User,
  creators: Users,
  browse: Search,
  brands: Building2,
  analytics: BarChart3,
  users: Users,
  transactions: CreditCard,
  agency_claims: Link2,
  clients: Building2,
  notes: StickyNote,
  audit_log: ScrollText,
}

export const roleNavLinks: Record<string, { labelKey: string; icon: string; href: string }[]> = {
  CREATOR: [
    { labelKey: "creator_dashboard", icon: "dashboard", href: "/creator" },
    { labelKey: "creator_orders", icon: "orders", href: "/creator/orders" },
    { labelKey: "creator_earnings", icon: "earnings", href: "/creator/earnings" },
    { labelKey: "creator_tickets", icon: "tickets", href: "/creator/tickets" },
    { labelKey: "creator_profile", icon: "profile", href: "/creator/profile" },
  ],
  NETWORK: [
    { labelKey: "network_dashboard", icon: "dashboard", href: "/network" },
    { labelKey: "network_creators", icon: "creators", href: "/network/creators" },
    { labelKey: "network_orders", icon: "orders", href: "/network/orders" },
    { labelKey: "network_earnings", icon: "earnings", href: "/network/earnings" },
    { labelKey: "network_tickets", icon: "tickets", href: "/network/tickets" },
  ],
  BRAND: [
    { labelKey: "brand_dashboard", icon: "dashboard", href: "/brand" },
    { labelKey: "brand_browse", icon: "browse", href: "/brand/browse" },
    { labelKey: "brand_orders", icon: "orders", href: "/brand/orders" },
    { labelKey: "brand_tickets", icon: "tickets", href: "/brand/tickets" },
  ],
  ADMIN: [
    { labelKey: "admin_users", icon: "users", href: "/admin/users" },
    { labelKey: "admin_orders", icon: "orders", href: "/admin/orders" },
    { labelKey: "admin_transactions", icon: "transactions", href: "/admin/transactions" },
    { labelKey: "admin_agency_claims", icon: "agency_claims", href: "/admin/agency-brands" },
    { labelKey: "admin_tickets", icon: "tickets", href: "/admin/tickets" },
    { labelKey: "admin_analytics", icon: "analytics", href: "/admin/analytics" },
    { labelKey: "admin_audit_log", icon: "audit_log", href: "/admin/audit-log" },
  ],
  AGENCY: [
    { labelKey: "agency_dashboard", icon: "dashboard", href: "/agency" },
    { labelKey: "agency_browse", icon: "browse", href: "/agency/browse" },
    { labelKey: "agency_orders", icon: "orders", href: "/agency/orders" },
    { labelKey: "agency_brands", icon: "brands", href: "/agency/brands" },
    { labelKey: "agency_creators", icon: "creators", href: "/agency/creators" },
    { labelKey: "agency_earnings", icon: "earnings", href: "/agency/earnings" },
    { labelKey: "agency_tickets", icon: "tickets", href: "/agency/tickets" },
  ],
  ACCOUNT_MANAGER: [
    { labelKey: "account_manager_clients", icon: "clients", href: "/account-manager/clients" },
    { labelKey: "account_manager_orders", icon: "orders", href: "/account-manager/orders" },
    { labelKey: "account_manager_notes", icon: "notes", href: "/account-manager/notes" },
    { labelKey: "account_manager_analytics", icon: "analytics", href: "/account-manager/analytics" },
    { labelKey: "account_manager_tickets", icon: "tickets", href: "/account-manager/tickets" },
  ],
}

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const t = useTranslations("sidebar")

  if (!session?.user?.role) return null

  const links = roleNavLinks[session.user.role] ?? []

  return (
    <>
      <div className="p-6 flex-1">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">
          {t("menu")}
        </h2>
        <nav className="space-y-1">
          {links.map((link) => {
            const isDashboard = link.icon === "dashboard"
            const isActive = isDashboard
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + "/")
            const Icon = iconMap[link.icon] ?? FileText
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onLinkClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#d4772c]/15 text-[#d4772c]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(link.labelKey)}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/25">v{APP_VERSION}</p>
      </div>
    </>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#0a0a0a] border-r border-white/5 hidden lg:flex flex-col">
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
  const t = useTranslations("sidebar")

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 bg-[#0a0a0a] border-e border-white/5 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-sm font-bold text-white">{t("menu")}</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-white/40 hover:text-white/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNav onLinkClick={onClose} />
      </aside>
    </>
  )
}
