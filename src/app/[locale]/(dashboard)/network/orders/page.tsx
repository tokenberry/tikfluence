import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import OrderCard, {
  OrderCardMetrics,
  OrderCardSubtitle,
} from "@/components/OrderCard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic"

export default async function NetworkOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const network = await prisma.creatorNetwork.findUnique({
    where: { userId: session.user.id },
  });

  if (!network) redirect("/network/creators");

  const t = await getTranslations("network");

  const assignments = await prisma.orderAssignment.findMany({
    where: {
      OR: [
        { networkId: network.id },
        {
          creator: { networkId: network.id },
        },
      ],
    },
    include: {
      order: {
        include: {
          brand: true,
          category: true,
        },
      },
      creator: {
        include: { user: true },
      },
    },
    orderBy: { acceptedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("orders_title")}</h1>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">{t("orders_empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((assignment) => (
            <OrderCard
              key={assignment.id}
              href={`/network/orders/${assignment.order.id}`}
              title={assignment.order.title}
              badge={<StatusBadge status={assignment.status} />}
            >
              <OrderCardSubtitle>
                {assignment.order.brand.companyName}
              </OrderCardSubtitle>
              {assignment.creator && (
                <OrderCardSubtitle className="text-[#d4772c]">
                  Creator: {assignment.creator.user.name}
                </OrderCardSubtitle>
              )}
              <OrderCardMetrics>
                <span>{assignment.order.category.name}</span>
                <span>{formatNumber(assignment.order.impressionTarget)} impressions</span>
                <span>{formatCurrency(assignment.order.budget)}</span>
                <span>CPM: {formatCurrency(assignment.order.cpmRate)}</span>
              </OrderCardMetrics>
            </OrderCard>
          ))}
        </div>
      )}
    </div>
  );
}
