"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import Sidebar, { MobileSidebar } from "@/components/layout/Sidebar"
import { Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const tDashboard = useTranslations("dashboard")
  const tCommon = useTranslations("common")

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span className="text-sm">{tDashboard("loading")}</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex-1 bg-gray-50">
        {/* Mobile header with menu button */}
        <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-white/5 bg-[#0a0a0a] px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md border border-white/10 p-2 text-white/50 hover:bg-white/5 hover:text-white/80"
            aria-label={tCommon("aria_open_navigation")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-white/50">
            {tCommon("menu")}
          </span>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  )
}
