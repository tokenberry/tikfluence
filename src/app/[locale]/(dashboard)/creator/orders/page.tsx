import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import AcceptOrderButton from "./AcceptOrderButton";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic"

export default async function CreatorOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("creator");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      categories: true,
    },
  });

  if (!creator) redirect("/creator/profile");

  // Orders assigned to this creator
  const myAssignments = await prisma.orderAssignment.findMany({
    where: { creatorId: creator.id },
    include: {
      order: {
        include: {
          brand: true,
          category: true,
        },
      },
    },
    orderBy: { acceptedAt: "desc" },
  });

  // Open orders the creator can accept
  const openOrders = await prisma.order.findMany({
    where: {
      status: "OPEN",
      assignments: {
        none: { creatorId: creator.id },
      },
    },
    include: {
      brand: true,
      category: true,
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900">{t("orders_title")}</h1>

      {/* My Accepted Orders */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">{t("orders_my_accepted")}</h2>
        {myAssignments.length === 0 ? (
          <p className="text-gray-500">{t("orders_no_accepted")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myAssignments.map(({ order, status }) => (
              <a
                key={order.id}
                href={`/creator/orders/${order.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{order.title}</h3>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">{order.brand.companyName}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>{order.category.name}</span>
                  <span>{formatNumber(order.impressionTarget)} impressions</span>
                  <span>{formatCurrency(order.budget)}</span>
                  <span>CPM: {formatCurrency(order.cpmRate)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Available Orders */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-800">{t("orders_available_title")}</h2>
        {openOrders.length === 0 ? (
          <p className="text-gray-500">{t("orders_no_available")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {openOrders.map((order) => {
              const orderType = order.type ?? "SHORT_VIDEO"
              const isLocked =
                (orderType === "LIVE" && !creator.supportsLive) ||
                (orderType === "SHORT_VIDEO" && !creator.supportsShortVideo) ||
                (orderType === "COMBO" && (!creator.supportsLive || !creator.supportsShortVideo))

              return (
                <div
                  key={order.id}
                  className={`rounded-lg border p-5 shadow-sm ${
                    isLocked
                      ? "border-gray-200 bg-gray-50 opacity-70"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{order.title}</h3>
                    <OrderTypeBadge type={orderType} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{order.brand.companyName}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>{order.category.name}</span>
                    {order.impressionTarget > 0 && (
                      <span>{formatNumber(order.impressionTarget)} impressions</span>
                    )}
                    {order.budget > 0 && <span>{formatCurrency(order.budget)}</span>}
                    {order.cpmRate > 0 && <span>CPM: {formatCurrency(order.cpmRate)}</span>}
                    {order.liveFlatFee != null && order.liveFlatFee > 0 && (
                      <span>LIVE Fee: {formatCurrency(order.liveFlatFee)}</span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {t("orders_creators_count", { current: order._count.assignments, max: order.maxCreators })}
                    </span>
                    {isLocked ? (
                      <span className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 cursor-not-allowed">
                        {orderType === "LIVE"
                          ? "Requires LIVE support"
                          : orderType === "COMBO"
                          ? "Requires Video + LIVE"
                          : "Requires Video support"}
                      </span>
                    ) : (
                      <AcceptOrderButton orderId={order.id} creatorId={creator.id} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  );
}
