import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import OrderStatusFilter from "./OrderStatusFilter";

export const dynamic = "force-dynamic";

export default async function BrandOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const brand = await prisma.brand.findUnique({
    where: { userId: session.user.id },
  });

  if (!brand) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Brand Profile Not Found</h1>
      </div>
    );
  }

  const where: Record<string, unknown> = { brandId: brand.id };
  if (status && status !== "ALL") {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      category: true,
      _count: { select: { assignments: true, deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <a
          href="/brand/orders/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create New Order
        </a>
      </div>

      <OrderStatusFilter currentStatus={status ?? "ALL"} />

      {orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <a
              key={order.id}
              href={`/brand/orders/${order.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{order.category.name}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[order.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-600">
                <span>Target: {formatNumber(order.impressionTarget)} impressions</span>
                <span>Budget: {formatCurrency(order.budget)}</span>
                <span>CPM: {formatCurrency(order.cpmRate)}</span>
                <span>{order._count.assignments} creator(s)</span>
                <span>{order._count.deliveries} delivery(ies)</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Created: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
