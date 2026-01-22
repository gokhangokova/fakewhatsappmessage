'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
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

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to memesocial.app. By accessing or using our service, you agree to be bound by these Terms of Service.
              If you do not agree with any part of these terms, you may not use our service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              memesocial.app is a tool that allows users to create mock-up chat screenshots for WhatsApp.
              The service is intended for entertainment, educational, and creative purposes only.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold mb-4">3. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to use memesocial.app only for lawful purposes. You must not use our service to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Create content intended to deceive, defraud, or mislead others</li>
              <li>Impersonate real individuals with malicious intent</li>
              <li>Create fake evidence for legal proceedings</li>
              <li>Harass, bully, or defame any person</li>
              <li>Spread misinformation or fake news</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the intellectual property rights of others</li>
            </ul>
          </section>

          {/* User Responsibility */}
          <section>
            <h2 className="text-xl font-semibold mb-4">4. User Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for the content you create using our service. memesocial.app does not monitor,
              review, or store the content you generate. You acknowledge that any misuse of generated content is your
              responsibility and may have legal consequences.
            </p>
          </section>

          {/* Subscription and Payments */}
          <section>
            <h2 className="text-xl font-semibold mb-4">5. Subscription and Payments</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Some features of memesocial.app require a paid subscription (Pro Plan). By subscribing:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>You agree to pay all applicable fees for your chosen plan</li>
              <li>Subscriptions are billed on a recurring basis until cancelled</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Refunds are handled according to our refund policy</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The memesocial.app service, including its design, features, and code, is owned by us and protected by
              intellectual property laws. WhatsApp and other platform designs are trademarks of their respective owners.
              We do not claim any affiliation with WhatsApp or Meta Platforms, Inc.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold mb-4">7. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              memesocial.app is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service
              will be uninterrupted, secure, or error-free. We are not responsible for any damages arising from the use
              or inability to use our service.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, memesocial.app shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting
              to this page. Your continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your access to our service immediately, without prior notice, for any breach
              of these Terms of Service.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@memesocial.app" className="text-primary hover:underline">
                support@memesocial.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy Policy
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
