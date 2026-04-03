import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatNumber } from "@/lib/utils";
import RefreshTikTokButton from "./RefreshTikTokButton";
import ContentTypeEditor from "./ContentTypeEditor";
import VerificationBanner from "./VerificationBanner";
import { TierBadge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic"

export default async function CreatorProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    include: {
      categories: { include: { category: true } },
      user: true,
    },
  });

  if (!creator) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Creator Profile Not Found</h1>
        <p className="mt-2 text-gray-600">Please complete your onboarding first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{creator.user.name}</h1>
          <p className="mt-1 text-gray-500">@{creator.tiktokUsername}</p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={creator.tier} />
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-[#d4772c]">
            Score: {creator.score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* TikTok Verification */}
      <VerificationBanner
        creatorId={creator.id}
        isVerified={creator.tiktokVerified}
        verifiedAt={creator.verifiedAt?.toISOString() ?? null}
        verificationMethod={creator.verificationMethod}
        existingCode={creator.verificationCode}
        codeExpiresAt={creator.verificationCodeExp?.toISOString() ?? null}
      />

      {/* TikTok Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Followers" value={formatNumber(creator.followerCount)} />
        <StatCard label="Avg Views" value={formatNumber(creator.avgViews)} />
        <StatCard label="Engagement Rate" value={`${creator.engagementRate.toFixed(2)}%`} />
        <StatCard label="Total Likes" value={formatNumber(creator.totalLikes)} />
      </div>

      {/* Bio & Portfolio */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">About</h2>
        <p className="mt-2 text-gray-600">{creator.bio || "No bio set."}</p>

        {creator.portfolioLinks.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Portfolio Links</h3>
            <ul className="mt-2 space-y-1">
              {creator.portfolioLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d4772c] hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {creator.categories.length > 0 ? (
            creator.categories.map(({ category }) => (
              <span
                key={category.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
              >
                {category.name}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No categories selected.</p>
          )}
        </div>
      </div>

      {/* Content Type Support */}
      <ContentTypeEditor
        creatorId={creator.id}
        initialShortVideo={creator.supportsShortVideo}
        initialLive={creator.supportsLive}
      />

      {/* Payout Settings */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Payout Settings</h2>
        <div className="mt-3 flex items-center gap-3">
          {creator.stripeOnboarded ? (
            <>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Payoneer Connected
              </span>
              <p className="text-sm text-gray-500">Your payouts are active.</p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                Not Connected
              </span>
              <a
                href="/api/payoneer/connect"
                className="text-sm font-medium text-[#d4772c] hover:underline"
              >
                Connect Payoneer Account
              </a>
            </>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex items-center gap-4">
        <RefreshTikTokButton creatorId={creator.id} />
        {creator.metricsUpdatedAt && (
          <p className="text-sm text-gray-500">
            Last updated: {new Date(creator.metricsUpdatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
