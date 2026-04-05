import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import AgencyOrderActions from "./AgencyOrderActions";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AgencyBrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("agency");
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
            {t("orders_create")}
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
                      <a href={`/agency/orders/${order.id}`} className="hover:text-[#d4772c]">
                        {order.title}
                      </a>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.category.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderTypeBadge type={order.type} />
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-600">
                  <span>Budget: {formatCurrency(order.budget)}</span>
                  <span>
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {(order.status === "DRAFT" || order.status === "OPEN" || order.status === "ASSIGNED" || order.status === "IN_PROGRESS") && (
                  <div className="mt-3">
                    <AgencyOrderActions orderId={order.id} status={order.status} budget={order.budget} />
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
