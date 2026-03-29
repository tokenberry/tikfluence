import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tierConfig: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: "Bronze", bg: "bg-amber-700", text: "text-white" },
  2: { label: "Silver", bg: "bg-gray-400", text: "text-white" },
  3: { label: "Gold", bg: "bg-yellow-500", text: "text-white" },
  4: { label: "Platinum", bg: "bg-cyan-400", text: "text-gray-900" },
  5: { label: "Diamond", bg: "bg-purple-500", text: "text-white" },
};

export default async function AgencyCreatorDetailPage({
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

  // Verify creator is linked to this agency
  const agencyCreator = await prisma.agencyCreator.findUnique({
    where: { agencyId_creatorId: { agencyId: agency.id, creatorId: id } },
  });
  if (!agencyCreator) redirect("/agency/creators");

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
  if (!creator) redirect("/agency/creators");

  const assignments = await prisma.orderAssignment.findMany({
    where: { creatorId: id },
    include: {
      order: {
        include: { category: true, brand: true },
      },
    },
    orderBy: { acceptedAt: "desc" },
    take: 10,
  });

  const tier = tierConfig[creator.tier] ?? tierConfig[1];

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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <a href="/agency/creators" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Creators
        </a>
      </div>

      {/* Creator Profile */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {creator.user.name ?? "Unknown"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              @{creator.tiktokUsername}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${tier.bg} ${tier.text}`}
          >
            {tier.label}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Followers</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatNumber(creator.followerCount)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Avg Views</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatNumber(creator.avgViews)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Engagement</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {creator.engagementRate.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Score</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {creator.score.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Videos</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {formatNumber(creator.totalVideos)}
            </p>
          </div>
        </div>

        {/* Content Types */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700">Content Types</p>
          <div className="mt-2 flex gap-2">
            {creator.supportsShortVideo && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                Short Video
              </span>
            )}
            {creator.supportsLive && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                LIVE
              </span>
            )}
            {!creator.supportsShortVideo && !creator.supportsLive && (
              <span className="text-sm text-gray-500">No content types set</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Recent Order Assignments
        </h2>
        {assignments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">No order assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {a.order.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {a.order.brand.companyName} &middot;{" "}
                      {a.order.category.name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[a.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {a.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Accepted: {new Date(a.acceptedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
