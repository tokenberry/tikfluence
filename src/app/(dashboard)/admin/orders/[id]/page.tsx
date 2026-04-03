import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import AdminOrderActions from "./AdminOrderActions";
import DeliveryAiInsights from "@/components/DeliveryAiInsights";
import { StatusBadge, OrderTypeBadge, PaymentStatusBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      brand: { include: { user: { select: { email: true, name: true } } } },
      category: true,
      assignments: {
        include: {
          creator: { include: { user: { select: { name: true, email: true } } } },
          network: { include: { user: { select: { name: true, email: true } } } },
        },
      },
      deliveries: {
        orderBy: { submittedAt: "desc" },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
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

  const isOverdue = order.expiresAt && new Date(order.expiresAt) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(order.status);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center gap-4">
        <a href="/admin/orders" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Orders
        </a>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{order.title}</h1>
            <OrderTypeBadge type={order.type} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {order.category.name} &middot; Created {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Admin Actions */}
      <AdminOrderActions orderId={order.id} status={order.status} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Payment</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{order.paymentStatus}</p>
        </div>
        <div className={`rounded-lg border p-4 shadow-sm ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
          <p className="text-sm text-gray-500">Deadline</p>
          <p className={`mt-1 text-lg font-semibold ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
            {order.expiresAt ? new Date(order.expiresAt).toLocaleDateString() : "None"}
          </p>
          {isOverdue && <p className="text-xs font-medium text-red-500">Overdue</p>}
        </div>
      </div>

      {/* Brand Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Brand</h2>
        <p className="mt-2 text-gray-600">{order.brand.companyName}</p>
        <p className="text-sm text-gray-500">{order.brand.user.email}</p>
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
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          {statusSteps.map((step, i) => {
            const isActive = i <= currentIndex;
            const isRevisionStep = isRevision && step === "DELIVERED";
            return (
              <div key={step} className="flex flex-1 min-w-[60px] flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    isRevisionStep
                      ? "bg-orange-500 text-white ring-2 ring-orange-300"
                      : isActive
                      ? "bg-[#d4772c] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`mt-1 text-[10px] sm:text-xs text-center ${isRevisionStep ? "font-semibold text-orange-600" : "text-gray-500"}`}>
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
                    {assignment.creator?.user.name ?? assignment.network?.user.name ?? "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {assignment.creator?.user.email ?? assignment.network?.user.email}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={assignment.status} />
                  <p className="mt-1 text-xs text-gray-400">
                    Accepted: {new Date(assignment.acceptedAt).toLocaleDateString()}
                  </p>
                  {assignment.completedAt && (
                    <p className="text-xs text-gray-400">
                      Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                    </p>
                  )}
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
                    <div className="flex items-center gap-2">
                      <a
                        href={delivery.tiktokLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d4772c] hover:underline block"
                      >
                        {delivery.tiktokLink}
                      </a>
                      {delivery.deliveryType === "LIVE" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">LIVE</span>
                      )}
                    </div>
                    {delivery.tiktokLinks.map((link: string, i: number) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d4772c] hover:underline block"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                  <StatusBadge status={delivery.approved === true ? "APPROVED" : delivery.approved === false ? "REJECTED" : "PENDING_REVIEW"} />
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  {delivery.deliveryType === "LIVE" ? (
                    <>
                      {delivery.streamDuration != null && <span>Duration: {formatNumber(delivery.streamDuration)} min</span>}
                      {delivery.peakViewers != null && <span>Peak Viewers: {formatNumber(delivery.peakViewers)}</span>}
                      {delivery.avgConcurrentViewers != null && <span>Avg Concurrent: {formatNumber(delivery.avgConcurrentViewers)}</span>}
                      {delivery.chatMessages != null && <span>Chat: {formatNumber(delivery.chatMessages)}</span>}
                      {delivery.giftsValue != null && <span>Gifts: {formatCurrency(delivery.giftsValue)}</span>}
                    </>
                  ) : (
                    <>
                      {delivery.impressions != null && <span>Impressions: {formatNumber(delivery.impressions)}</span>}
                      {delivery.views != null && <span>Views: {formatNumber(delivery.views)}</span>}
                      {delivery.likes != null && <span>Likes: {formatNumber(delivery.likes)}</span>}
                      {delivery.comments != null && <span>Comments: {formatNumber(delivery.comments)}</span>}
                      {delivery.shares != null && <span>Shares: {formatNumber(delivery.shares)}</span>}
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
                  <p className="mt-2 text-sm text-red-600">Reason: {delivery.rejectionReason}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Submitted: {new Date(delivery.submittedAt).toLocaleString()}
                  {delivery.reviewedAt && ` · Reviewed: ${new Date(delivery.reviewedAt).toLocaleString()}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      {order.transactions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Transactions</h2>
          <div className="space-y-3">
            {order.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <p className="text-sm text-gray-900">
                    Total: {formatCurrency(tx.amount)} &middot; Fee: {formatCurrency(tx.platformFee)} &middot; Payout: {formatCurrency(tx.creatorPayout)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <PaymentStatusBadge status={tx.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Delivery Analysis */}
      {order.status === "COMPLETED" && (
        <DeliveryAiInsights orderId={order.id} />
      )}
    </div>
  );
}
