import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import DeliveryActions from "./DeliveryActions";
import OrderActions from "./OrderActions";
import DeliveryAiInsights from "@/components/DeliveryAiInsights";

export const dynamic = "force-dynamic";

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

  const statusSteps = ["DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "COMPLETED"];
  const isRevision = order.status === "REVISION";
  const isDisputed = order.status === "DISPUTED";
  const currentIndex = isRevision || isDisputed
    ? statusSteps.indexOf("DELIVERED")
    : statusSteps.indexOf(order.status);

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

  const isOverdue = order.expiresAt && new Date(order.expiresAt) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(order.status);

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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{order.title}</h1>
            <OrderTypeBadge type={order.type} />
          </div>
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {(order.type === "SHORT_VIDEO" || order.type === "COMBO") && (
          <>
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
          </>
        )}
        {(order.type === "LIVE" || order.type === "COMBO") && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">LIVE Fee</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(order.liveFlatFee ?? 0)}</p>
            </div>
            {order.liveMinDuration && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Min Duration</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{order.liveMinDuration} min</p>
              </div>
            )}
          </>
        )}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Max Creators</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{order.maxCreators}</p>
        </div>
        <div className={`rounded-lg border p-4 shadow-sm ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
          <p className="text-sm text-gray-500">Deadline</p>
          <p className={`mt-1 text-lg font-semibold ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
            {order.expiresAt ? new Date(order.expiresAt).toLocaleDateString() : "No deadline"}
          </p>
          {isOverdue && <p className="text-xs font-medium text-red-500">Overdue</p>}
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

      {/* LIVE Content Guidelines */}
      {(order.type === "LIVE" || order.type === "COMBO") && order.liveGuidelines && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800">LIVE Content Guidelines</h3>
          <p className="mt-1 text-sm text-amber-700 whitespace-pre-wrap">{order.liveGuidelines}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Timeline</h2>
        <div className="flex items-center justify-between">
          {statusSteps.map((step, i) => {
            const isActive = i <= currentIndex;
            const isRevisionStep = isRevision && step === "DELIVERED";
            return (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    isRevisionStep
                      ? "bg-orange-500 text-white ring-2 ring-orange-300"
                      : isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`mt-1 text-xs ${isRevisionStep ? "font-semibold text-orange-600" : "text-gray-500"}`}>
                  {isRevisionStep ? "REVISION" : step.replace("_", " ")}
                </span>
              </div>
            );
          })}
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
                  <div className="space-y-1">
                    <a
                      href={delivery.tiktokLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline block"
                    >
                      {delivery.tiktokLink}
                    </a>
                    {delivery.tiktokLinks.map((link: string, i: number) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline block"
                      >
                        {link}
                      </a>
                    ))}
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
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  {delivery.deliveryType === "LIVE" ? (
                    <>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">LIVE</span>
                      {delivery.streamDuration != null && (
                        <span>Duration: {formatNumber(delivery.streamDuration)} min</span>
                      )}
                      {delivery.peakViewers != null && (
                        <span>Peak Viewers: {formatNumber(delivery.peakViewers)}</span>
                      )}
                      {delivery.avgConcurrentViewers != null && (
                        <span>Avg Concurrent: {formatNumber(delivery.avgConcurrentViewers)}</span>
                      )}
                      {delivery.chatMessages != null && (
                        <span>Chat Messages: {formatNumber(delivery.chatMessages)}</span>
                      )}
                      {delivery.giftsValue != null && (
                        <span>Gifts Value: {formatCurrency(delivery.giftsValue)}</span>
                      )}
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                {delivery.notes && (
                  <p className="mt-2 text-sm text-gray-500">{delivery.notes}</p>
                )}
                {delivery.screenshots.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {delivery.screenshots.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {delivery.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600">
                    Reason: {delivery.rejectionReason}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Submitted: {new Date(delivery.submittedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Delivery Analysis */}
      {order.status === "COMPLETED" && (
        <DeliveryAiInsights orderId={order.id} />
      )}
    </div>
  );
}

function OrderTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    SHORT_VIDEO: "bg-blue-100 text-blue-700",
    LIVE: "bg-red-100 text-red-700",
    COMBO: "bg-purple-100 text-purple-700",
  };
  const labels: Record<string, string> = {
    SHORT_VIDEO: "Short Video",
    LIVE: "LIVE Stream",
    COMBO: "Combo",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[type] ?? type}
    </span>
  );
}
