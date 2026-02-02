'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gradient-text {
          background: linear-gradient(-45deg, #f59e0b, #ef4444, #f59e0b, #ef4444);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient 3s ease infinite;
        }

        .glow-button {
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(245, 158, 11, 0.4);
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" style={{ cursor: 'pointer', fontSize: '24px', fontWeight: 800 }}>
            <span className="gradient-text">AdWyse</span>
          </Link>
          <nav className="flex gap-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold text-white mb-6">
          Terms of <span className="gradient-text">Service</span>
        </h1>
        <p className="text-white/60 mb-12">Last Updated: January 2025</p>

        <div className="space-y-12 text-white/70">
          {/* Agreement to Terms */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and AdWyse ("we," "us," "our") concerning your access to and use of our ad attribution service for Shopify stores (collectively, the "Services").
            </p>
            <p className="mb-4">
              By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the platform. Your continued use of the Services after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">2. Eligibility</h2>
            <p className="mb-4">To use our Services, you must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Be at least 18 years old</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Services under applicable laws</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Own or operate a Shopify store</li>
            </ul>
            <p className="mt-4">
              By creating an account, you represent and warrant that you meet all eligibility requirements.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">3. Account Registration and Security</h2>
            <p className="mb-4">
              To access our Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password confidential and secure</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p className="mt-4">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or abusive behavior.
            </p>
          </section>

          {/* Subscription and Billing */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">4. Subscription and Billing</h2>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Subscription Plans</h3>
            <p className="mb-4">AdWyse offers a Pro Plan subscription:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Pro Plan ($99/month):</strong> AI-powered ad attribution tracking, unlimited order tracking, Facebook/Google Ads integration, ROAS calculations, AI insights dashboard, and campaign analytics</li>
              <li><strong className="text-white">7-Day Free Trial:</strong> All new accounts receive a 7-day free trial with full access to Pro features</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Billing and Payment</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Subscriptions are billed monthly in advance</li>
              <li>Payment is processed securely through Shopify</li>
              <li>You authorize us to charge your payment method on each billing cycle</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We may change pricing with 30 days' notice</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Cancellation and Refunds</h3>
            <p>
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period. You will retain access to paid features until that time. We do not provide prorated refunds for partial months.
            </p>
          </section>

          {/* Use of Services */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">5. Use of Services and Acceptable Use Policy</h2>
            <p className="mb-4">You agree to use our Services only for lawful purposes. You may NOT:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
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
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">6. Intellectual Property Rights</h2>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Our Content</h3>
            <p className="mb-4">
              The Services, including all software, text, graphics, logos, and other content, are owned by AdWyse or our licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              We grant you a limited, non-exclusive, non-transferable license to access and use the Services for your business purposes. You may not copy, modify, distribute, or create derivative works without our written permission.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Your Content</h3>
            <p className="mb-4">
              You retain ownership of any order data, campaign information, or other content accessed through the Services ("Your Content"). By using our Services, you grant us a worldwide, non-exclusive, royalty-free license to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Process and analyze Your Content to provide the Services</li>
              <li>Store Your Content on our secure servers</li>
              <li>Use anonymized, aggregated data to improve our Services</li>
            </ul>
            <p className="mt-4">
              We will NOT share Your Content with third parties except as necessary to provide the Services or as required by law.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">7. Third-Party Services and Data</h2>
            <p className="mb-4">
              Our Services integrate with third-party platforms (Shopify, Facebook Ads, Google Ads, Anthropic Claude AI). We are not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The accuracy, completeness, or reliability of third-party data</li>
              <li>Availability or downtime of third-party services</li>
              <li>Third-party pricing changes or service discontinuation</li>
              <li>Third-party terms of service or privacy policies</li>
              <li>Changes to Facebook/Google Ads APIs that affect functionality</li>
            </ul>
            <p className="mt-4">
              Your use of third-party services is subject to their respective terms and conditions.
            </p>
          </section>

          {/* Disclaimers and Limitations */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">8. Disclaimers and Limitations of Liability</h2>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Service Limitations</h3>
            <p className="mb-4 bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6">
              <strong className="text-white">IMPORTANT:</strong> AdWyse provides ad attribution tracking and ROAS calculations. We do NOT guarantee specific ROAS results, ad performance, or revenue outcomes. Campaign performance depends on many factors outside our control including ad creative, targeting, product market fit, pricing, and external market conditions.
            </p>
            <p className="mb-4">
              When using our Services, you should:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Verify attribution data accuracy against your ad platforms</li>
              <li>Understand that AI-generated insights are recommendations, not guarantees</li>
              <li>Make ad spending decisions based on your own judgment and analysis</li>
              <li>Comply with all advertising platform policies and regulations</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Service "As Is"</h3>
            <p className="mb-4">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="mb-4">We do not warrant that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The Services will be uninterrupted, secure, or error-free</li>
              <li>Data provided will be 100% accurate, complete, or current</li>
              <li>Attribution tracking will capture 100% of orders (platform limitations may apply)</li>
              <li>Defects will be corrected immediately</li>
              <li>The Services will meet your specific requirements</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Limitation of Liability</h3>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADWYSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Lost profits or revenue from ad campaigns</li>
              <li>Loss of data or business interruption</li>
              <li>Incorrect attribution or ROAS calculations</li>
              <li>Ad spending decisions based on our insights</li>
              <li>Unauthorized access to your account</li>
              <li>Third-party platform failures or API changes</li>
            </ul>
            <p className="mt-4">
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICES SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">9. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless AdWyse and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including attorney's fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>Your use of the Services</li>
              <li>Violation of these Terms</li>
              <li>Violation of any rights of another party</li>
              <li>Ad spending or campaign decisions made using our Services</li>
              <li>Violation of advertising platform policies</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">10. Termination</h2>
            <p className="mb-4">We may suspend or terminate your access to the Services at any time, with or without cause, including for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>Abusive behavior toward our team or other users</li>
              <li>Unauthorized use or sharing of account credentials</li>
            </ul>
            <p className="mt-4">
              Upon termination, your right to use the Services immediately ceases. We may delete your account and data after a reasonable period, subject to our data retention policies and legal obligations.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">11. Dispute Resolution and Arbitration</h2>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Informal Resolution</h3>
            <p className="mb-4">
              Before filing a claim, you agree to contact us at <a href="mailto:support@adwyse.ca" className="text-orange-400 hover:text-orange-300">support@adwyse.ca</a> to attempt to resolve the dispute informally.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Binding Arbitration</h3>
            <p className="mb-4">
              Any disputes that cannot be resolved informally shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules. Arbitration will be conducted in the United States or Canada.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Class Action Waiver</h3>
            <p>
              You agree to resolve disputes on an individual basis only and waive the right to participate in class actions or class arbitrations.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Canada and the United States, without regard to conflict of law principles.
            </p>
          </section>

          {/* Miscellaneous */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">13. Miscellaneous</h2>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and AdWyse regarding the Services.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Severability</h3>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Assignment</h3>
            <p>
              You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">14. Contact Information</h2>
            <p className="mb-4">If you have questions about these Terms, please contact us:</p>
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <p className="text-white"><strong>AdWyse</strong></p>
              <p className="mt-2">Email: <a href="mailto:support@adwyse.ca" className="text-orange-400 hover:text-orange-300">support@adwyse.ca</a></p>
              <p>Legal: <a href="mailto:legal@adwyse.ca" className="text-orange-400 hover:text-orange-300">legal@adwyse.ca</a></p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '9999px',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(245, 158, 11, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">AdWyse</div>
              <p className="text-white/60">AI-powered ad attribution for Shopify</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/about" className="text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/how-it-works" className="text-white/60 hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-white/60">adam@adwyse.ca</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>&copy; 2025 AdWyse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
