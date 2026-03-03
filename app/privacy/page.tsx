'use client';

import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
            Privacy{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-zinc-400">Last Updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {/* Introduction */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Introduction</h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  Welcome to AdWyse. We are committed to protecting your privacy and ensuring the security of your personal and business information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our ad attribution service for Shopify stores.
                </p>
                <p>
                  By using AdWyse, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </div>
            </div>

            {/* Information We Collect */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">Information We Collect</h2>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Personal Information</h3>
              <p className="text-zinc-400 mb-4">When you create an account or use our services, we may collect:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 mb-6 ml-4">
                <li>Name and email address</li>
                <li>Shopify store information (store name, URL, domain)</li>
                <li>Payment and billing information (processed securely through Shopify)</li>
                <li>Ad account credentials (Facebook Ads, Google Ads OAuth tokens)</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Automatically Collected Information</h3>
              <p className="text-zinc-400 mb-4">When you access our platform, we automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 mb-6 ml-4">
                <li>IP address and geographic location</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Order and Campaign Data</h3>
              <p className="text-zinc-400 mb-4">We collect data from your Shopify store and ad platforms to provide attribution services, including:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                <li>Shopify order information (order ID, total price, timestamps)</li>
                <li>UTM parameters and tracking data (utm_source, utm_campaign, etc.)</li>
                <li>Platform click IDs (FBCLID for Facebook, GCLID for Google)</li>
                <li>Customer email addresses (for attribution only, not for marketing)</li>
                <li>Ad campaign data (campaign names, spend, impressions, clicks)</li>
                <li>Revenue and ROAS calculations</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <p className="text-zinc-400 mb-4">We use the collected information for:</p>
              <ul className="space-y-3 text-zinc-400">
                <li><span className="text-white font-medium">Attribution Tracking:</span> To match Shopify orders to ad campaigns and calculate ROAS</li>
                <li><span className="text-white font-medium">AI Insights Generation:</span> To process campaign data through Claude AI for actionable recommendations</li>
                <li><span className="text-white font-medium">Ad Platform Integration:</span> To sync ad spend data from Facebook/Google Ads APIs</li>
                <li><span className="text-white font-medium">Account Management:</span> To manage your account, subscription, and billing</li>
                <li><span className="text-white font-medium">Communication:</span> To send you insights reports, analytics, and support messages</li>
                <li><span className="text-white font-medium">Platform Improvement:</span> To analyze usage patterns and improve our features</li>
                <li><span className="text-white font-medium">Security:</span> To detect fraud, abuse, and security threats</li>
                <li><span className="text-white font-medium">Legal Compliance:</span> To comply with applicable laws and regulations</li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-6">Data Sharing and Disclosure</h2>
              <p className="text-zinc-400 mb-6">We may share your information with:</p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Service Providers</h3>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 mb-6 ml-4">
                <li><span className="text-white">Anthropic:</span> For AI-powered analysis (Claude AI)</li>
                <li><span className="text-white">Shopify:</span> For order data and OAuth integration</li>
                <li><span className="text-white">Facebook/Meta:</span> For ad campaign data via Facebook Ads API</li>
                <li><span className="text-white">Google:</span> For ad campaign data via Google Ads API</li>
                <li><span className="text-white">Supabase:</span> For secure database and authentication services</li>
                <li><span className="text-white">Vercel:</span> For hosting and infrastructure</li>
              </ul>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Business Transfers</h3>
              <p className="text-zinc-400 mb-6">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
              </p>

              <h3 className="text-lg font-semibold text-amber-400 mb-3">Legal Requirements</h3>
              <p className="text-zinc-400 mb-6">
                We may disclose your information if required by law, court order, or governmental request, or to protect our rights and safety.
              </p>

              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-3">What We DON'T Do</h3>
                <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                  <li>We do NOT sell your personal information to third parties</li>
                  <li>We do NOT share your order or campaign data with other users</li>
                  <li>We do NOT use your data for advertising purposes</li>
                  <li>We do NOT send marketing emails to your customers</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-zinc-400 mb-4">We implement industry-standard security measures including:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 mb-4 ml-4">
                <li>End-to-end encryption for data transmission (SSL/TLS)</li>
                <li>Encrypted data storage</li>
                <li>Row-level security (RLS) in our database</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure API key management and OAuth token storage</li>
              </ul>
              <p className="text-zinc-400">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </div>

            {/* Data Retention */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-zinc-400">
                We retain your personal information for as long as your account is active or as needed to provide services. If you close your account, we will delete or anonymize your data within 90 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, dispute resolution).
              </p>
            </div>

            {/* Your Rights */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Your Rights and Choices</h2>
              <p className="text-zinc-400 mb-4">You have the right to:</p>
              <ul className="space-y-3 text-zinc-400 mb-4">
                <li><span className="text-white font-medium">Access:</span> Request a copy of your personal data</li>
                <li><span className="text-white font-medium">Correction:</span> Update or correct inaccurate information</li>
                <li><span className="text-white font-medium">Deletion:</span> Request deletion of your account and data</li>
                <li><span className="text-white font-medium">Export:</span> Download your order and analytics data</li>
                <li><span className="text-white font-medium">Opt-Out:</span> Unsubscribe from marketing communications</li>
                <li><span className="text-white font-medium">Object:</span> Object to certain data processing activities</li>
              </ul>
              <p className="text-zinc-400">
                To exercise these rights, contact us at <a href="mailto:privacy@adwyse.ca" className="text-amber-400 hover:text-amber-300">privacy@adwyse.ca</a>.
              </p>
            </div>

            {/* Cookies */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-zinc-400 mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 mb-4 ml-4">
                <li>Maintain your session and authentication</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Improve user experience</li>
              </ul>
              <p className="text-zinc-400">
                You can control cookies through your browser settings, but disabling cookies may limit platform functionality.
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-zinc-400 mb-4">
                Our platform integrates with third-party services (Shopify, Facebook Ads, Google Ads, Anthropic) that have their own privacy policies. We encourage you to review their policies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-4">
                <li><a href="https://www.shopify.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">Shopify Privacy Policy</a></li>
                <li><a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">Facebook Privacy Policy</a></li>
                <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">Google Privacy Policy</a></li>
                <li><a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">Anthropic Privacy Policy</a></li>
              </ul>
            </div>

            {/* Children's Privacy */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
              <p className="text-zinc-400">
                AdWyse is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </div>

            {/* International Users */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">International Users</h2>
              <p className="text-zinc-400">
                Our services are hosted in the United States and Canada. If you access our platform from outside North America, your information will be transferred to and processed in these jurisdictions, which may have different data protection laws than your country.
              </p>
            </div>

            {/* Changes */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Changes to This Privacy Policy</h2>
              <p className="text-zinc-400">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on our platform. The "Last Updated" date at the top indicates when the policy was last revised.
              </p>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-zinc-400 mb-4">If you have questions or concerns about this Privacy Policy, please contact us:</p>
              <div className="space-y-2">
                <p className="text-white font-semibold">AdWyse</p>
                <p className="text-zinc-400">Email: <a href="mailto:privacy@adwyse.ca" className="text-amber-400 hover:text-amber-300">privacy@adwyse.ca</a></p>
                <p className="text-zinc-400">Support: <a href="mailto:adam@adwyse.ca" className="text-amber-400 hover:text-amber-300">adam@adwyse.ca</a></p>
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
