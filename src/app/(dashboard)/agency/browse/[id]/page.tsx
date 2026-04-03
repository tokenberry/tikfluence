import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { getLatestCreatorAnalysis } from "@/lib/ai";
import { TierBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AgencyCreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, avatar: true } },
      categories: { include: { category: true } },
      network: { select: { companyName: true } },
    },
  });

  if (!creator) notFound();

  const aiAnalysis = await getLatestCreatorAnalysis(creator.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href="/agency/browse"
        className="inline-flex items-center text-sm text-gray-500 hover:text-[#d4772c]"
      >
        &larr; Back to Browse
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-2xl font-bold text-[#d4772c]">
            {creator.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {creator.user.name}
              </h1>
              <TierBadge tier={creator.tier} />
            </div>
            <p className="text-gray-500">@{creator.tiktokUsername}</p>
            {creator.network && (
              <p className="mt-1 text-sm text-gray-400">
                Network: {creator.network.companyName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(creator.pricePerThousand)}
            </p>
            <p className="text-sm text-gray-500">per 1K impressions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(creator.followerCount)}
            </p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(creator.avgViews)}
            </p>
            <p className="text-xs text-gray-500">Avg Views</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {creator.score.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Score</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {creator.engagementRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Engagement</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(creator.totalVideos)}
            </p>
            <p className="text-xs text-gray-500">Videos</p>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700">About</h2>
            <p className="mt-1 text-sm text-gray-600">{creator.bio}</p>
          </div>
        )}

        {/* Categories */}
        {creator.categories.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700">Categories</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {creator.categories.map(({ category }) => (
                <span
                  key={category.id}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Links */}
        {creator.portfolioLinks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700">Portfolio</h2>
            <div className="mt-2 space-y-1">
              {creator.portfolioLinks.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[#d4772c] hover:underline"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Content Types */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700">Supports</h2>
          <div className="mt-2 flex gap-2">
            {creator.supportsShortVideo && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Short Video</span>
            )}
            {creator.supportsLive && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">LIVE Stream</span>
            )}
          </div>
        </div>

        {/* AI Insights */}
        {aiAnalysis && (
          <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50/50 p-5">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              AI Insights
            </h2>
            <p className="mt-2 text-sm text-gray-700">{aiAnalysis.summary}</p>

            {aiAnalysis.bestContentTypes.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Best for:</p>
                <div className="flex gap-1.5">
                  {aiAnalysis.bestContentTypes.map((type) => (
                    <span
                      key={type}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        type === "LIVE" ? "bg-red-100 text-red-700"
                        : type === "SHORT_VIDEO" ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {type === "SHORT_VIDEO" ? "Short Video" : type === "LIVE" ? "LIVE Stream" : type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                <ul className="space-y-0.5">
                  {aiAnalysis.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-gray-600">+ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">Consider</p>
                <ul className="space-y-0.5">
                  {aiAnalysis.weaknesses.slice(0, 2).map((w, i) => (
                    <li key={i} className="text-xs text-gray-600">- {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {aiAnalysis.recommendedCpm != null && (
              <p className="mt-3 text-xs text-orange-700">
                AI Recommended CPM: <span className="font-bold">${aiAnalysis.recommendedCpm.toFixed(2)}</span>
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 border-t border-gray-100 pt-6">
          <Link
            href="/agency/browse"
            className="inline-block rounded-md bg-[#d4772c] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    </div>
  );
}
