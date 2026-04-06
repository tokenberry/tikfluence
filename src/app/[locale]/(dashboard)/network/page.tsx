import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { Users, ShoppingBag, CheckCircle, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NetworkDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const t = await getTranslations("network");

  const network = await prisma.creatorNetwork.findUnique({
    where: { userId: session.user.id },
    include: { creators: { select: { id: true } } },
  });

  if (!network) redirect("/login");

  const creatorIds = network.creators.map((c) => c.id);

  const [totalCreators, activeOrders, completedOrders, transactions] =
    await Promise.all([
      prisma.creator.count({ where: { networkId: network.id } }),

      prisma.order.count({
        where: {
          assignments: {
            some: {
              OR: [
                { networkId: network.id },
                { creatorId: { in: creatorIds } },
              ],
            },
          },
          status: {
            in: [
              "ASSIGNED",
              "IN_PROGRESS",
              "DELIVERED",
              "REVISION",
              "APPROVED",
            ],
          },
        },
      }),

      prisma.order.count({
        where: {
          assignments: {
            some: {
              OR: [
                { networkId: network.id },
                { creatorId: { in: creatorIds } },
              ],
            },
          },
          status: "COMPLETED",
        },
      }),

      prisma.transaction.findMany({
        where: {
          status: "RELEASED",
          order: {
            assignments: {
              some: {
                OR: [
                  { networkId: network.id },
                  { creatorId: { in: creatorIds } },
                ],
              },
            },
          },
        },
        select: { creatorPayout: true },
      }),
    ]);

  const networkEarnings = transactions.reduce(
    (sum, tx) => sum + tx.creatorPayout,
    0,
  );

  const stats = [
    {
      label: t("stat_creators"),
      value: totalCreators.toString(),
      icon: Users,
    },
    {
      label: t("stat_active"),
      value: activeOrders.toString(),
      icon: ShoppingBag,
    },
    {
      label: t("stat_completed"),
      value: completedOrders.toString(),
      icon: CheckCircle,
    },
    {
      label: t("stat_earnings"),
      value: formatCurrency(networkEarnings),
      icon: DollarSign,
    },
  ];

  const quickActions = [
    { label: t("quick_action_creators"), href: "/network/creators" },
    { label: t("quick_action_add"), href: "/network/creators/add" },
    { label: t("quick_action_orders"), href: "/network/orders" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900">
        {t("dashboard_welcome", { name: network.companyName })}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-[#d4772c]/10 p-2">
                <stat.icon className="h-5 w-5 text-[#d4772c]" />
              </div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t("quick_actions_title")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
