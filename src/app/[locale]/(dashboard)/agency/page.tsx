import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import {
  Building2,
  ShoppingBag,
  CheckCircle,
  DollarSign,
} from "lucide-react";

import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AgencyDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const t = await getTranslations("agency");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  const [managedBrands, activeOrders, completedOrders, earningsAgg] =
    await Promise.all([
      prisma.agencyBrand.count({
        where: { agencyId: agency.id, status: "APPROVED" },
      }),
      prisma.order.count({
        where: {
          agencyId: agency.id,
          status: {
            in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "REVISION"],
          },
        },
      }),
      prisma.order.count({
        where: { agencyId: agency.id, status: "COMPLETED" },
      }),
      prisma.transaction.aggregate({
        where: { order: { agencyId: agency.id }, status: "RELEASED" },
        _sum: { amount: true },
      }),
    ]);

  const totalEarnings = earningsAgg._sum.amount ?? 0;

  const stats = [
    {
      label: t("stat_brands"),
      value: managedBrands,
      icon: Building2,
      formatted: String(managedBrands),
    },
    {
      label: t("stat_active"),
      value: activeOrders,
      icon: ShoppingBag,
      formatted: String(activeOrders),
    },
    {
      label: t("stat_completed"),
      value: completedOrders,
      icon: CheckCircle,
      formatted: String(completedOrders),
    },
    {
      label: t("stat_earnings"),
      value: totalEarnings,
      icon: DollarSign,
      formatted: formatCurrency(totalEarnings),
    },
  ];

  const quickActions = [
    { label: t("quick_action_brands"), href: "/agency/brands" },
    { label: t("quick_action_create"), href: "/agency/orders/new" },
    { label: t("quick_action_browse"), href: "/agency/browse" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900">
        {t("dashboard_welcome", { name: agency.companyName })}
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4772c]/10">
                <stat.icon className="h-5 w-5 text-[#d4772c]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.formatted}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {t("quick_actions_title")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a] transition-colors"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
