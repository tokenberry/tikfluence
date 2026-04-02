import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic"

export default async function NetworkOrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const network = await prisma.creatorNetwork.findUnique({
    where: { userId: session.user.id },
  });

  if (!network) redirect("/network/creators");

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
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Network Orders</h1>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No orders associated with your network yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((assignment) => (
            <a
              key={assignment.id}
              href={`/network/orders/${assignment.order.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{assignment.order.title}</h3>
                <StatusBadge status={assignment.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">{assignment.order.brand.companyName}</p>
              {assignment.creator && (
                <p className="mt-1 text-sm text-indigo-600">
                  Creator: {assignment.creator.user.name}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                <span>{assignment.order.category.name}</span>
                <span>{formatNumber(assignment.order.impressionTarget)} impressions</span>
                <span>{formatCurrency(assignment.order.budget)}</span>
                <span>CPM: {formatCurrency(assignment.order.cpmRate)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
