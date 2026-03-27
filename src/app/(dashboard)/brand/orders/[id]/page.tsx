import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import DeliveryActions from "./DeliveryActions";
import OrderActions from "./OrderActions";

export const dynamic = "force-dynamic"

export default async function BrandOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      assignments: {
        include: {
          creator: { include: { user: true } },
        },
      },
      deliveries: {
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
      </div>
    );
  }

  const statusSteps = ["DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "APPROVED", "COMPLETED"];
  const currentIndex = statusSteps.indexOf(order.status);

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
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center gap-4">
        <a href="/brand/orders" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Orders
        </a>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{order.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {order.category.name} &middot; Created {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            statusColors[order.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>

      {/* Actions */}
      {(order.status === "DRAFT" || order.status === "OPEN") && (
        <OrderActions orderId={order.id} status={order.status} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Impressions</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{formatNumber(order.impressionTarget)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(order.budget)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">CPM Rate</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(order.cpmRate)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Max Creators</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{order.maxCreators}</p>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Description</h2>
        <p className="mt-2 text-gray-600">{order.description}</p>
        {order.brief && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-gray-700">Brief</h3>
            <p className="mt-1 whitespace-pre-wrap text-gray-600">{order.brief}</p>
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Timeline</h2>
        <div className="flex items-center justify-between">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i <= currentIndex ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span className="mt-1 text-xs text-gray-500">{step.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned Creators */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Assigned Creators</h2>
        {order.assignments.length === 0 ? (
          <p className="text-gray-500">No creators assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {order.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {assignment.creator?.user.name ?? "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{assignment.creator?.tiktokUsername}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[assignment.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {assignment.status.replace("_", " ")}
                  </span>
                  <p className="mt-1 text-xs text-gray-400">
                    Accepted: {new Date(assignment.acceptedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliveries */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Deliveries</h2>
        {order.deliveries.length === 0 ? (
          <p className="text-gray-500">No deliveries submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {order.deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <a
                      href={delivery.tiktokLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {delivery.tiktokLink}
                    </a>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      {delivery.impressions != null && (
                        <span>Impressions: {formatNumber(delivery.impressions)}</span>
                      )}
                      {delivery.views != null && (
                        <span>Views: {formatNumber(delivery.views)}</span>
                      )}
                      {delivery.likes != null && (
                        <span>Likes: {formatNumber(delivery.likes)}</span>
                      )}
                      {delivery.comments != null && (
                        <span>Comments: {formatNumber(delivery.comments)}</span>
                      )}
                      {delivery.shares != null && (
                        <span>Shares: {formatNumber(delivery.shares)}</span>
                      )}
                    </div>
                    {delivery.notes && (
                      <p className="mt-2 text-sm text-gray-500">{delivery.notes}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Submitted: {new Date(delivery.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {delivery.approved === true && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Approved
                      </span>
                    )}
                    {delivery.approved === false && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        Rejected
                      </span>
                    )}
                    {delivery.approved === null && (
                      <DeliveryActions deliveryId={delivery.id} orderId={order.id} />
                    )}
                  </div>
                </div>
                {delivery.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600">
                    Reason: {delivery.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
