import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Connect Brands with
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
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
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
            >
              I&apos;m a Brand
            </Link>
            <Link
              href="/register?role=creator"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold shadow-sm hover:bg-accent transition"
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
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold">Creators Sign Up</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Link your TikTok profile, get automatically scored based on your
                engagement and reach, and set your availability.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold">Brands Post Orders</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Define your campaign: target category, impression goals, and budget.
                Funds are held securely in escrow.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold">Deliver & Get Paid</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Creators accept orders, post content, submit proof of delivery.
                Once approved, payment is released instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">Why Foxolog?</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "AI-Powered Scoring",
                description:
                  "Creators are automatically scored based on engagement, followers, and content quality.",
              },
              {
                title: "Secure Escrow",
                description:
                  "Payments are held securely via Stripe until delivery is confirmed and approved.",
              },
              {
                title: "Creator Networks",
                description:
                  "Agencies can manage their roster of creators and accept orders on their behalf.",
              },
              {
                title: "Transparent Pricing",
                description:
                  "CPM-based pricing tiers so brands know exactly what they're paying per impression.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border p-5">
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
              className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">F</span>
              </div>
              <span className="text-sm font-semibold">Foxolog</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Foxolog. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
