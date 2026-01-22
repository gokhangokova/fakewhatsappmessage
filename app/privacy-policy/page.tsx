'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background overflow-auto h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At memesocial.app, we take your privacy seriously. This Privacy Policy explains how we collect, use,
              and protect your information when you use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Account information (email address, username) when you create an account</li>
              <li>Payment information when you subscribe to Pro Plan (processed by third-party payment providers)</li>
              <li>Communications you send to us (support requests, feedback)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and general location data</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">2.3 Content You Create</h3>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Important:</strong> The chat content you create using our editor is processed entirely
              in your browser. We do not collect, store, or have access to the messages, names, or images you use
              in your mock-up screenshots.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and maintain our service</li>
              <li>Process your subscription payments</li>
              <li>Send important updates about your account or our service</li>
              <li>Respond to your support requests</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement appropriate security measures to protect your personal information. Your account data
              is stored securely on our servers. Payment information is processed by trusted third-party payment
              providers and is not stored on our servers.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              As mentioned above, the content you create (chat messages, names, avatars) is processed locally
              in your browser and is not transmitted to or stored on our servers.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-semibold mb-4">5. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Keeping you signed in to your account</li>
              <li>Remembering your preferences</li>
              <li>Analytics to understand how our service is used</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings. Note that disabling cookies may affect
              some functionality of our service.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold mb-4">6. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may use third-party services that collect information about you:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Payment processors (for subscription payments)</li>
              <li>Analytics providers (to understand usage patterns)</li>
              <li>Authentication providers (for sign-in services)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              These third parties have their own privacy policies governing the use of your information.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold mb-4">7. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the following cases:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating our service (under strict confidentiality)</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@memesocial.app" className="text-primary hover:underline">
                privacy@memesocial.app
              </a>
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and believe your
              child has provided us with personal information, please contact us.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place to protect your information in accordance
              with applicable data protection laws.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes
              by posting a notice on our website or sending you an email. Your continued use of the service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@memesocial.app" className="text-primary hover:underline">
                privacy@memesocial.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/terms-of-service" className="hover:text-foreground">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-foreground">
              Back to App
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
