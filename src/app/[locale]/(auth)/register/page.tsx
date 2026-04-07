"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerSchema } from "@/lib/validations"
import { useTranslations } from "next-intl"

type Role = "CREATOR" | "NETWORK" | "BRAND" | "AGENCY"

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const tLanding = useTranslations("landing")
  const [role, setRole] = useState<Role>("CREATOR")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tiktokUsername, setTiktokUsername] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [industry, setIndustry] = useState("")
  const [agencyWebsite, setAgencyWebsite] = useState("")
  const [supportsShortVideo, setSupportsShortVideo] = useState(true)
  const [supportsLive, setSupportsLive] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const result = registerSchema.safeParse({
      role,
      name,
      email,
      password,
      tiktokUsername,
      supportsShortVideo,
      supportsLive,
      companyName,
      industry,
      agencyWebsite,
    })

    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "form"
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const body: Record<string, string | boolean> = {
        name,
        email,
        password,
        role,
      }

      if (role === "CREATOR") {
        body.tiktokUsername = tiktokUsername
        body.supportsShortVideo = supportsShortVideo
        body.supportsLive = supportsLive
      } else if (role === "NETWORK") {
        body.companyName = companyName
      } else if (role === "BRAND") {
        body.brandCompanyName = companyName
        if (industry) body.industry = industry
      } else if (role === "AGENCY") {
        body.agencyCompanyName = companyName
        if (agencyWebsite) body.agencyWebsite = agencyWebsite
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError(t("register_error_generic"))
    } finally {
      setLoading(false)
    }
  }

  const roles: { value: Role; labelKey: string; descKey: string }[] = [
    { value: "CREATOR", labelKey: "register_role_creator", descKey: "register_role_creator_desc" },
    { value: "NETWORK", labelKey: "register_role_network", descKey: "register_role_network_desc" },
    { value: "BRAND", labelKey: "register_role_brand", descKey: "register_role_brand_desc" },
    { value: "AGENCY", labelKey: "register_role_agency", descKey: "register_role_agency_desc" },
  ]

  const fieldError = (field: string) =>
    fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p>
    ) : null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("register_title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("register_subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("register_role_label")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`p-3 rounded-md border text-center transition-colors ${
                  role === r.value
                    ? "border-[#d4772c] bg-[#fdf6e3] text-[#b85c1a]"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="block text-sm font-medium">{t(r.labelKey)}</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {t(r.descKey)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Common fields */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("register_name_label")}
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
            placeholder={t("register_name_placeholder")}
          />
          {fieldError("name")}
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("register_email_label")}
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
            placeholder={t("register_email_placeholder")}
          />
          {fieldError("email")}
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("register_password_label")}
          </label>
          <input
            id="reg-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
            placeholder={t("register_password_placeholder")}
          />
          {fieldError("password")}
        </div>

        {/* Role-specific fields */}
        {role === "CREATOR" && (
          <>
            <div>
              <label
                htmlFor="tiktok"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("register_tiktok_label")}
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  @
                </span>
                <input
                  id="tiktok"
                  type="text"
                  required
                  value={tiktokUsername}
                  onChange={(e) => setTiktokUsername(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                  placeholder={t("register_tiktok_placeholder")}
                />
              </div>
              {fieldError("tiktokUsername")}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("register_content_types_label")}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSupportsShortVideo(!supportsShortVideo)}
                  className={`flex-1 rounded-md border p-3 text-center text-sm font-medium transition-colors ${
                    supportsShortVideo
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {t("register_content_type_short_video")}
                </button>
                <button
                  type="button"
                  onClick={() => setSupportsLive(!supportsLive)}
                  className={`flex-1 rounded-md border p-3 text-center text-sm font-medium transition-colors ${
                    supportsLive
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {t("register_content_type_live")}
                </button>
              </div>
              {fieldErrors.supportsShortVideo ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.supportsShortVideo}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">{t("register_content_type_hint")}</p>
              )}
            </div>
          </>
        )}

        {role === "NETWORK" && (
          <div>
            <label
              htmlFor="company-network"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("register_network_company_label")}
            </label>
            <input
              id="company-network"
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
              placeholder={t("register_network_company_placeholder")}
            />
            {fieldError("companyName")}
          </div>
        )}

        {role === "BRAND" && (
          <>
            <div>
              <label
                htmlFor="company-brand"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("register_brand_company_label")}
              </label>
              <input
                id="company-brand"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder={t("register_brand_company_placeholder")}
              />
              {fieldError("companyName")}
            </div>
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("register_brand_industry_label")}
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder={t("register_brand_industry_placeholder")}
              />
            </div>
          </>
        )}

        {role === "AGENCY" && (
          <>
            <div>
              <label
                htmlFor="company-agency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("register_agency_name_label")}
              </label>
              <input
                id="company-agency"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder={t("register_agency_name_placeholder")}
              />
              {fieldError("companyName")}
            </div>
            <div>
              <label
                htmlFor="agency-website"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("register_agency_website_label")}
              </label>
              <input
                id="agency-website"
                type="text"
                value={agencyWebsite}
                onChange={(e) => setAgencyWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:border-[#d4772c]"
                placeholder={t("register_agency_website_placeholder")}
              />
              {fieldError("agencyWebsite")}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#d4772c] text-white text-sm font-medium rounded-md hover:bg-[#b85c1a] focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t("register_submit_loading") : t("register_submit")}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">{t("register_divider")}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:ring-offset-2 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {t("register_google")}
      </button>

      <button
        type="button"
        onClick={() => signIn("tiktok", { callbackUrl: "/dashboard" })}
        className="mt-3 w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#d4772c] focus:ring-offset-2 transition-colors"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" fill="currentColor"/>
        </svg>
        {t("register_tiktok")}
      </button>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t("register_has_account")}{" "}
        <Link
          href="/login"
          className="text-[#d4772c] hover:text-[#c86b1e] font-medium"
        >
          {t("register_signin_link")}
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <Link href="/terms" className="hover:text-[#d4772c] transition-colors">
          {tLanding("footer_terms")}
        </Link>
        <span aria-hidden="true">&middot;</span>
        <Link href="/privacy" className="hover:text-[#d4772c] transition-colors">
          {tLanding("footer_privacy")}
        </Link>
      </div>
    </div>
  )
}
