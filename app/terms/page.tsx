'use client';

import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Legal
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terms of{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Service
            </span>
          </h1>
          <p className="text-zinc-400">Last Updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {/* Agreement to Terms */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  These Terms of Service ("Terms") constitute a legally binding agreement between you and AdWyse ("we," "us," "our") concerning your access to and use of our ad attribution service for Shopify stores (collectively, the "Services").
                </p>
                <p>
                  By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.
                </p>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the platform. Your continued use of the Services after such changes constitutes acceptance of the modified Terms.
                </p>
              </div>
            </div>

            {/* Eligibility */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
              <p className="text-zinc-400 mb-4">To use our Services, you must:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-4">
                <li>Be at least 18 years old</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using the Services under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Own or operate a Shopify store</li>
              </ul>
              <p className="text-zinc-400">
                By creating an account, you represent and warrant that you meet all eligibility requirements.
              </p>
            </div>

            {/* Account Registration */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">3. Account Registration and Security</h2>
              <p className="text-zinc-400 mb-4">
                To access our Services, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password confidential and secure</li>
                <li>Notify us immediately of any unauthorized access or security breach</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
              <p className="text-zinc-400">
                We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or abusive behavior.
              </p>
            </div>

            {/* Subscription and Billing */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">4. Subscription and Billing</h2>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Subscription Plans</h3>
              <p className="text-zinc-400 mb-4">AdWyse offers a Pro Plan subscription:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-6">
                <li><span className="text-white">Pro Plan ($99/month):</span> AI-powered ad attribution tracking, unlimited order tracking, Facebook/Google Ads integration, ROAS calculations, AI insights dashboard, and campaign analytics</li>
                <li><span className="text-white">7-Day Free Trial:</span> All new accounts receive a 7-day free trial with full access to Pro features</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Billing and Payment</h3>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-6">
                <li>Subscriptions are billed monthly in advance</li>
                <li>Payment is processed securely through Shopify</li>
                <li>You authorize us to charge your payment method on each billing cycle</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change pricing with 30 days' notice</li>
                <li>Failed payments may result in service suspension</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Cancellation and Refunds</h3>
              <p className="text-zinc-400">
                You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period. You will retain access to paid features until that time. We do not provide prorated refunds for partial months.
              </p>
            </div>

            {/* Use of Services */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">5. Use of Services and Acceptable Use Policy</h2>
              <p className="text-zinc-400 mb-4">You agree to use our Services only for lawful purposes. You may NOT:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Upload malicious code, viruses, or harmful software</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Scrape, data mine, or reverse engineer the platform</li>
                <li>Use the Services to harass, abuse, or harm others</li>
                <li>Impersonate any person or entity</li>
                <li>Share your account credentials with others</li>
                <li>Resell or redistribute our Services without authorization</li>
                <li>Use the Services to track ad campaigns you don't own or have authorization to track</li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">6. Intellectual Property Rights</h2>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Our Content</h3>
              <p className="text-zinc-400 mb-4">
                The Services, including all software, text, graphics, logos, and other content, are owned by AdWyse or our licensors and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-zinc-400 mb-6">
                We grant you a limited, non-exclusive, non-transferable license to access and use the Services for your business purposes. You may not copy, modify, distribute, or create derivative works without our written permission.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Your Content</h3>
              <p className="text-zinc-400 mb-4">
                You retain ownership of any order data, campaign information, or other content accessed through the Services ("Your Content"). By using our Services, you grant us a worldwide, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-4">
                <li>Process and analyze Your Content to provide the Services</li>
                <li>Store Your Content on our secure servers</li>
                <li>Use anonymized, aggregated data to improve our Services</li>
              </ul>
              <p className="text-zinc-400">
                We will NOT share Your Content with third parties except as necessary to provide the Services or as required by law.
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">7. Third-Party Services and Data</h2>
              <p className="text-zinc-400 mb-4">
                Our Services integrate with third-party platforms (Shopify, Facebook Ads, Google Ads, Anthropic Claude AI). We are not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-4">
                <li>The accuracy, completeness, or reliability of third-party data</li>
                <li>Availability or downtime of third-party services</li>
                <li>Third-party pricing changes or service discontinuation</li>
                <li>Third-party terms of service or privacy policies</li>
                <li>Changes to Facebook/Google Ads APIs that affect functionality</li>
              </ul>
              <p className="text-zinc-400">
                Your use of third-party services is subject to their respective terms and conditions.
              </p>
            </div>

            {/* Disclaimers and Limitations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">8. Disclaimers and Limitations of Liability</h2>

              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">IMPORTANT</h3>
                    <p className="text-zinc-400 text-sm">
                      AdWyse provides ad attribution tracking and ROAS calculations. We do NOT guarantee specific ROAS results, ad performance, or revenue outcomes. Campaign performance depends on many factors outside our control including ad creative, targeting, product market fit, pricing, and external market conditions.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Service Limitations</h3>
              <p className="text-zinc-400 mb-4">When using our Services, you should:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-6">
                <li>Verify attribution data accuracy against your ad platforms</li>
                <li>Understand that AI-generated insights are recommendations, not guarantees</li>
                <li>Make ad spending decisions based on your own judgment and analysis</li>
                <li>Comply with all advertising platform policies and regulations</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Service "As Is"</h3>
              <p className="text-zinc-400 mb-4 uppercase text-sm">
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="text-zinc-400 mb-4">We do not warrant that:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-6">
                <li>The Services will be uninterrupted, secure, or error-free</li>
                <li>Data provided will be 100% accurate, complete, or current</li>
                <li>Attribution tracking will capture 100% of orders (platform limitations may apply)</li>
                <li>Defects will be corrected immediately</li>
                <li>The Services will meet your specific requirements</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Limitation of Liability</h3>
              <p className="text-zinc-400 mb-4 uppercase text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADWYSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-4">
                <li>Lost profits or revenue from ad campaigns</li>
                <li>Loss of data or business interruption</li>
                <li>Incorrect attribution or ROAS calculations</li>
                <li>Ad spending decisions based on our insights</li>
                <li>Unauthorized access to your account</li>
                <li>Third-party platform failures or API changes</li>
              </ul>
              <p className="text-zinc-400 uppercase text-sm">
                OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </div>

            {/* Indemnification */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
              <p className="text-zinc-400 mb-4">
                You agree to indemnify, defend, and hold harmless AdWyse and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including attorney's fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                <li>Your use of the Services</li>
                <li>Violation of these Terms</li>
                <li>Violation of any rights of another party</li>
                <li>Ad spending or campaign decisions made using our Services</li>
                <li>Violation of advertising platform policies</li>
              </ul>
            </div>

            {/* Termination */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
              <p className="text-zinc-400 mb-4">We may suspend or terminate your access to the Services at any time, with or without cause, including for:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4 mb-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Abusive behavior toward our team or other users</li>
                <li>Unauthorized use or sharing of account credentials</li>
              </ul>
              <p className="text-zinc-400">
                Upon termination, your right to use the Services immediately ceases. We may delete your account and data after a reasonable period, subject to our data retention policies and legal obligations.
              </p>
            </div>

            {/* Dispute Resolution */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">11. Dispute Resolution and Arbitration</h2>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Informal Resolution</h3>
              <p className="text-zinc-400 mb-6">
                Before filing a claim, you agree to contact us at <a href="mailto:support@adwyse.ca" className="text-amber-400 hover:text-amber-300">support@adwyse.ca</a> to attempt to resolve the dispute informally.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Binding Arbitration</h3>
              <p className="text-zinc-400 mb-6">
                Any disputes that cannot be resolved informally shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules. Arbitration will be conducted in the United States or Canada.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Class Action Waiver</h3>
              <p className="text-zinc-400">
                You agree to resolve disputes on an individual basis only and waive the right to participate in class actions or class arbitrations.
              </p>
            </div>

            {/* Governing Law */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-zinc-400">
                These Terms shall be governed by and construed in accordance with the laws of Canada and the United States, without regard to conflict of law principles.
              </p>
            </div>

            {/* Miscellaneous */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">13. Miscellaneous</h2>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Entire Agreement</h3>
              <p className="text-zinc-400 mb-6">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and AdWyse regarding the Services.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Severability</h3>
              <p className="text-zinc-400 mb-6">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Waiver</h3>
              <p className="text-zinc-400 mb-6">
                Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Assignment</h3>
              <p className="text-zinc-400">
                You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
              </p>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
              <p className="text-zinc-400 mb-4">If you have questions about these Terms, please contact us:</p>
              <div className="space-y-2">
                <p className="text-white font-semibold">AdWyse</p>
                <p className="text-zinc-400">Email: <a href="mailto:support@adwyse.ca" className="text-amber-400 hover:text-amber-300">support@adwyse.ca</a></p>
                <p className="text-zinc-400">Legal: <a href="mailto:legal@adwyse.ca" className="text-amber-400 hover:text-amber-300">legal@adwyse.ca</a></p>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
