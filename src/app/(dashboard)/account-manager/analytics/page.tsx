import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AMAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ACCOUNT_MANAGER")
    redirect("/login");

  const am = await prisma.accountManager.findUnique({
    where: { userId: session.user.id },
  });
  if (!am) redirect("/login");

  // Get assigned brand IDs and agency count
  const [assignedBrands, assignedAgencyCount] = await Promise.all([
    prisma.accountManagerBrand.findMany({
      where: { accountManagerId: am.id },
      select: { brandId: true },
    }),
    prisma.accountManagerAgency.count({
      where: { accountManagerId: am.id },
    }),
  ]);

  const brandIds = assignedBrands.map((ab) => ab.brandId);

  // Fetch orders, transactions, and status breakdown for assigned brands
  const [clientOrders, releasedTransactions, ordersByStatus, recentOrders] =
    await Promise.all([
      prisma.order.count({
        where: { brandId: { in: brandIds } },
      }),
      prisma.transaction.findMany({
        where: {
          status: "RELEASED",
          order: { brandId: { in: brandIds } },
        },
        select: { amount: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { brandId: { in: brandIds } },
        _count: { status: true },
      }),
      prisma.order.findMany({
        where: { brandId: { in: brandIds } },
        take: 10,
        include: {
          brand: { select: { companyName: true } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const totalRevenue = releasedTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const statusBreakdown = ordersByStatus.reduce(
    (acc, { status, _count }) => {
      acc[status] = _count.status;
      return acc;
    },
    {} as Record<string, number>
  );

  const allStatuses = [
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "DELIVERED",
    "REVISION",
    "APPROVED",
    "COMPLETED",
    "DISPUTED",
    "CANCELLED",
  ];

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    OPEN: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-yellow-100 text-yellow-700",
    REVISION: "bg-orange-100 text-orange-700",
    APPROVED: "bg-green-100 text-green-700",
    COMPLETED: "bg-green-100 text-green-700",
    DISPUTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
  };

  const statusBgColors: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-700",
    ASSIGNED: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700",
    DELIVERED: "bg-yellow-50 text-yellow-700",
    REVISION: "bg-orange-50 text-orange-700",
    APPROVED: "bg-green-50 text-green-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    DISPUTED: "bg-red-50 text-red-700",
    CANCELLED: "bg-gray-50 text-gray-700",
  };

  const typeStyles: Record<string, string> = {
    SHORT_VIDEO: "bg-blue-100 text-blue-700",
    LIVE: "bg-red-100 text-red-700",
    COMBO: "bg-purple-100 text-purple-700",
  };

  const typeLabels: Record<string, string> = {
    SHORT_VIDEO: "Short Video",
    LIVE: "LIVE",
    COMBO: "Combo",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Portfolio Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Assigned Brands</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {brandIds.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Assigned Agencies
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {assignedAgencyCount}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Client Orders
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-600">
            {clientOrders}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Client Revenue
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Orders by Status
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {allStatuses.map((status) => (
            <div
              key={status}
              className={`rounded-lg p-4 text-center ${
                statusBgColors[status] ?? "bg-gray-50 text-gray-700"
              }`}
            >
              <p className="text-2xl font-bold">
                {statusBreakdown[status] ?? 0}
              </p>
              <p className="text-sm">{status.replace("_", " ")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Client Orders */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Client Orders
          </h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No client orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Brand
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Budget
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {order.title}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.brand.companyName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.category.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          typeStyles[order.type] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {typeLabels[order.type] ?? order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[order.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatCurrency(order.budget)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
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
