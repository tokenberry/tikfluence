import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
  Megaphone,
  CheckCircle,
  DollarSign,
  CreditCard,
  Clock,
  Plus,
  Search,
  Settings,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BrandDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const brand = await prisma.brand.findUnique({
    where: { userId: session.user.id },
  })

  if (!brand) redirect("/onboarding")

  const [activeCampaigns, completedCampaigns, totalSpentAgg, pendingReviews, creditBalanceAgg] =
    await Promise.all([
      prisma.order.count({
        where: {
          brandId: brand.id,
          status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED"] },
        },
      }),
      prisma.order.count({
        where: { brandId: brand.id, status: "COMPLETED" },
      }),
      prisma.order.aggregate({
        where: { brandId: brand.id, status: "COMPLETED" },
        _sum: { budget: true },
      }),
      prisma.delivery.count({
        where: {
          order: { brandId: brand.id },
          approved: null,
        },
      }),
      prisma.brandCredit.aggregate({
        where: { brandId: brand.id },
        _sum: { amount: true },
      }),
    ])

  const totalSpent = totalSpentAgg._sum.budget ?? 0
  const creditBalance = creditBalanceAgg._sum.amount ?? 0

  const stats = [
    {
      label: "Active Campaigns",
      value: activeCampaigns,
      icon: Megaphone,
      color: "text-[#d4772c]",
      bg: "bg-orange-50",
    },
    {
      label: "Completed",
      value: completedCampaigns,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Credit Balance",
      value: formatCurrency(creditBalance),
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      icon: Clock,
      color: "text-[#d4772c]",
      bg: "bg-orange-50",
    },
  ]

  const quickActions = [
    {
      label: "Create New Order",
      href: "/brand/orders/new",
      icon: Plus,
      description: "Launch a new campaign with creators",
    },
    {
      label: "Browse Creators",
      href: "/brand/browse",
      icon: Search,
      description: "Find creators for your next campaign",
    },
    {
      label: "Settings",
      href: "/brand/settings",
      icon: Settings,
      description: "Manage your brand profile and preferences",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {brand.companyName}
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s an overview of your campaigns and activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
            <p className={`mt-3 text-2xl font-bold text-gray-900`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-[#d4772c] hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-50 p-2 transition-colors group-hover:bg-[#d4772c]">
                  <action.icon className="h-5 w-5 text-[#d4772c] transition-colors group-hover:text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{action.label}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
