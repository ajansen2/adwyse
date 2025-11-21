'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
          Privacy <span className="gradient-text">Policy</span>
        </h1>
        <p className="text-white/60 mb-12">Last Updated: January 2025</p>

        <div className="space-y-12 text-white/70">
          {/* Introduction */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Introduction</h2>
            <p className="mb-4">
              Welcome to AdWyse. We are committed to protecting your privacy and ensuring the security of your personal and business information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our ad attribution service for Shopify stores.
            </p>
            <p>
              By using AdWyse, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Information We Collect</h2>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Personal Information</h3>
            <p className="mb-4">When you create an account or use our services, we may collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Name and email address</li>
              <li>Shopify store information (store name, URL, domain)</li>
              <li>Payment and billing information (processed securely through Shopify)</li>
              <li>Ad account credentials (Facebook Ads, Google Ads OAuth tokens)</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Automatically Collected Information</h3>
            <p className="mb-4">When you access our platform, we automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP address and geographic location</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Order and Campaign Data</h3>
            <p className="mb-4">We collect data from your Shopify store and ad platforms to provide attribution services, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Shopify order information (order ID, total price, timestamps)</li>
              <li>UTM parameters and tracking data (utm_source, utm_campaign, etc.)</li>
              <li>Platform click IDs (FBCLID for Facebook, GCLID for Google)</li>
              <li>Customer email addresses (for attribution only, not for marketing)</li>
              <li>Ad campaign data (campaign names, spend, impressions, clicks)</li>
              <li>Revenue and ROAS calculations</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Attribution Tracking:</strong> To match Shopify orders to ad campaigns and calculate ROAS</li>
              <li><strong className="text-white">AI Insights Generation:</strong> To process campaign data through Claude AI for actionable recommendations</li>
              <li><strong className="text-white">Ad Platform Integration:</strong> To sync ad spend data from Facebook/Google Ads APIs</li>
              <li><strong className="text-white">Account Management:</strong> To manage your account, subscription, and billing</li>
              <li><strong className="text-white">Communication:</strong> To send you insights reports, analytics, and support messages</li>
              <li><strong className="text-white">Platform Improvement:</strong> To analyze usage patterns and improve our features</li>
              <li><strong className="text-white">Security:</strong> To detect fraud, abuse, and security threats</li>
              <li><strong className="text-white">Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Data Sharing and Disclosure</h2>
            <p className="mb-4">We may share your information with:</p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Service Providers</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Anthropic:</strong> For AI-powered analysis (Claude AI)</li>
              <li><strong className="text-white">Shopify:</strong> For order data and OAuth integration</li>
              <li><strong className="text-white">Facebook/Meta:</strong> For ad campaign data via Facebook Ads API</li>
              <li><strong className="text-white">Google:</strong> For ad campaign data via Google Ads API</li>
              <li><strong className="text-white">Supabase:</strong> For secure database and authentication services</li>
              <li><strong className="text-white">Vercel:</strong> For hosting and infrastructure</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or governmental request, or to protect our rights and safety.
            </p>

            <h3 className="text-xl font-bold text-white mb-3 mt-6">What We DON'T Do</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We do NOT sell your personal information to third parties</li>
              <li>We do NOT share your order or campaign data with other users</li>
              <li>We do NOT use your data for advertising purposes</li>
              <li>We do NOT send marketing emails to your customers</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>End-to-end encryption for data transmission (SSL/TLS)</li>
              <li>Encrypted data storage</li>
              <li>Row-level security (RLS) in our database</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure API key management and OAuth token storage</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide services. If you close your account, we will delete or anonymize your data within 90 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, dispute resolution).
            </p>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Your Rights and Choices</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
              <li><strong className="text-white">Export:</strong> Download your order and analytics data</li>
              <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong className="text-white">Object:</strong> Object to certain data processing activities</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@adwyse.ca" className="text-orange-400 hover:text-orange-300">privacy@adwyse.ca</a>.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Cookies and Tracking Technologies</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain your session and authentication</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage and performance</li>
              <li>Improve user experience</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings, but disabling cookies may limit platform functionality.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Third-Party Services</h2>
            <p>
              Our platform integrates with third-party services (Shopify, Facebook Ads, Google Ads, Anthropic) that have their own privacy policies. We encourage you to review their policies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li><a href="https://www.shopify.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Shopify Privacy Policy</a></li>
              <li><a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Facebook Privacy Policy</a></li>
              <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Google Privacy Policy</a></li>
              <li><a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Anthropic Privacy Policy</a></li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Children's Privacy</h2>
            <p>
              AdWyse is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">International Users</h2>
            <p>
              Our services are hosted in the United States and Canada. If you access our platform from outside North America, your information will be transferred to and processed in these jurisdictions, which may have different data protection laws than your country.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on our platform. The "Last Updated" date at the top indicates when the policy was last revised.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
            <p className="mb-4">If you have questions or concerns about this Privacy Policy, please contact us:</p>
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <p className="text-white"><strong>AdWyse</strong></p>
              <p className="mt-2">Email: <a href="mailto:privacy@adwyse.ca" className="text-orange-400 hover:text-orange-300">privacy@adwyse.ca</a></p>
              <p>Support: <a href="mailto:adam@adwyse.ca" className="text-orange-400 hover:text-orange-300">adam@adwyse.ca</a></p>
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
