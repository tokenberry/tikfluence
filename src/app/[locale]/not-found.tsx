import Link from "next/link"
import { getTranslations } from "next-intl/server"

export default async function NotFound() {
  const t = await getTranslations("errors")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf6e3] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">{t("not_found_title")}</h1>
        <p className="mt-4 text-xl text-gray-600">{t("not_found_heading")}</p>
        <p className="mt-2 text-gray-500">{t("not_found_description")}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-[#d4772c] px-6 py-3 text-sm font-medium text-white hover:bg-[#b85c1a] transition-colors"
        >
          {t("go_home")}
        </Link>
      </div>
    </div>
  )
}
