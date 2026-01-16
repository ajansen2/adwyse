import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="AdWyse" className="w-12 h-12" />
            <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              AdWyse
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-white/60 text-lg">Track your ad performance and maximize your ROAS</p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur border-2 border-orange-500/50 rounded-2xl p-8 text-center">
            <div className="inline-flex px-4 py-1 bg-orange-500/20 rounded-full text-orange-300 text-sm font-medium mb-4">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pro Plan</h2>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$99.99</span>
              <span className="text-white/60">/month</span>
            </div>
            <div className="text-green-400 font-medium mb-6">7-day free trial included</div>

            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connect Facebook, Google & TikTok Ads
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time order attribution
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accurate ROAS tracking
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI-powered campaign insights
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email performance reports
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Performance alerts
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                CSV data export
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited orders tracked
              </li>
            </ul>

            <a
              href="https://apps.shopify.com/adwyse"
              className="block w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg transition"
            >
              Start Free Trial
            </a>
            <p className="text-white/40 text-sm mt-3">No credit card required</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/40 text-sm">
          <p>Questions? Contact us at <a href="mailto:support@adwyse.ca" className="text-orange-400 hover:underline">support@adwyse.ca</a></p>
        </div>
      </div>
    </div>
  );
}
