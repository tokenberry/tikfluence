"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ticketSchema } from "@/lib/validations"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function NewTicketFormInner({ basePath }: { basePath: string }) {
  const t = useTranslations("tickets")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderTitle = searchParams.get("orderTitle")
  const orderId = searchParams.get("orderId")

  const [subject, setSubject] = useState(
    orderTitle ? t("order_subject_prefix", { title: orderTitle }) : ""
  )
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const result = ticketSchema.safeParse({ subject, description })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "form"
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, orderId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? t("error_create_failed"))
      }

      router.push(basePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon("error_generic"))
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href={basePath}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; {t("back_to_tickets")}
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {t("new_ticket_title")}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="subject">{t("subject_label")}</Label>
          <Input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("subject_placeholder")}
            aria-invalid={!!fieldErrors.subject}
          />
          {fieldErrors.subject && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("description_label")}</Label>
          <Textarea
            id="description"
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("description_placeholder")}
            aria-invalid={!!fieldErrors.description}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button asChild variant="outline">
            <Link href={basePath}>{t("cancel")}</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewTicketForm({ basePath }: { basePath: string }) {
  return (
    <Suspense>
      <NewTicketFormInner basePath={basePath} />
    </Suspense>
  )
}
