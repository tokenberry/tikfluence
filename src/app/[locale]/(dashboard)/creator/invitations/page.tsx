import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { formatCurrency } from "@/lib/utils"
import InvitationActions from "./InvitationActions"
import { OrderTypeBadge } from "@/components/ui/Badge"
import Link from "next/link"
import { Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CreatorInvitationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "CREATOR") redirect("/login")

  const t = await getTranslations("invitations")

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!creator) redirect("/creator/profile")

  const invitations = await prisma.orderInvitation.findMany({
    where: { creatorId: creator.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      order: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          budget: true,
          cpmRate: true,
          impressionTarget: true,
          liveFlatFee: true,
          status: true,
          expiresAt: true,
          requiresShipping: true,
          productDescription: true,
          brand: {
            select: {
              companyName: true,
              logo: true,
            },
          },
          category: { select: { name: true } },
        },
      },
      invitedByUser: { select: { name: true, role: true } },
    },
  })

  const pending = invitations.filter((i) => i.status === "PENDING")
  const history = invitations.filter((i) => i.status !== "PENDING")

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-[#d4772c]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      {/* Pending */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("pending_heading")}{" "}
          <span className="text-sm font-normal text-gray-500">
            ({pending.length})
          </span>
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">{t("empty_pending")}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pending.map((inv) => {
              const order = inv.order
              return (
                <li
                  key={inv.id}
                  className="rounded-lg border border-[#d4772c]/40 bg-[#fdf6e3]/40 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/creator/orders/${order.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-[#d4772c]"
                        >
                          {order.title}
                        </Link>
                        <OrderTypeBadge type={order.type} />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {order.brand.companyName} · {order.category.name}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {order.description}
                      </p>
                      {inv.message && (
                        <div className="mt-3 rounded-md border-l-2 border-[#d4772c] bg-white/70 p-3">
                          <p className="text-xs font-semibold text-gray-500">
                            {t("inviter_message", {
                              who: inv.invitedByUser.name ?? t("the_brand"),
                            })}
                          </p>
                          <p className="mt-1 text-sm text-gray-700 italic">
                            &ldquo;{inv.message}&rdquo;
                          </p>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                        {(order.type === "SHORT_VIDEO" ||
                          order.type === "COMBO") && (
                          <>
                            <span>
                              {t("budget")}:{" "}
                              <span className="font-medium text-gray-700">
                                {formatCurrency(order.budget)}
                              </span>
                            </span>
                            <span>
                              {t("cpm")}:{" "}
                              <span className="font-medium text-gray-700">
                                {formatCurrency(order.cpmRate)}
                              </span>
                            </span>
                          </>
                        )}
                        {(order.type === "LIVE" ||
                          order.type === "COMBO") && (
                          <span>
                            {t("live_fee")}:{" "}
                            <span className="font-medium text-gray-700">
                              {formatCurrency(order.liveFlatFee ?? 0)}
                            </span>
                          </span>
                        )}
                        {order.expiresAt && (
                          <span>
                            {t("deadline")}:{" "}
                            <span className="font-medium text-gray-700">
                              {new Date(order.expiresAt).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                        {order.requiresShipping && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            {t("requires_shipping")}
                          </span>
                        )}
                      </div>
                    </div>
                    <InvitationActions invitationId={inv.id} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {t("history_heading")}
          </h2>
          <ul className="space-y-2">
            {history.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/creator/orders/${inv.order.id}`}
                    className="font-medium text-gray-900 hover:text-[#d4772c]"
                  >
                    {inv.order.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {inv.order.brand.companyName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      inv.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "DECLINED"
                        ? "bg-red-100 text-red-700"
                        : inv.status === "WITHDRAWN"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {t(`status_${inv.status.toLowerCase()}`)}
                  </span>
                  {inv.respondedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(inv.respondedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
