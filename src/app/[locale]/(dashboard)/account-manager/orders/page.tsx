import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AMOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ACCOUNT_MANAGER")
    redirect("/login");

  const am = await prisma.accountManager.findUnique({
    where: { userId: session.user.id },
  });
  if (!am) redirect("/login");

  // Get all brand IDs assigned to this AM
  const assignedBrands = await prisma.accountManagerBrand.findMany({
    where: { accountManagerId: am.id },
    select: { brandId: true },
  });

  const brandIds = assignedBrands.map((ab) => ab.brandId);

  const t = await getTranslations("orders");

  const orders = await prisma.order.findMany({
    where: { brandId: { in: brandIds } },
    include: {
      brand: { select: { companyName: true } },
      category: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Client Orders</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
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
                    {t("brand_heading")}
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    {t("category_label")}
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    {t("budget_label")}
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
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
                      <OrderTypeBadge type={order.type} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
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
