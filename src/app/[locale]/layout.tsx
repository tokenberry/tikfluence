import { NextIntlClientProvider, hasLocale } from "next-intl"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import Providers from "@/app/providers"
import Navbar from "@/components/layout/Navbar"

const RTL_LOCALES = ["ar"]

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr"

  return (
    <div lang={locale} dir={dir}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
        </Providers>
      </NextIntlClientProvider>
    </div>
  )
}
