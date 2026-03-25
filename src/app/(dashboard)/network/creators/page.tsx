import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const tierLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Bronze", color: "bg-amber-700 text-white" },
  2: { label: "Silver", color: "bg-gray-400 text-white" },
  3: { label: "Gold", color: "bg-yellow-500 text-white" },
  4: { label: "Platinum", color: "bg-cyan-400 text-gray-900" },
  5: { label: "Diamond", color: "bg-purple-500 text-white" },
};

export default async function NetworkCreatorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const network = await prisma.creatorNetwork.findUnique({
    where: { userId: session.user.id },
  });

  if (!network) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Network Not Found</h1>
        <p className="mt-2 text-gray-600">Please complete your network onboarding first.</p>
      </div>
    );
  }

  const creators = await prisma.creator.findMany({
    where: { networkId: network.id },
    include: { user: true },
    orderBy: { score: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Network Creators</h1>
        <a
          href="/network/creators/add"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Creator
        </a>
      </div>

      {creators.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No creators in your network yet.</p>
          <a
            href="/network/creators/add"
            className="mt-4 inline-block text-indigo-600 hover:underline"
          >
            Add your first creator
          </a>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => {
            const tier = tierLabels[creator.tier] ?? tierLabels[1];
            return (
              <div
                key={creator.id}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{creator.user.name}</h3>
                    <p className="text-sm text-gray-500">@{creator.tiktokUsername}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(creator.followerCount)}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(creator.avgViews)}</p>
                    <p className="text-xs text-gray-500">Avg Views</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{creator.engagementRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Engagement</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    Score: {creator.score.toFixed(1)}
                  </span>
                  <span className={`text-xs ${creator.stripeOnboarded ? "text-green-600" : "text-gray-400"}`}>
                    {creator.stripeOnboarded ? "Stripe Connected" : "No Stripe"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
