import Link from "next/link"

export const metadata = {
  title: "Privacy Policy | Foxolog",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fdf6e3]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-[#d4772c] hover:underline">&larr; Back to Foxolog</Link>

        <h1 className="mt-6 text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: March 30, 2026</p>

        <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="mt-2">
              Foxolog (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the influencer marketplace at www.foxolog.com. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
            <p className="mt-2 font-medium">Account Information:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>Name, email address, and password</li>
              <li>Role selection (Creator, Brand, Agency, Network)</li>
              <li>Company name and industry (for Brands and Agencies)</li>
            </ul>
            <p className="mt-3 font-medium">Creator Information:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>TikTok username and profile data (follower count, engagement metrics, bio, avatar)</li>
              <li>Content categories and portfolio links</li>
              <li>Content delivery screenshots and TikTok video links</li>
            </ul>
            <p className="mt-3 font-medium">Payment Information:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>Stripe Connect account details for payouts (processed by Stripe, not stored by us)</li>
              <li>Transaction history and payout records</li>
            </ul>
            <p className="mt-3 font-medium">Usage Information:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>Browser type, IP address, and device information</li>
              <li>Pages visited and actions taken on the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Provide, maintain, and improve the Platform</li>
              <li>Process orders, deliveries, and payments</li>
              <li>Verify TikTok account ownership</li>
              <li>Calculate creator scores and tier rankings</li>
              <li>Generate AI-powered creator and delivery analysis</li>
              <li>Send transactional emails (order updates, delivery notifications)</li>
              <li>Provide customer support</li>
              <li>Prevent fraud and enforce our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. TikTok Data</h2>
            <p className="mt-2">
              We access TikTok data through official TikTok APIs solely to:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Verify that creators own the TikTok accounts they register with</li>
              <li>Retrieve public profile metrics (follower count, video count, engagement rate)</li>
              <li>Fetch video performance data for scoring and analysis</li>
            </ul>
            <p className="mt-2">
              We do not sell TikTok data to third parties. TikTok data is used exclusively within the Platform for the purposes described above. Our use of TikTok data complies with TikTok&apos;s Developer Terms of Service and API Usage Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. AI-Powered Analysis</h2>
            <p className="mt-2">
              We use AI services (Anthropic Claude) to analyze creator profiles and content deliveries. This analysis uses publicly available TikTok metrics and content data submitted through orders. AI-generated insights are stored within the Platform and are not shared externally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Information Sharing</h2>
            <p className="mt-2">We share your information only in the following circumstances:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li><span className="font-medium">Between Platform users:</span> Creator profiles are visible to brands and agencies for campaign matching. Order details are shared between participating parties.</li>
              <li><span className="font-medium">Payment processing:</span> Stripe receives necessary payment information to process transactions.</li>
              <li><span className="font-medium">Email delivery:</span> Resend processes transactional emails on our behalf.</li>
              <li><span className="font-medium">Legal requirements:</span> We may disclose information if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Data Security</h2>
            <p className="mt-2">
              We implement appropriate technical and organizational measures to protect your data, including encrypted connections (HTTPS), secure password hashing (bcrypt), and role-based access controls. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Data Retention</h2>
            <p className="mt-2">
              We retain your personal data for as long as your account is active or as needed to provide services. Transaction records are retained for legal and accounting purposes. You may request account deletion by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Cookies</h2>
            <p className="mt-2">
              We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Your Rights</h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at <a href="mailto:support@foxolog.com" className="text-[#d4772c] hover:underline">support@foxolog.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Children&apos;s Privacy</h2>
            <p className="mt-2">
              The Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">12. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Platform after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">13. Contact Us</h2>
            <p className="mt-2">
              For questions about this Privacy Policy, contact us at <a href="mailto:support@foxolog.com" className="text-[#d4772c] hover:underline">support@foxolog.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
