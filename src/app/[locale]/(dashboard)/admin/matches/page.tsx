import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Sparkles, Users, Check, X, Clock, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"

/**
 * `/admin/matches` — F4 oversight surface (v4.1.0).
 *
 * Admin-only dashboard for the AI campaign-driven creator matching
 * feature. Shows overall invitation funnel + top brands/creators by
 * invitation volume so the ops team can spot low-acceptance brands,
 * over-invited creators, and funnel drop-off.
 *
 * Server component — queries Prisma directly (same pattern as the
 * existing `/admin/analytics` page).
 */
export default async function AdminMatchesPage() {
  const t = await getTranslations("admin_matches")
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [
    totalMatches,
    matchedOrders,
    statusCounts,
    totalInvitations,
    recentInvitations,
    topInviterBrands,
    topInvitedCreators,
  ] = await Promise.all([
    prisma.aiCreatorMatch.count(),
    prisma.aiCreatorMatch
      .groupBy({ by: ["orderId"], _count: { orderId: true } })
      .then((rows) => rows.length),
    prisma.orderInvitation.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.orderInvitation.count(),
    prisma.orderInvitation.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { id: true, title: true } },
        creator: {
          select: {
            tiktokUsername: true,
            user: { select: { name: true } },
          },
        },
        invitedByUser: { select: { name: true, email: true } },
      },
    }),
    prisma.orderInvitation.groupBy({
      by: ["orderId"],
      _count: { orderId: true },
      orderBy: { _count: { orderId: "desc" } },
      take: 10,
    }),
    prisma.orderInvitation.groupBy({
      by: ["creatorId"],
      _count: { creatorId: true },
      orderBy: { _count: { creatorId: "desc" } },
      take: 10,
    }),
  ])

  // Normalize status counts so missing keys are zero.
  const byStatus: Record<string, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    WITHDRAWN: 0,
    EXPIRED: 0,
  }
  for (const row of statusCounts) {
    byStatus[row.status] = row._count.status
  }

  const totalResolved =
    byStatus.ACCEPTED +
    byStatus.DECLINED +
    byStatus.WITHDRAWN +
    byStatus.EXPIRED
  const acceptanceRate =
    totalResolved > 0 ? (byStatus.ACCEPTED / totalResolved) * 100 : 0

  // Resolve top brands — join the topInviterBrands aggregate back to
  // the brand company name via order -> brand.
  const topOrderIds = topInviterBrands.map((b) => b.orderId)
  const topOrdersDetail =
    topOrderIds.length > 0
      ? await prisma.order.findMany({
          where: { id: { in: topOrderIds } },
          select: {
            id: true,
            title: true,
            brand: { select: { companyName: true } },
          },
        })
      : []
  const orderById = new Map(topOrdersDetail.map((o) => [o.id, o]))

  const topCreatorIds = topInvitedCreators.map((c) => c.creatorId)
  const topCreatorsDetail =
    topCreatorIds.length > 0
      ? await prisma.creator.findMany({
          where: { id: { in: topCreatorIds } },
          select: {
            id: true,
            tiktokUsername: true,
            user: { select: { name: true } },
          },
        })
      : []
  const creatorById = new Map(topCreatorsDetail.map((c) => [c.id, c]))

  const funnelCards = [
    {
      label: t("funnel_pending"),
      value: byStatus.PENDING,
      icon: Clock,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: t("funnel_accepted"),
      value: byStatus.ACCEPTED,
      icon: Check,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      label: t("funnel_declined"),
      value: byStatus.DECLINED,
      icon: X,
      color: "bg-red-50 text-red-700 border-red-200",
    },
    {
      label: t("funnel_withdrawn"),
      value: byStatus.WITHDRAWN,
      icon: RotateCcw,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      label: t("funnel_expired"),
      value: byStatus.EXPIRED,
      icon: Clock,
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-3 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          <Sparkles className="h-6 w-6 text-[#d4772c]" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">
            {t("summary_total_matches")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {totalMatches}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">
            {t("summary_matched_orders")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {matchedOrders}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">
            {t("summary_total_invitations")}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {totalInvitations}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">
            {t("summary_acceptance_rate")}
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600 sm:text-3xl">
            {acceptanceRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {t("acceptance_rate_note", { resolved: totalResolved })}
          </p>
        </div>
      </div>

      {/* Funnel row */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("funnel_heading")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {funnelCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className={`rounded-lg border p-4 ${card.color}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{card.label}</span>
                </div>
                <p className="mt-2 text-2xl font-bold">{card.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top inviting brands */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("top_inviters_heading")}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {t("top_inviters_subtitle")}
          </p>
        </div>
        {topInviterBrands.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t("empty_state")}</div>
        ) : (
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 sm:px-6">
                  {t("col_rank")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_brand")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_order")}
                </TableHead>
                <TableHead className="px-4 sm:px-6 text-right">
                  {t("col_invitations")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topInviterBrands.map((row, i) => {
                const order = orderById.get(row.orderId)
                return (
                  <TableRow key={row.orderId}>
                    <TableCell className="px-4 font-medium text-gray-500 sm:px-6">
                      #{i + 1}
                    </TableCell>
                    <TableCell className="px-4 text-gray-700 sm:px-6">
                      {order?.brand.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 text-gray-600 sm:px-6">
                      {order?.title ?? row.orderId}
                    </TableCell>
                    <TableCell className="px-4 text-right font-semibold text-gray-900 sm:px-6">
                      {row._count.orderId}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Top invited creators */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-gray-500" />
            {t("top_creators_heading")}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {t("top_creators_subtitle")}
          </p>
        </div>
        {topInvitedCreators.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t("empty_state")}</div>
        ) : (
          <Table className="min-w-[500px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 sm:px-6">
                  {t("col_rank")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_creator")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_username")}
                </TableHead>
                <TableHead className="px-4 text-right sm:px-6">
                  {t("col_invitations")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topInvitedCreators.map((row, i) => {
                const creator = creatorById.get(row.creatorId)
                return (
                  <TableRow key={row.creatorId}>
                    <TableCell className="px-4 font-medium text-gray-500 sm:px-6">
                      #{i + 1}
                    </TableCell>
                    <TableCell className="px-4 text-gray-700 sm:px-6">
                      {creator?.user.name ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 text-gray-600 sm:px-6">
                      {creator ? `@${creator.tiktokUsername}` : row.creatorId}
                    </TableCell>
                    <TableCell className="px-4 text-right font-semibold text-gray-900 sm:px-6">
                      {row._count.creatorId}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Recent invitations */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("recent_heading")}
          </h2>
        </div>
        {recentInvitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t("empty_state")}</div>
        ) : (
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 sm:px-6">{t("col_order")}</TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_creator")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_inviter")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">
                  {t("col_status")}
                </TableHead>
                <TableHead className="px-4 sm:px-6">{t("col_date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="px-4 font-medium text-gray-900 sm:px-6">
                    {inv.order.title}
                  </TableCell>
                  <TableCell className="px-4 text-gray-600 sm:px-6">
                    {inv.creator.user.name ?? `@${inv.creator.tiktokUsername}`}
                  </TableCell>
                  <TableCell className="px-4 text-gray-600 sm:px-6">
                    {inv.invitedByUser?.name ?? inv.invitedByUser?.email ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 sm:px-6">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 text-gray-500 sm:px-6">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
