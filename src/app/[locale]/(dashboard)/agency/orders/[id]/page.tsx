import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import DeliveryAiInsights from "@/components/DeliveryAiInsights";
import OrderChatPanel, {
  type OrderChatAssignmentOption,
} from "@/components/OrderChatPanel";
import AgencyOrderActions from "../../brands/[id]/AgencyOrderActions";
import DeliveryActions from "@/app/[locale]/(dashboard)/brand/orders/[id]/DeliveryActions";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AgencyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("orders");
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

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
        <h1 className="text-2xl font-bold text-gray-900">{t("order_not_found")}</h1>
      </div>
    );
  }

  // Verify agency manages this brand
  const agencyBrand = await prisma.agencyBrand.findFirst({
    where: { agencyId: agency.id, brandId: order.brandId, status: "APPROVED" },
  });
  if (!agencyBrand && order.agencyId !== agency.id) redirect("/agency/orders");

  const statusSteps = ["DRAFT", "OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "COMPLETED"];
  const isRevision = order.status === "REVISION";
  const isDisputed = order.status === "DISPUTED";
  const currentIndex = isRevision || isDisputed
    ? statusSteps.indexOf("DELIVERED")
    : statusSteps.indexOf(order.status);

  const isOverdue = order.expiresAt && new Date(order.expiresAt) < new Date() &&
    !["COMPLETED", "CANCELLED"].includes(order.status);

  const chatAssignments: OrderChatAssignmentOption[] = order.assignments.map(
    (a) => ({
      id: a.id,
      label:
        a.creator?.user.name ??
        (a.creator?.tiktokUsername
          ? `@${a.creator.tiktokUsername}`
          : t("unknown_creator")),
    })
  );
  const showChat =
    chatAssignments.length > 0 &&
    !["DRAFT", "OPEN", "CANCELLED"].includes(order.status);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center gap-4">
        <a href="/agency/orders" className="text-gray-500 hover:text-gray-700">
          &larr; {t("back_to_orders")}
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
            {order.brand.companyName} &middot; {order.category.name} &middot; Created {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Actions */}
      {(order.status === "DRAFT" || order.status === "OPEN" || order.status === "ASSIGNED" || order.status === "IN_PROGRESS") && (
        <AgencyOrderActions orderId={order.id} status={order.status} budget={order.budget} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(order.type === "SHORT_VIDEO" || order.type === "COMBO") && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{t("impressions_label")}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatNumber(order.impressionTarget)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{t("budget_label")}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(order.budget)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{t("cpm_label")}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(order.cpmRate)}</p>
            </div>
          </>
        )}
        {(order.type === "LIVE" || order.type === "COMBO") && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{t("live_fee_label")}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(order.liveFlatFee ?? 0)}</p>
            </div>
            {order.liveMinDuration && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">{t("min_duration_label")}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{order.liveMinDuration} min</p>
              </div>
            )}
          </>
        )}
        <div className={`rounded-lg border p-4 shadow-sm ${isOverdue ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
          <p className="text-sm text-gray-500">{t("deadline_label")}</p>
          <p className={`mt-1 text-lg font-semibold ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
            {order.expiresAt ? new Date(order.expiresAt).toLocaleDateString() : t("no_deadline")}
          </p>
          {isOverdue && <p className="text-xs font-medium text-red-500">{t("overdue")}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">{t("description_heading")}</h2>
        <p className="mt-2 text-gray-600">{order.description}</p>
        {order.brief && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-gray-700">{t("brief_heading")}</h3>
            <p className="mt-1 whitespace-pre-wrap text-gray-600">{order.brief}</p>
          </>
        )}
      </div>

      {/* LIVE Content Guidelines */}
      {(order.type === "LIVE" || order.type === "COMBO") && order.liveGuidelines && (
        <Alert variant="warning">
          <AlertTitle>{t("live_content_guidelines")}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{order.liveGuidelines}</AlertDescription>
        </Alert>
      )}

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("order_timeline")}</h2>
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
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("assigned_creators")}</h2>
        {order.assignments.length === 0 ? (
          <p className="text-gray-500">{t("no_creators_assigned")}</p>
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
                <StatusBadge status={assignment.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliveries */}
      {order.deliveries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("deliveries")}</h2>
          <div className="space-y-4">
            {order.deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <a
                      href={delivery.tiktokLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d4772c] hover:underline block truncate"
                    >
                      {delivery.tiktokLink}
                    </a>
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
                  <div className="flex flex-col items-end gap-2">
                    {delivery.approved === true && (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {t("delivery_approved")}
                      </span>
                    )}
                    {delivery.approved === false && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        {t("delivery_rejected")}
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
                          alt={t("screenshot_alt", { number: i + 1 })}
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
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Chat */}
      {showChat && (
        <OrderChatPanel
          orderId={order.id}
          currentUserId={session.user.id}
          assignments={chatAssignments}
          showAssignmentPicker={chatAssignments.length > 1}
        />
      )}

      {/* AI Delivery Analysis */}
      {order.status === "COMPLETED" && (
        <DeliveryAiInsights orderId={order.id} />
      )}
    </div>
  );
}

