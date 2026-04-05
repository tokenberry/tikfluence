import Link from "next/link"

export const metadata = {
  title: "Terms of Service | Foxolog",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fdf6e3]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-[#d4772c] hover:underline">&larr; Back to Foxolog</Link>

        <h1 className="mt-6 text-4xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: March 30, 2026</p>

        <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using Foxolog (&quot;the Platform&quot;), operated at www.foxolog.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
            <p className="mt-2">
              Foxolog is an influencer marketplace that connects brands with TikTok content creators for sponsored content campaigns. The Platform facilitates order creation, content delivery, performance tracking, and payment processing between parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Account Registration</h2>
            <p className="mt-2">
              To use the Platform, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must be at least 18 years old to register.
            </p>
            <p className="mt-2">
              You may register as a Creator, Brand, Agency, or Network. Each role has specific responsibilities and access levels within the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Creator Obligations</h2>
            <p className="mt-2">
              Creators must provide a valid TikTok account and verify ownership through our verification process. Creators agree to deliver content that meets order specifications, complies with TikTok&apos;s community guidelines, and adheres to applicable advertising disclosure laws (e.g., FTC guidelines).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Brand Obligations</h2>
            <p className="mt-2">
              Brands must provide clear campaign briefs and requirements. Brands agree to review deliveries in a timely manner and to fund orders before they are published. Payment obligations are binding once an order is accepted by a creator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Orders & Payments</h2>
            <p className="mt-2">
              All payments are processed through Stripe. The Platform charges a service fee on each transaction. Payouts to creators are initiated upon delivery approval. Refunds and disputes are handled on a case-by-case basis through our support ticket system.
            </p>
            <p className="mt-2">
              The Platform is not responsible for tax obligations arising from payments. Users are responsible for reporting income and paying applicable taxes in their jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Content & Intellectual Property</h2>
            <p className="mt-2">
              Creators retain ownership of their content unless otherwise agreed in an order brief. By submitting content through the Platform, creators grant brands a license to use the delivered content for the purposes specified in the campaign brief.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. TikTok Data</h2>
            <p className="mt-2">
              The Platform accesses TikTok data through official TikTok APIs to verify creator accounts, retrieve public profile metrics, and analyze content performance. By using the Platform, you consent to this data access. Use of TikTok data is subject to TikTok&apos;s Terms of Service and Developer Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Prohibited Conduct</h2>
            <p className="mt-2">
              Users may not: impersonate others or claim TikTok accounts they do not own; engage in fraudulent activity including fake metrics or engagement; use the Platform for illegal purposes; attempt to circumvent Platform fees; or harass other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account at any time for violation of these terms. You may delete your account by contacting support. Termination does not release you from payment obligations for completed or in-progress orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Limitation of Liability</h2>
            <p className="mt-2">
              The Platform is provided &quot;as is&quot; without warranties of any kind. Foxolog is not liable for indirect, incidental, or consequential damages arising from use of the Platform. Our total liability is limited to the fees paid to us in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">12. Changes to Terms</h2>
            <p className="mt-2">
              We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated terms. Material changes will be communicated via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">13. Contact</h2>
            <p className="mt-2">
              For questions about these terms, contact us at <a href="mailto:support@foxolog.com" className="text-[#d4772c] hover:underline">support@foxolog.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
