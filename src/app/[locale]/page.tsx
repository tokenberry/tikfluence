"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Brain,
  ShieldCheck,
  Users,
  BadgeCheck,
  Wallet,
  BarChart3,
  ArrowRight,
  Megaphone,
  Video,
  Sparkles,
  Menu,
  X,
} from "lucide-react"
import { FadeIn, StaggerChildren, GlowCard, CountUp, staggerItem } from "@/components/landing/animations"
import { APP_VERSION } from "@/lib/constants"
import { useState } from "react"
import { useTranslations } from "next-intl"

const BRAND_ORANGE = "#d4772c"

const FEATURE_ICONS = [Brain, ShieldCheck, Users, BadgeCheck, Wallet, BarChart3]
const SOCIAL_PROOF_ICONS = [ShieldCheck, Brain, BadgeCheck, Sparkles]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations("landing")

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white landing-grid">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: BRAND_ORANGE }}
              >
                <span className="text-sm font-bold text-white">{t("brand_letter")}</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{t("brand_name")}</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {t("nav_login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: BRAND_ORANGE }}
              >
                {t("nav_get_started")}
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-white/60 hover:text-white"
              aria-label={t("toggle_menu_aria")}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-white/60 hover:text-white"
            >
              {t("nav_login")}
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-white"
              style={{ color: BRAND_ORANGE }}
            >
              {t("nav_get_started")}
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
          style={{
            background: `radial-gradient(ellipse at 50% 20%, rgba(212,119,44,0.15), transparent 70%)`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
              {t("hero_title_line_1")}
              <br />
              <span className="gradient-text">{t("hero_title_line_2")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50 leading-relaxed">
              {t("hero_subtitle")}
            </p>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/register?role=brand"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110 shadow-lg"
              style={{
                background: BRAND_ORANGE,
                boxShadow: `0 0 30px rgba(212,119,44,0.3)`,
              }}
            >
              <Megaphone size={16} />
              {t("cta_brand")}
            </Link>
            <Link
              href="/register?role=creator"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-white/80 transition-all hover:border-white/20 hover:text-white hover:bg-white/5"
            >
              <Video size={16} />
              {t("cta_creator")}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {[
              { to: 500, suffix: "+", label: t("stat_1_label") },
              { to: 50, suffix: "+", label: t("stat_2_label") },
              { to: 100, prefix: "$", suffix: "K+", label: t("stat_3_label") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold sm:text-4xl" style={{ color: BRAND_ORANGE }}>
                  <CountUp to={stat.to} prefix={stat.prefix ?? ""} suffix={stat.suffix} />
                </div>
                <div className="mt-1 text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Social Proof Bar ───────────────────────────────────── */}
      <FadeIn>
        <section className="border-y border-white/5 py-10">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <p className="text-sm text-white/30 uppercase tracking-widest mb-6">
              {t("social_proof_heading")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {SOCIAL_PROOF_ICONS.map((Icon, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-white/25"
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{t(`social_proof_${i + 1}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("how_it_works_title")}</h2>
            <p className="mt-3 text-white/40 max-w-lg mx-auto">
              {t("how_it_works_subtitle")}
            </p>
          </FadeIn>

          <StaggerChildren className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
            {[1, 2, 3].map((num, i) => (
              <motion.div
                key={num}
                variants={staggerItem}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
                <div
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_ORANGE}, #f0a050)`,
                    boxShadow: `0 0 24px rgba(212,119,44,0.25)`,
                  }}
                >
                  {String(num).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold">{t(`step_${num}_title`)}</h3>
                <p className="mt-2 text-sm text-white/40 leading-relaxed">{t(`step_${num}_desc`)}</p>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────── */}
      <section className="py-20 lg:py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              {t("features_title")}
            </h2>
            <p className="mt-3 text-white/40 max-w-lg mx-auto">
              {t("features_subtitle")}
            </p>
          </FadeIn>

          <StaggerChildren className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_ICONS.map((Icon, i) => (
              <GlowCard key={i}>
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: "rgba(212,119,44,0.12)" }}
                >
                  <Icon size={20} style={{ color: BRAND_ORANGE }} />
                </div>
                <h3 className="font-semibold text-[15px]">{t(`feature_${i + 1}_title`)}</h3>
                <p className="mt-2 text-sm text-white/40 leading-relaxed">{t(`feature_${i + 1}_desc`)}</p>
              </GlowCard>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── For Brands / For Creators ──────────────────────────── */}
      <section className="py-20 lg:py-28 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("both_sides_title")}</h2>
          </FadeIn>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Brands */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 lg:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <Megaphone size={24} style={{ color: BRAND_ORANGE }} />
                  <h3 className="text-xl font-bold">{t("for_brands_title")}</h3>
                </div>
                <ul className="space-y-3 text-sm text-white/50 leading-relaxed">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-2">
                      <ArrowRight size={14} className="mt-1 shrink-0" style={{ color: BRAND_ORANGE }} />
                      {t(`for_brands_item_${n}`)}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/register?role=brand"
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
                    style={{ background: BRAND_ORANGE }}
                  >
                    {t("for_brands_cta")} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </FadeIn>

            {/* Creators */}
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 lg:p-10 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <Video size={24} style={{ color: BRAND_ORANGE }} />
                  <h3 className="text-xl font-bold">{t("for_creators_title")}</h3>
                </div>
                <ul className="space-y-3 text-sm text-white/50 leading-relaxed">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-2">
                      <ArrowRight size={14} className="mt-1 shrink-0" style={{ color: BRAND_ORANGE }} />
                      {t(`for_creators_item_${n}`)}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/register?role=creator"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 transition-all hover:border-white/20 hover:text-white hover:bg-white/5"
                  >
                    {t("for_creators_cta")} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(135deg, rgba(212,119,44,0.08), transparent 60%)`,
          }}
        />
        <FadeIn className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            {t("final_cta_title")}
          </h2>
          <p className="mt-4 text-white/40 text-lg">
            {t("final_cta_subtitle")}
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all hover:brightness-110 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${BRAND_ORANGE}, #f0a050)`,
                boxShadow: `0 0 40px rgba(212,119,44,0.3)`,
              }}
            >
              {t("final_cta_button")} <ArrowRight size={16} />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-6 w-6 items-center justify-center rounded"
                style={{ background: BRAND_ORANGE }}
              >
                <span className="text-xs font-bold text-white">{t("brand_letter")}</span>
              </div>
              <span className="text-sm font-semibold">{t("footer_brand_name")}</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/30">
              <Link href="/login" className="hover:text-white/60 transition-colors">
                {t("footer_login")}
              </Link>
              <Link href="/register" className="hover:text-white/60 transition-colors">
                {t("footer_register")}
              </Link>
            </div>

            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} {t("footer_copyright")} &middot; v{APP_VERSION}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
