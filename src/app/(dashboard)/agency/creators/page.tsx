import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/utils";
import { TierBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AgencyCreatorsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENCY") redirect("/login");

  const agency = await prisma.agency.findUnique({
    where: { userId: session.user.id },
  });
  if (!agency) redirect("/login");

  const agencyCreators = await prisma.agencyCreator.findMany({
    where: { agencyId: agency.id },
    include: {
      creator: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900">Managed Creators</h1>

      {agencyCreators.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No creators linked yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencyCreators.map((ac) => {
            const c = ac.creator;
            return (
              <a
                key={ac.id}
                href={`/agency/creators/${c.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {c.user.name ?? "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">@{c.tiktokUsername}</p>
                  </div>
                  <TierBadge tier={c.tier} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Followers</p>
                    <p className="font-medium text-gray-900">
                      {formatNumber(c.followerCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Views</p>
                    <p className="font-medium text-gray-900">
                      {formatNumber(c.avgViews)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Score</p>
                    <p className="font-medium text-gray-900">
                      {c.score.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.supportsShortVideo && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Short Video
                    </span>
                  )}
                  {c.supportsLive && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      LIVE
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
