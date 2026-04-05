import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AgencyOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { agencyId: agency.id },
    include: {
      brand: { select: { companyName: true } },
      category: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Agency Orders</h1>
        <a
          href="/agency/orders/new"
          className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
        >
          Create New Order
        </a>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No orders created yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <a
                      href={`/agency/orders/${order.id}`}
                      className="font-medium text-gray-900 hover:text-[#d4772c]"
                    >
                      {order.title}
                    </a>
                    <p className="text-xs text-gray-500">
                      {order._count.assignments} assignment(s)
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.brand.companyName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.category.name}
                  </td>
                  <td className="px-6 py-4">
                    <OrderTypeBadge type={order.type} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatCurrency(order.budget)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
