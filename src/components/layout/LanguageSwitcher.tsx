"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { locales, type Locale } from "@/i18n/routing"
import { useState, useRef, useEffect } from "react"
import { Globe } from "lucide-react"

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  tr: "Türkçe",
  fr: "Français",
  es: "Español",
}

const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  ar: "🇸🇦",
  tr: "🇹🇷",
  fr: "🇫🇷",
  es: "🇪🇸",
}

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const t = useTranslations("common")
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function switchLocale(newLocale: Locale) {
    setOpen(false)
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={t("aria_change_language")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALE_FLAGS[locale]}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 end-0 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-[160px]">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                l === locale
                  ? "bg-[#d4772c]/10 text-[#d4772c]"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
