import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import AgencyOrderActions from "./AgencyOrderActions";

export const dynamic = "force-dynamic";

export default async function AgencyBrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  // Verify brand is linked to this agency
  const agencyBrand = await prisma.agencyBrand.findUnique({
    where: { agencyId_brandId: { agencyId: agency.id, brandId: id } },
  });
  if (!agencyBrand || agencyBrand.status !== "APPROVED") redirect("/agency/brands");

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
  if (!brand) redirect("/agency/brands");

  const orders = await prisma.order.findMany({
    where: { brandId: id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 20,
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
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <a href="/agency/brands" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Brands
        </a>
      </div>

      {/* Brand Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {brand.companyName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {brand.industry ?? "No industry specified"}
            </p>
          </div>
          <a
            href={`/agency/orders/new?brandId=${brand.id}`}
            className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a]"
          >
            Create Order for Brand
          </a>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-700">Contact:</span>{" "}
            {brand.user.name ?? "—"} ({brand.user.email})
          </p>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Recent Orders
        </h2>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No orders yet for this brand.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {order.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.category.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        typeStyles[order.type] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {typeLabels[order.type] ?? order.type}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-600">
                  <span>Budget: {formatCurrency(order.budget)}</span>
                  <span>
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {(order.status === "DRAFT" || order.status === "OPEN") && (
                  <div className="mt-3">
                    <AgencyOrderActions orderId={order.id} status={order.status} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
