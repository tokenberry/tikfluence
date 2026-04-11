"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  UserPlus,
  RefreshCw,
  Check,
  Users,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

interface CreatorProfile {
  id: string
  tiktokUsername: string
  followerCount: number
  avgViews: number
  engagementRate: number
  score: number
  tier: number
  pricePerThousand: number
  bio: string | null
  supportsLive: boolean
  supportsShortVideo: boolean
  user: { name: string | null; avatar: string | null; image: string | null }
}

interface MatchRow {
  id: string
  creatorId: string
  matchScore: number
  matchReason: string
  reasoning: {
    audienceFit: string | null
    categoryFit: string | null
    contentStyleFit: string | null
    budgetFit: string | null
    engagementQuality: string | null
  } | null
  createdAt: string
  creator: CreatorProfile
}

interface InvitationRow {
  id: string
  creatorId: string
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED"
  createdAt: string
}

const BATCH_SIZES = [3, 5, 10] as const

interface ApiResponse {
  matches: MatchRow[]
  invitations: InvitationRow[]
  matchesGeneratedAt: string | null
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-700"
      : score >= 60
      ? "bg-blue-100 text-blue-700"
      : score >= 40
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700"
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold ${color}`}>
      {Math.round(score)}/100
    </span>
  )
}

export default function CreatorMatchList({ orderId }: { orderId: string }) {
  const t = useTranslations("matches")
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [batchingSize, setBatchingSize] = useState<number | null>(null)
  const [messageById, setMessageById] = useState<Record<string, string>>({})
  const [composerOpen, setComposerOpen] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/matches`)
      if (!res.ok) {
        if (res.status !== 403) {
          toast.error(t("load_failed"))
        }
        return
      }
      const json = (await res.json()) as ApiResponse
      setData(json)
    } catch {
      toast.error(t("load_failed"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/matches`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? t("generate_failed"))
        return
      }
      toast.success(t("generate_success"))
      await load()
    } catch {
      toast.error(t("generate_failed"))
    } finally {
      setGenerating(false)
    }
  }

  async function invite(creatorId: string) {
    setInvitingId(creatorId)
    try {
      const res = await fetch(`/api/orders/${orderId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId,
          message: messageById[creatorId]?.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? t("invite_failed"))
        return
      }
      toast.success(t("invite_success"))
      setComposerOpen(null)
      setMessageById((prev) => ({ ...prev, [creatorId]: "" }))
      await load()
    } catch {
      toast.error(t("invite_failed"))
    } finally {
      setInvitingId(null)
    }
  }

  async function batchInvite(topN: number) {
    if (!data) return
    // Pick the top N creators ranked by matchScore that haven't already
    // been invited or accepted (matches are already sorted server-side).
    const candidateIds = data.matches
      .filter((m) => {
        const inv = data.invitations.find((i) => i.creatorId === m.creatorId)
        return !inv || (inv.status !== "PENDING" && inv.status !== "ACCEPTED")
      })
      .slice(0, topN)
      .map((m) => m.creatorId)

    if (candidateIds.length === 0) {
      toast.info(t("batch_nothing_to_invite"))
      return
    }

    setBatchingSize(topN)
    try {
      const res = await fetch(
        `/api/orders/${orderId}/invitations/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorIds: candidateIds }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? t("batch_failed"))
        return
      }
      const result = (await res.json()) as {
        invited: number
        skipped: unknown[]
      }
      toast.success(
        t("batch_success", {
          count: result.invited,
          skipped: result.skipped.length,
        })
      )
      await load()
    } catch {
      toast.error(t("batch_failed"))
    } finally {
      setBatchingSize(null)
    }
  }

  async function withdraw(invitationId: string) {
    setWithdrawingId(invitationId)
    try {
      const res = await fetch(
        `/api/invitations/${invitationId}/withdraw`,
        { method: "POST" }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? t("withdraw_failed"))
        return
      }
      toast.success(t("withdraw_success"))
      await load()
    } catch {
      toast.error(t("withdraw_failed"))
    } finally {
      setWithdrawingId(null)
    }
  }

  const invitationByCreatorId = new Map<string, InvitationRow>()
  for (const inv of data?.invitations ?? []) {
    invitationByCreatorId.set(inv.creatorId, inv)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-[#fdf6e3] to-white px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#d4772c]" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t("title")}
            </h3>
          </div>
          <Button
            onClick={generate}
            disabled={generating || loading}
            size="sm"
            className="bg-[#d4772c] text-white hover:bg-[#b85c1a]"
          >
            {generating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : data?.matches?.length ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("regenerate")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("generate")}
              </>
            )}
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-500">{t("subtitle")}</p>
        {data?.matchesGeneratedAt && (
          <p className="mt-1 text-[11px] text-gray-400">
            {t("last_generated", {
              when: new Date(data.matchesGeneratedAt).toLocaleString(),
            })}
          </p>
        )}
        {data?.matches && data.matches.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Users className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">
              {t("batch_invite")}
            </span>
            {BATCH_SIZES.map((n) => (
              <Button
                key={n}
                size="sm"
                variant="outline"
                disabled={batchingSize !== null || loading || generating}
                onClick={() => batchInvite(n)}
                className="h-7 px-2 text-xs"
              >
                {batchingSize === n
                  ? t("batch_inviting")
                  : t("batch_invite_top_n", { n })}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center gap-2 px-6 py-10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#d4772c]" />
          <span className="text-sm text-gray-500">{t("loading")}</span>
        </div>
      ) : !data || data.matches.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-gray-500">{t("empty_state")}</p>
          <p className="mt-1 text-xs text-gray-400">{t("empty_state_hint")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.matches.map((m) => {
            const inv = invitationByCreatorId.get(m.creatorId)
            const invited =
              inv && (inv.status === "PENDING" || inv.status === "ACCEPTED")
            const isAccepted = inv?.status === "ACCEPTED"
            return (
              <li key={m.id} className="px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {m.creator.user.name ?? `@${m.creator.tiktokUsername}`}
                      </p>
                      <span className="text-sm text-gray-500">
                        @{m.creator.tiktokUsername}
                      </span>
                      <ScorePill score={m.matchScore} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>
                        {t("followers")}:{" "}
                        <span className="font-medium text-gray-700">
                          {formatNumber(m.creator.followerCount)}
                        </span>
                      </span>
                      <span>
                        {t("avg_views")}:{" "}
                        <span className="font-medium text-gray-700">
                          {formatNumber(m.creator.avgViews)}
                        </span>
                      </span>
                      <span>
                        {t("engagement")}:{" "}
                        <span className="font-medium text-gray-700">
                          {m.creator.engagementRate.toFixed(1)}%
                        </span>
                      </span>
                      <span>
                        {t("cpm")}:{" "}
                        <span className="font-medium text-gray-700">
                          ${m.creator.pricePerThousand.toFixed(2)}
                        </span>
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      {m.matchReason}
                    </p>
                    {m.reasoning && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-[#d4772c]">
                          {t("show_reasoning")}
                        </summary>
                        <dl className="mt-2 space-y-1 text-xs text-gray-600">
                          {m.reasoning.audienceFit && (
                            <div>
                              <dt className="inline font-semibold">
                                {t("audience_fit")}:
                              </dt>{" "}
                              <dd className="inline">
                                {m.reasoning.audienceFit}
                              </dd>
                            </div>
                          )}
                          {m.reasoning.categoryFit && (
                            <div>
                              <dt className="inline font-semibold">
                                {t("category_fit")}:
                              </dt>{" "}
                              <dd className="inline">
                                {m.reasoning.categoryFit}
                              </dd>
                            </div>
                          )}
                          {m.reasoning.contentStyleFit && (
                            <div>
                              <dt className="inline font-semibold">
                                {t("content_style_fit")}:
                              </dt>{" "}
                              <dd className="inline">
                                {m.reasoning.contentStyleFit}
                              </dd>
                            </div>
                          )}
                          {m.reasoning.budgetFit && (
                            <div>
                              <dt className="inline font-semibold">
                                {t("budget_fit")}:
                              </dt>{" "}
                              <dd className="inline">
                                {m.reasoning.budgetFit}
                              </dd>
                            </div>
                          )}
                          {m.reasoning.engagementQuality && (
                            <div>
                              <dt className="inline font-semibold">
                                {t("engagement_quality")}:
                              </dt>{" "}
                              <dd className="inline">
                                {m.reasoning.engagementQuality}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </details>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {isAccepted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" />
                        {t("accepted_badge")}
                      </span>
                    ) : invited && inv ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                          {t("invited_badge")}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={withdrawingId === inv.id}
                          onClick={() => withdraw(inv.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <X className="mr-1 h-3 w-3" />
                          {withdrawingId === inv.id
                            ? t("withdrawing")
                            : t("withdraw")}
                        </Button>
                      </div>
                    ) : composerOpen === m.creatorId ? (
                      <div className="w-full max-w-xs space-y-2">
                        <Textarea
                          value={messageById[m.creatorId] ?? ""}
                          onChange={(e) =>
                            setMessageById((prev) => ({
                              ...prev,
                              [m.creatorId]: e.target.value,
                            }))
                          }
                          placeholder={t("message_placeholder")}
                          maxLength={1000}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setComposerOpen(null)}
                          >
                            {t("cancel")}
                          </Button>
                          <Button
                            size="sm"
                            disabled={invitingId === m.creatorId}
                            onClick={() => invite(m.creatorId)}
                            className="bg-[#d4772c] text-white hover:bg-[#b85c1a]"
                          >
                            {invitingId === m.creatorId
                              ? t("inviting")
                              : t("send_invite")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setComposerOpen(m.creatorId)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t("invite")}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
