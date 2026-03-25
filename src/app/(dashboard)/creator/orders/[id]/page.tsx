import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatNumber } from "@/lib/utils";
import DeliveryForm from "./DeliveryForm";

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

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
      </div>
    );
  }

  const isAssigned = order.assignments.length > 0;
  const assignment = order.assignments[0];

  const statusSteps = ["OPEN", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "APPROVED", "COMPLETED"];
  const currentIndex = statusSteps.indexOf(order.status);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{order.title}</h1>
          <p className="mt-1 text-gray-500">{order.brand.companyName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoCard label="Category" value={order.category.name} />
        <InfoCard label="Impressions" value={formatNumber(order.impressionTarget)} />
        <InfoCard label="Budget" value={formatCurrency(order.budget)} />
        <InfoCard label="CPM Rate" value={formatCurrency(order.cpmRate)} />
      </div>

      {/* Description & Brief */}
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

      {/* Status Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Timeline</h2>
        <div className="flex items-center justify-between">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i <= currentIndex
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span className="mt-1 text-xs text-gray-500">{step.replace("_", " ")}</span>
              {i < statusSteps.length - 1 && (
                <div className="absolute h-0.5 w-full bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Form (if assigned) */}
      {isAssigned && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Submit Delivery</h2>
          <DeliveryForm orderId={order.id} />
        </div>
      )}

      {/* Delivery History */}
      {order.deliveries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Delivery History</h2>
          <div className="space-y-4">
            {order.deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <a
                    href={delivery.tiktokLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {delivery.tiktokLink}
                  </a>
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
                      ? "Approved"
                      : delivery.approved === false
                      ? "Rejected"
                      : "Pending Review"}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-gray-600">
                  {delivery.impressions != null && <span>Impressions: {formatNumber(delivery.impressions)}</span>}
                  {delivery.views != null && <span>Views: {formatNumber(delivery.views)}</span>}
                  {delivery.likes != null && <span>Likes: {formatNumber(delivery.likes)}</span>}
                </div>
                {delivery.notes && (
                  <p className="mt-2 text-sm text-gray-500">{delivery.notes}</p>
                )}
                {delivery.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600">
                    Rejection reason: {delivery.rejectionReason}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Submitted: {new Date(delivery.submittedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    COMPLETED: "bg-green-100 text-green-700",
    REVISION: "bg-orange-100 text-orange-700",
    DISPUTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
