"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ticketSchema } from "@/lib/validations"
import { useTranslations } from "next-intl"

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

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#d4772c] focus:outline-none focus:ring-1 focus:ring-[#d4772c]"

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

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700"
          >
            {t("subject_label")}
          </label>
          <input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("subject_placeholder")}
            className={inputClass}
          />
          {fieldErrors.subject && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.subject}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            {t("description_label")}
          </label>
          <textarea
            id="description"
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("description_placeholder")}
            className={inputClass}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={basePath}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("cancel")}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#d4772c] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8632a] disabled:opacity-50"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
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
