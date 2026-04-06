import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import {
  OrderStatusChart,
  UserRoleChart,
  OrderTrendChart,
  RevenueTrendChart,
} from "./AnalyticsCharts";

export const dynamic = "force-dynamic"

export default async function AdminAnalyticsPage() {
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [totalUsers, totalOrders, activeOrders, transactions, roleCounts, recentOrders, monthlyOrders, monthlyTransactions] =
    await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED"] } } }),
      prisma.transaction.findMany({
        where: { status: "RELEASED" },
        select: { amount: true },
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.order.findMany({
        take: 10,
        include: {
          brand: { select: { companyName: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.transaction.findMany({
        where: { status: "RELEASED", createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, amount: true, platformFee: true },
      }),
    ]);

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

  const roleBreakdown = roleCounts.reduce(
    (acc, { role, _count }) => {
      if (role) acc[role] = _count.role;
      return acc;
    },
    {} as Record<string, number>
  );

  // Build order status counts
  const orderStatusCounts: Record<string, number> = {};
  const allOrders = await prisma.order.groupBy({ by: ["status"], _count: { id: true } });
  for (const o of allOrders) {
    orderStatusCounts[o.status] = o._count.id;
  }

  // Build monthly time-series
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const monthlyOrderData: Record<string, number> = {};
  for (const o of monthlyOrders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyOrderData[key] = (monthlyOrderData[key] || 0) + 1;
  }

  const monthlyRevenueData: Record<string, { revenue: number; fees: number }> = {};
  for (const tx of monthlyTransactions) {
    const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyRevenueData[key]) monthlyRevenueData[key] = { revenue: 0, fees: 0 };
    monthlyRevenueData[key].revenue += tx.amount;
    monthlyRevenueData[key].fees += tx.platformFee;
  }

  const orderTrend = months.map((m) => ({ month: m, orders: monthlyOrderData[m] || 0 }));
  const revenueTrend = months.map((m) => ({
    month: m,
    revenue: Math.round((monthlyRevenueData[m]?.revenue || 0) * 100) / 100,
    fees: Math.round((monthlyRevenueData[m]?.fees || 0) * 100) / 100,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-3 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("analytics_title")}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{t("analytics_users")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{t("analytics_orders")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{t("analytics_revenue")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{t("analytics_active")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-600">{activeOrders}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Status Distribution</h2>
          <OrderStatusChart data={orderStatusCounts} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Users by Role</h2>
          <UserRoleChart data={roleBreakdown} />
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Orders (Last 6 Months)</h2>
          <OrderTrendChart data={orderTrend} />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue (Last 6 Months)</h2>
          <RevenueTrendChart data={revenueTrend} />
        </div>
      </div>

      {/* Role Breakdown Cards */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("analytics_by_role")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-purple-50 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-700">{roleBreakdown.CREATOR ?? 0}</p>
            <p className="text-xs sm:text-sm text-purple-600">Creators</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-700">{roleBreakdown.NETWORK ?? 0}</p>
            <p className="text-xs sm:text-sm text-blue-600">Networks</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-700">{roleBreakdown.BRAND ?? 0}</p>
            <p className="text-xs sm:text-sm text-green-600">Brands</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-red-700">{roleBreakdown.ADMIN ?? 0}</p>
            <p className="text-xs sm:text-sm text-red-600">Admins</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t("analytics_recent")}</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t("analytics_no_orders")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Title</th>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Brand</th>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Category</th>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Budget</th>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">{order.title}</td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">{order.brand.companyName}</td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">{order.category.name}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">{formatCurrency(order.budget)}</td>
                    <td className="px-4 sm:px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
