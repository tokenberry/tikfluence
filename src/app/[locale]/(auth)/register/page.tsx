"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerSchema } from "@/lib/validations"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Role = "CREATOR" | "NETWORK" | "BRAND" | "AGENCY"

const TESTIMONIALS = [
  {
    quote:
      "I landed my first brand deal within a week of joining Foxolog. The platform made everything incredibly smooth.",
    name: "Zeynep K.",
    role: "Lifestyle Creator · 280K followers",
    initials: "ZK",
    color: "bg-orange-500",
  },
  {
    quote:
      "We found the perfect creators for our campaign in minutes. The filtering and analytics saved us so much time.",
    name: "Sarah M.",
    role: "Marketing Director · Fashion Brand",
    initials: "SM",
    color: "bg-blue-500",
  },
  {
    quote:
      "Managing 12 brands and their creator campaigns from one dashboard changed everything for our agency.",
    name: "Carlos R.",
    role: "Director · CreativeHub Agency",
    initials: "CR",
    color: "bg-purple-500",
  },
]

const STEP_COUNT = 3

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const tLanding = useTranslations("landing")

  const [step, setStep] = useState(0)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [direction, setDirection] = useState(1)

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

  // Rotate testimonials every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const roles: { value: Role; labelKey: string; descKey: string; icon: string }[] = [
    { value: "CREATOR", labelKey: "register_role_creator", descKey: "register_role_creator_desc", icon: "🎬" },
    { value: "BRAND", labelKey: "register_role_brand", descKey: "register_role_brand_desc", icon: "🏷️" },
    { value: "NETWORK", labelKey: "register_role_network", descKey: "register_role_network_desc", icon: "🌐" },
    { value: "AGENCY", labelKey: "register_role_agency", descKey: "register_role_agency_desc", icon: "🏢" },
  ]

  const stepTitles = [
    { title: t("register_step_role_title"), subtitle: t("register_step_role_subtitle") },
    { title: t("register_step_account_title"), subtitle: t("register_step_account_subtitle") },
    {
      title:
        role === "CREATOR"
          ? t("register_step_creator_title")
          : role === "BRAND"
          ? t("register_step_brand_title")
          : role === "NETWORK"
          ? t("register_step_network_title")
          : t("register_step_agency_title"),
      subtitle: t("register_step_details_subtitle"),
    },
  ]

  const goNext = () => {
    setError("")
    if (step === 1) {
      // Basic validation before step 3
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError("Please fill in all fields.")
        return
      }
    }
    setDirection(1)
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1))
  }

  const goBack = () => {
    setError("")
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

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
      const body: Record<string, string | boolean> = { name, email, password, role }

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

  const fieldError = (field: string) =>
    fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p>
    ) : null

  const testimonial = TESTIMONIALS[testimonialIndex]

  return (
    <div className="flex h-screen min-h-screen">
      {/* ── Left panel ── */}
      <div className="flex flex-col w-full lg:w-1/2 px-8 py-10 sm:px-12 lg:px-16 overflow-y-auto">
        {/* Logo */}
        <div className="mb-10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="50" cy="60" rx="30" ry="22" fill="#d4772c" />
              <ellipse cx="50" cy="58" rx="22" ry="16" fill="#b85c1a" />
              <circle cx="38" cy="50" r="7" fill="#fdf6e3" />
              <circle cx="62" cy="50" r="7" fill="#fdf6e3" />
              <circle cx="38" cy="50" r="3" fill="#0a0a0a" />
              <circle cx="62" cy="50" r="3" fill="#0a0a0a" />
              <path d="M 30 30 Q 25 18 38 20 Q 50 10 62 20 Q 75 18 70 30" stroke="#d4772c" strokeWidth="4" fill="#d4772c" strokeLinecap="round" />
            </svg>
            <span className="text-xl font-bold text-[#0a0a0a] tracking-tight">Foxolog</span>
          </Link>
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          {/* Step title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{stepTitles[step].title}</h1>
            <p className="mt-1 text-sm text-gray-500">{stepTitles[step].subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* ── Step 0: Role selection ── */}
              {step === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-all duration-150",
                        role === r.value
                          ? "border-[#d4772c] bg-[#fdf6e3]"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <span className="text-2xl mb-2 block">{r.icon}</span>
                      <span className="block text-sm font-semibold text-gray-900">{t(r.labelKey)}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{t(r.descKey)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Step 1: Account basics ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("register_name_label")}</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("register_name_placeholder")}
                      aria-invalid={!!fieldErrors.name}
                    />
                    {fieldError("name")}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">{t("register_email_label")}</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("register_email_placeholder")}
                      aria-invalid={!!fieldErrors.email}
                    />
                    {fieldError("email")}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">{t("register_password_label")}</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("register_password_placeholder")}
                      aria-invalid={!!fieldErrors.password}
                    />
                    {fieldError("password")}
                  </div>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-400">{t("register_divider")}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  >
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t("register_google")}
                  </Button>

                  <Button
                    type="button"
                    className="w-full bg-black text-white hover:bg-gray-900"
                    onClick={() => signIn("tiktok", { callbackUrl: "/dashboard" })}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none">
                      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" fill="currentColor" />
                    </svg>
                    {t("register_tiktok")}
                  </Button>
                </div>
              )}

              {/* ── Step 2: Role-specific details ── */}
              {step === 2 && (
                <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
                  {role === "CREATOR" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="tiktok">{t("register_tiktok_label")}</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            @
                          </span>
                          <Input
                            id="tiktok"
                            type="text"
                            required
                            value={tiktokUsername}
                            onChange={(e) => setTiktokUsername(e.target.value)}
                            placeholder={t("register_tiktok_placeholder")}
                            aria-invalid={!!fieldErrors.tiktokUsername}
                            className="rounded-l-none"
                          />
                        </div>
                        {fieldError("tiktokUsername")}
                      </div>
                      <div className="space-y-2">
                        <Label>{t("register_content_types_label")}</Label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setSupportsShortVideo(!supportsShortVideo)}
                            className={cn(
                              "flex-1 rounded-md border p-3 text-center text-sm font-medium transition-colors",
                              supportsShortVideo
                                ? "border-[#d4772c] bg-[#fdf6e3] text-[#b85c1a]"
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                            )}
                          >
                            {t("register_content_type_short_video")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupportsLive(!supportsLive)}
                            className={cn(
                              "flex-1 rounded-md border p-3 text-center text-sm font-medium transition-colors",
                              supportsLive
                                ? "border-[#d4772c] bg-[#fdf6e3] text-[#b85c1a]"
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                            )}
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
                    <div className="space-y-1.5">
                      <Label htmlFor="company-network">{t("register_network_company_label")}</Label>
                      <Input
                        id="company-network"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={t("register_network_company_placeholder")}
                        aria-invalid={!!fieldErrors.companyName}
                      />
                      {fieldError("companyName")}
                    </div>
                  )}

                  {role === "BRAND" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="company-brand">{t("register_brand_company_label")}</Label>
                        <Input
                          id="company-brand"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder={t("register_brand_company_placeholder")}
                          aria-invalid={!!fieldErrors.companyName}
                        />
                        {fieldError("companyName")}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="industry">{t("register_brand_industry_label")}</Label>
                        <Input
                          id="industry"
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder={t("register_brand_industry_placeholder")}
                        />
                      </div>
                    </>
                  )}

                  {role === "AGENCY" && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="company-agency">{t("register_agency_name_label")}</Label>
                        <Input
                          id="company-agency"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder={t("register_agency_name_placeholder")}
                          aria-invalid={!!fieldErrors.companyName}
                        />
                        {fieldError("companyName")}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="agency-website">{t("register_agency_website_label")}</Label>
                        <Input
                          id="agency-website"
                          type="text"
                          value={agencyWebsite}
                          onChange={(e) => setAgencyWebsite(e.target.value)}
                          placeholder={t("register_agency_website_placeholder")}
                          aria-invalid={!!fieldErrors.agencyWebsite}
                        />
                        {fieldError("agencyWebsite")}
                      </div>
                    </>
                  )}
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors",
                step === 0 && "invisible"
              )}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t("register_back")}
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: STEP_COUNT }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? "w-5 h-2 bg-[#d4772c]"
                      : i < step
                      ? "w-2 h-2 bg-[#d4772c] opacity-40"
                      : "w-2 h-2 bg-gray-200"
                  )}
                />
              ))}
            </div>

            {step < STEP_COUNT - 1 ? (
              <Button onClick={goNext} size="sm">
                {t("register_continue")}
                <svg className="size-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button
                type="submit"
                form="register-form"
                disabled={loading}
                size="sm"
              >
                {loading ? t("register_submit_loading") : t("register_submit")}
              </Button>
            )}
          </div>

          {/* Footer links */}
          <p className="mt-8 text-center text-sm text-gray-500">
            {t("register_has_account")}{" "}
            <Link href="/login" className="text-[#d4772c] hover:text-[#c86b1e] font-medium">
              {t("register_signin_link")}
            </Link>
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-[#d4772c] transition-colors">
              {tLanding("footer_terms")}
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link href="/privacy" className="hover:text-[#d4772c] transition-colors">
              {tLanding("footer_privacy")}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden bg-[#0a0a0a]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#d4772c] opacity-10 blur-3xl pointer-events-none" />

        {/* Stats */}
        <div className="flex gap-10 mb-14 relative z-10">
          {[
            { value: "500+", label: "Creators" },
            { value: "200+", label: "Brands" },
            { value: "12K+", label: "Campaigns" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial card */}
        <div className="relative z-10 w-full max-w-sm px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
              <p className="text-white text-sm leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                    testimonial.color
                  )}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{testimonial.name}</div>
                  <div className="text-gray-400 text-xs">{testimonial.role}</div>
                </div>
                <div className="ml-auto">
                  <span className="text-[#d4772c] font-bold text-sm tracking-tight">foxolog</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTestimonialIndex(i)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === testimonialIndex
                    ? "w-4 h-1.5 bg-[#d4772c]"
                    : "w-1.5 h-1.5 bg-white/20"
                )}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
