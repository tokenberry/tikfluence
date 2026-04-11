import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import DeliveryForm from "./DeliveryForm";
import DeliveryAiInsights from "@/components/DeliveryAiInsights";
import OrderChatPanel, {
  type OrderChatAssignmentOption,
} from "@/components/OrderChatPanel";
import { StatusBadge, OrderTypeBadge } from "@/components/ui/Badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic"

export default async function CreatorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
  });

  if (!creator) redirect("/creator/profile");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      assignments: {
        where: { creatorId: creator.id },
      },
      deliveries: {
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  const t = await getTranslations("orders");

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("order_not_found")}</h1>
      </div>
    );
  }

  const isAssigned = order.assignments.length > 0;

  const statusSteps = ["OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "COMPLETED"];
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
      label: order.brand.companyName,
    })
  );
  const showChat =
    isAssigned && !["CANCELLED"].includes(order.status);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{order.title}</h1>
            <OrderTypeBadge type={order.type} />
          </div>
          <p className="mt-1 text-gray-500">{order.brand.companyName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <InfoCard label={t("category_label")} value={order.category.name} />
        {(order.type === "SHORT_VIDEO" || order.type === "COMBO") && (
          <>
            <InfoCard label={t("impressions_label")} value={formatNumber(order.impressionTarget)} />
            <InfoCard label={t("budget_label")} value={formatCurrency(order.budget)} />
            <InfoCard label={t("cpm_label")} value={formatCurrency(order.cpmRate)} />
          </>
        )}
        {(order.type === "LIVE" || order.type === "COMBO") && (
          <>
            <InfoCard label={t("live_fee_label")} value={formatCurrency(order.liveFlatFee ?? 0)} />
            {order.liveMinDuration && <InfoCard label={t("min_duration_label")} value={`${order.liveMinDuration} min`} />}
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

      {/* LIVE Content Guidelines */}
      {(order.type === "LIVE" || order.type === "COMBO") && order.liveGuidelines && (
        <Alert variant="warning">
          <AlertTitle>{t("live_content_guidelines")}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{order.liveGuidelines}</AlertDescription>
        </Alert>
      )}

      {/* Description & Brief */}
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

      {/* Status Timeline */}
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

      {/* Delivery Form (if assigned) */}
      {isAssigned && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("submit_delivery")}</h2>
          <DeliveryForm orderId={order.id} orderType={order.type} />
        </div>
      )}

      {/* Delivery History */}
      {order.deliveries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("delivery_history")}</h2>
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
                      className="text-[#d4772c] hover:underline block"
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
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      delivery.approved === true
                        ? "bg-green-100 text-green-700"
                        : delivery.approved === false
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {delivery.approved === true
                      ? t("delivery_approved")
                      : delivery.approved === false
                      ? t("delivery_rejected")
                      : t("delivery_pending")}
                  </span>
                </div>
                {delivery.deliveryType === "LIVE" && (
                  <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{t("delivery_type_live")}</span>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  {delivery.deliveryType === "LIVE" ? (
                    <>
                      {delivery.streamDuration != null && <span>Duration: {delivery.streamDuration} min</span>}
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
                  <div className="mt-2">
                    <p className="text-sm text-red-600">
                      Rejection reason: {delivery.rejectionReason}
                    </p>
                    <a
                      href={`/creator/tickets/new?orderId=${order.id}&orderTitle=${encodeURIComponent(order.title)}`}
                      className="mt-2 inline-block rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
                    >
                      {t("report_issue")}
                    </a>
                  </div>
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
        />
      )}

      {/* AI Delivery Analysis */}
      {order.status === "COMPLETED" && (
        <DeliveryAiInsights orderId={order.id} />
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

