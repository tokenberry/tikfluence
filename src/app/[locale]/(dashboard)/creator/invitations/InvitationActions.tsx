"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"

export default function InvitationActions({
  invitationId,
}: {
  invitationId: string
}) {
  const t = useTranslations("invitations")
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "decline" | null
  >(null)
  const [isPending, startTransition] = useTransition()

  async function respond(action: "accept" | "decline") {
    setLoadingAction(action)
    try {
      const res = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(
          err?.error ??
            (action === "accept" ? t("accept_failed") : t("decline_failed"))
        )
        return
      }
      toast.success(
        action === "accept" ? t("accepted_toast") : t("declined_toast")
      )
      startTransition(() => router.refresh())
    } catch {
      toast.error(
        action === "accept" ? t("accept_failed") : t("decline_failed")
      )
    } finally {
      setLoadingAction(null)
    }
  }

  const disabled = loadingAction !== null || isPending

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => respond("decline")}
      >
        <X className="mr-1 h-4 w-4" />
        {loadingAction === "decline" ? t("declining") : t("decline")}
      </Button>
      <Button
        size="sm"
        disabled={disabled}
        onClick={() => respond("accept")}
        className="bg-[#d4772c] text-white hover:bg-[#b85c1a]"
      >
        <Check className="mr-1 h-4 w-4" />
        {loadingAction === "accept" ? t("accepting") : t("accept")}
      </Button>
    </div>
  )
}
