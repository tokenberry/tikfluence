"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  TrendingUp,
  Users,
  Zap,
  Globe,
  Brain,
  ShieldCheck,
  Wallet,
  Video,
  BarChart3,
  Target,
  Handshake,
  Eye,
  BadgeCheck,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const BRAND_ORANGE = "#d4772c"
const DECK_PASSWORD = "foxolog2026"

/* ------------------------------------------------------------------ */
/*  Password Gate                                                      */
/* ------------------------------------------------------------------ */
function PasswordGate({ onUnlock, t }: { onUnlock: () => void; t: (key: string) => string }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === DECK_PASSWORD) {
      sessionStorage.setItem("deck_unlocked", "true")
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1, x: shake ? [0, -10, 10, -10, 10, 0] : 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full"
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `${BRAND_ORANGE}20` }}
          >
            <Lock className="w-8 h-8" style={{ color: BRAND_ORANGE }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("password_title")}</h1>
          <p className="text-gray-400 text-sm">{t("password_subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(false)
            }}
            placeholder={t("password_placeholder")}
            autoFocus
            className={`w-full px-4 py-3 bg-[#141414] border rounded-xl text-white placeholder-gray-500 outline-none transition-colors ${
              error ? "border-red-500" : "border-gray-700 focus:border-[#d4772c]"
            }`}
          />
          {error && <p className="text-red-400 text-sm">{t("incorrect_password")}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
            style={{ background: BRAND_ORANGE }}
          >
            {t("view_presentation")}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Slide Components                                                   */
/* ------------------------------------------------------------------ */

function SlideWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-16 py-12 relative">
      {children}
    </div>
  )
}

function SlideCover({ t }: { t: (key: string) => string }) {
  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-3xl"
      >
        {/* Fox icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
          style={{
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #e8943d)`,
            boxShadow: `0 0 60px ${BRAND_ORANGE}40`,
          }}
        >
          <span className="text-4xl font-black text-white">F</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
          Fox<span style={{ color: BRAND_ORANGE }}>olog</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
          {t("cover_subtitle")}
        </p>

        <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
          <span>{t("cover_type")}</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span>{t("cover_year")}</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span>{t("cover_confidential")}</span>
        </div>
      </motion.div>

      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px] opacity-10 pointer-events-none"
        style={{ background: BRAND_ORANGE }}
      />
    </SlideWrapper>
  )
}

function SlideProblem({ t }: { t: (key: string) => string }) {
  const problems = [
    {
      icon: Video,
      title: t("problem_1_title"),
      desc: t("problem_1_desc"),
    },
    {
      icon: Target,
      title: t("problem_2_title"),
      desc: t("problem_2_desc"),
    },
    {
      icon: Handshake,
      title: t("problem_3_title"),
      desc: t("problem_3_desc"),
    },
  ]

  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("problem_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
          {t("problem_heading")}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="bg-[#141414] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${BRAND_ORANGE}15` }}
              >
                <p.icon className="w-6 h-6" style={{ color: BRAND_ORANGE }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideInsiderInsight({ t }: { t: (key: string) => string }) {
  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("insight_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-10">
          {t("insight_heading")}
        </h2>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#141414] border border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${BRAND_ORANGE}15` }}
              >
                <Eye className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{t("insight_1_title")}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t("insight_1_desc")}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#141414] border border-gray-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${BRAND_ORANGE}15` }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{t("insight_2_title")}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t("insight_2_desc")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideSolution({ t }: { t: (key: string) => string }) {
  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full text-center"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("solution_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          {t("solution_heading")}
        </h2>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          {t("solution_subtitle")}
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#141414] border border-gray-800 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: BRAND_ORANGE, color: "white" }}
              >
                B
              </span>
              {t("solution_for_brands")}
            </h3>
            <ul className="space-y-3">
              {[
                "Browse AI-scored creators by niche, tier & content type",
                "Create orders (Short Video, LIVE Stream, or Combo)",
                "Secure escrow payments — pay only for approved work",
                "AI-powered delivery analysis with performance scoring",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BRAND_ORANGE }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-[#141414] border border-gray-800 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: BRAND_ORANGE, color: "white" }}
              >
                C
              </span>
              {t("solution_for_creators")}
            </h3>
            <ul className="space-y-3">
              {[
                "Monetize your content beyond platform gifts",
                "Get discovered by brands — no cold outreach needed",
                "TikTok-verified profiles build trust automatically",
                "Global payouts via Payoneer — fast and reliable",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-300 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BRAND_ORANGE }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideMarket({ t }: { t: (key: string) => string }) {
  const stats = [
    { value: "$31B", label: "Global influencer marketing spend (2025)", sub: "Projected $40.5B in 2026" },
    { value: "60M+", label: "Active TikTok creators worldwide", sub: "1.94B adult users globally" },
    { value: "52%", label: "Of brands use TikTok for influencer campaigns", sub: "Neck-and-neck with Instagram (57%)" },
    { value: "43%", label: "Of marketers spend under $10K/year", sub: "Massive underserved SMB segment" },
  ]

  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("market_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
          {t("market_heading")}
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className="bg-[#141414] border border-gray-800 rounded-2xl p-6"
            >
              <p className="text-3xl md:text-4xl font-black mb-2" style={{ color: BRAND_ORANGE }}>
                {s.value}
              </p>
              <p className="text-white font-medium text-sm mb-1">{s.label}</p>
              <p className="text-gray-500 text-xs">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-[#141414] border border-gray-800 rounded-2xl p-6 text-center"
        >
          <p className="text-gray-400 text-sm">
            Brand deals account for <span className="text-white font-semibold">~70% of creator income</span> — yet most
            small creators have no access to them. The ROI is proven:{" "}
            <span className="text-white font-semibold">$5.78 earned per $1 spent</span> on influencer marketing.
          </p>
        </motion.div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideWhyNow({ t }: { t: (key: string) => string }) {
  const reasons = [
    {
      icon: Brain,
      title: "AI Makes It Possible",
      desc: "AI-powered creator scoring, content analysis, and delivery review — automation that wasn't feasible even 2 years ago.",
    },
    {
      icon: Globe,
      title: "TikTok Is Going Global",
      desc: "TikTok Shop hit $15.8B in US sales in 2025 (+108% YoY). The platform is becoming the #1 commerce channel — and creators need brand tools.",
    },
    {
      icon: Zap,
      title: "SMBs Are Ready to Spend",
      desc: "86% of US marketers partnered with influencers in 2025 and 59% plan to increase spend. The demand is there — the tools aren't.",
    },
  ]

  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("why_now_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
          {t("why_now_heading")}
        </h2>

        <div className="space-y-5">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="bg-[#141414] border border-gray-800 rounded-2xl p-6 flex items-start gap-5"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${BRAND_ORANGE}15` }}
              >
                <r.icon className="w-6 h-6" style={{ color: BRAND_ORANGE }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{r.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideFeatures({ t }: { t: (key: string) => string }) {
  const features = [
    { icon: Brain, title: "AI Creator Scoring", desc: "GPT-4o analyzes engagement, reach, and content quality" },
    { icon: ShieldCheck, title: "Stripe Escrow", desc: "Funds held securely until delivery is approved" },
    { icon: BadgeCheck, title: "TikTok OAuth", desc: "Verified creator identities via official TikTok login" },
    { icon: Wallet, title: "Payoneer Payouts", desc: "Global creator payments — MENA, Turkey, worldwide" },
    { icon: Video, title: "3 Order Types", desc: "Short Video, LIVE Stream, or Combo campaigns" },
    { icon: BarChart3, title: "Delivery Analytics", desc: "AI analyzes every delivery with performance scoring" },
    { icon: Users, title: "Multi-Role Platform", desc: "Brands, Creators, Networks, Agencies — all connected" },
    { icon: Globe, title: "Built for Scale", desc: "Next.js 15, PostgreSQL, Vercel — global from day one" },
  ]

  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("features_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
          {t("features_heading")}
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="bg-[#141414] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              <f.icon className="w-6 h-6 mb-3" style={{ color: BRAND_ORANGE }} />
              <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideHowItWorks({ t }: { t: (key: string) => string }) {
  const steps = [
    { num: "01", title: "Brand Creates Order", desc: "Choose campaign type, set budget, define requirements and deadline" },
    { num: "02", title: "Creators Apply", desc: "AI-scored creators browse orders and accept matching campaigns" },
    { num: "03", title: "Content Delivered", desc: "Creators submit TikTok links and metrics. AI analyzes performance" },
    { num: "04", title: "Everyone Gets Paid", desc: "Brand approves, escrow releases, creator receives payout instantly" },
  ]

  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("how_it_works_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">
          {t("how_it_works_heading")}
        </h2>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gray-800" />

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
                className="text-center relative"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-sm relative z-10"
                  style={{ background: BRAND_ORANGE, boxShadow: `0 0 20px ${BRAND_ORANGE}40` }}
                >
                  {s.num}
                </div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideGlobalVision({ t }: { t: (key: string) => string }) {
  const regions = [
    { name: "Middle East & Turkey", desc: "TikTok LIVE is exploding. Payoneer enables payouts where Stripe can't." },
    { name: "Southeast Asia", desc: "TikTok Shop already dominant. Creators need brand deal infrastructure." },
    { name: "Latin America", desc: "Fastest-growing TikTok user base. Untapped creator economy." },
    { name: "Europe & North America", desc: "Mature markets ready for self-serve influencer tools." },
  ]

  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl w-full"
      >
        <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: BRAND_ORANGE }}>
          {t("global_section")}
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          {t("global_heading")}
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl">
          {t("global_subtitle")}
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {regions.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-[#141414] border border-gray-800 rounded-xl p-5 flex items-start gap-4"
            >
              <Globe className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BRAND_ORANGE }} />
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">{r.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  )
}

function SlideCTA({ t }: { t: (key: string) => string }) {
  return (
    <SlideWrapper>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-2xl"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
          style={{
            background: `linear-gradient(135deg, ${BRAND_ORANGE}, #e8943d)`,
            boxShadow: `0 0 80px ${BRAND_ORANGE}50`,
          }}
        >
          <span className="text-4xl font-black text-white">F</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
          {t("cta_heading")}
        </h2>

        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          {t("cta_subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://www.foxolog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:brightness-110 flex items-center gap-2"
            style={{ background: BRAND_ORANGE }}
          >
            {t("cta_visit")} <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="mailto:hello@foxolog.com"
            className="px-8 py-3.5 rounded-xl font-semibold text-white border border-gray-700 hover:border-gray-500 transition-colors"
          >
            {t("cta_contact")}
          </a>
        </div>

        <p className="mt-12 text-gray-600 text-xs">
          {t("cta_footer")}
        </p>
      </motion.div>

      {/* Decorative glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[200px] opacity-15 pointer-events-none"
        style={{ background: BRAND_ORANGE }}
      />
    </SlideWrapper>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Deck Component                                                */
/* ------------------------------------------------------------------ */
const SLIDES = [
  SlideCover,
  SlideProblem,
  SlideInsiderInsight,
  SlideSolution,
  SlideHowItWorks,
  SlideMarket,
  SlideWhyNow,
  SlideFeatures,
  SlideGlobalVision,
  SlideCTA,
]

const SLIDE_LABELS = [
  "Cover",
  "Problem",
  "Insight",
  "Solution",
  "How It Works",
  "Market",
  "Why Now",
  "Features",
  "Global",
  "Contact",
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export default function DeckPage() {
  const t = useTranslations("deck")
  const [unlocked, setUnlocked] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem("deck_unlocked") === "true") {
      setUnlocked(true)
    }
  }, [])

  const goNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1)
      setCurrentSlide((s) => s + 1)
    }
  }, [currentSlide])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide((s) => s - 1)
    }
  }, [currentSlide])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        goNext()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [goNext, goPrev])

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} t={t} />
  }

  const SlideComponent = SLIDES[currentSlide]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative select-none">
      {/* Slide content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <SlideComponent t={t} />
        </motion.div>
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-gray-800/50 z-50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Prev button */}
          <button
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentSlide ? 1 : -1)
                  setCurrentSlide(i)
                }}
                title={SLIDE_LABELS[i]}
                className={`transition-all rounded-full ${
                  i === currentSlide
                    ? "w-6 h-2"
                    : "w-2 h-2 hover:opacity-80"
                }`}
                style={{
                  background: i === currentSlide ? BRAND_ORANGE : "#374151",
                }}
              />
            ))}
          </div>

          {/* Slide counter + Next */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">
              {currentSlide + 1} / {SLIDES.length}
            </span>
            <button
              onClick={goNext}
              disabled={currentSlide === SLIDES.length - 1}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hint (first slide only) */}
      {currentSlide === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 text-gray-600 text-xs"
        >
          {t("keyboard_hint")}
        </motion.p>
      )}
    </div>
  )
}
