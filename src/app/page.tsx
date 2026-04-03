import Link from "next/link"
import { APP_VERSION } from "@/lib/constants"
import {
  UserPlus,
  FileText,
  Banknote,
  Sparkles,
  Shield,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Creators Sign Up",
    description:
      "Link your TikTok profile, get automatically scored based on your engagement and reach, and set your availability.",
  },
  {
    icon: FileText,
    title: "Brands Post Orders",
    description:
      "Define your campaign: target category, impression goals, and budget. Funds are held securely in escrow.",
  },
  {
    icon: Banknote,
    title: "Deliver & Get Paid",
    description:
      "Creators accept orders, post content, submit proof of delivery. Once approved, payment is released instantly.",
  },
]

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Scoring",
    description:
      "Creators are automatically scored based on engagement, followers, and content quality via Claude AI.",
  },
  {
    icon: Shield,
    title: "Secure Escrow",
    description:
      "Payments are held securely via Stripe until delivery is confirmed and approved by the brand.",
  },
  {
    icon: Users,
    title: "Creator Networks",
    description:
      "Agencies can manage their roster of creators and accept orders on their behalf.",
  },
  {
    icon: BarChart3,
    title: "Transparent Pricing",
    description:
      "CPM-based pricing tiers so brands know exactly what they're paying per impression.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Connect Brands with
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              TikTok Creators
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            The automated influencer marketplace for TikTok. Brands post campaigns,
            creators deliver content, and our platform handles payments with built-in escrow.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register?role=brand"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#d4772c] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#c86b1e] transition"
            >
              I&apos;m a Brand
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register?role=creator"
              className="rounded-lg border border-[#d4772c] px-6 py-3 text-sm font-semibold text-[#d4772c] shadow-sm hover:bg-accent transition"
            >
              I&apos;m a Creator
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t py-20 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Three simple steps to start your campaign or earn from your content.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="group rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-[#d4772c] transition-colors group-hover:bg-[#d4772c] group-hover:text-white">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#d4772c]">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">Why Foxolog?</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Built for the TikTok ecosystem with tools that matter.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border p-5 transition-all hover:border-[#d4772c]/40 hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[#d4772c] transition-colors group-hover:bg-[#d4772c] group-hover:text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-muted-foreground">
            Join the marketplace connecting TikTok&apos;s top creators with leading brands.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d4772c] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#c86b1e] transition"
            >
              Create Your Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src="/fox-logo.png" alt="Foxolog" className="h-6 w-6 rounded-full" />
                <span className="text-sm font-semibold">Foxolog</span>
              </div>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition">
                Privacy Policy
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Foxolog. All rights reserved.
              <span className="ml-2 text-xs opacity-50">v{APP_VERSION}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
