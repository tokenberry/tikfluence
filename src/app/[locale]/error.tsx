"use client"

import { useTranslations } from "next-intl"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("errors")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf6e3] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">{t("server_error_title")}</h1>
        <p className="mt-4 text-xl text-gray-600">{t("server_error_heading")}</p>
        <p className="mt-2 text-gray-500">{t("server_error_description")}</p>
        <button
          onClick={reset}
          className="mt-8 inline-block rounded-lg bg-[#d4772c] px-6 py-3 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors"
        >
          {t("try_again")}
        </button>
      </div>
    </div>
  )
}
