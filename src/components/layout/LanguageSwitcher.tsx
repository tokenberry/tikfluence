"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { locales, type Locale } from "@/i18n/routing"
import { Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
        aria-label={t("aria_change_language")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALE_FLAGS[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px] bg-[#1a1a1a] border-gray-700 text-gray-300 rounded-xl"
      >
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => switchLocale(l)}
            className={`gap-3 px-4 py-2.5 rounded-md ${
              l === locale
                ? "bg-[#d4772c]/10 text-[#d4772c] focus:bg-[#d4772c]/15 focus:text-[#d4772c]"
                : "text-gray-300 focus:bg-white/5 focus:text-white"
            }`}
          >
            <span>{LOCALE_FLAGS[l]}</span>
            <span>{LOCALE_LABELS[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
