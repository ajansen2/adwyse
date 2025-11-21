'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrolled = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
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

        .floating {
          animation: float 6s ease-in-out infinite;
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
            <Link href="/how-it-works" className="text-white transition-colors">How It Works</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div ref={parallaxRef} className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6">
              How <span className="gradient-text">AdWyse</span> Works
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              From ad click to revenue attribution in 4 simple steps
            </p>
          </div>
        </div>
      </section>

      {/* The Process - 4 Steps */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Install & Connect</h3>
                <p className="text-white/70">
                  Install AdWyse from Shopify App Store. Connect Facebook Ads and Google Ads via OAuth. Setup takes 2 minutes.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-600 to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Track Every Click</h3>
                <p className="text-white/70">
                  When customers click your ads, we capture UTM parameters, Facebook Click IDs (FBCLID), and Google Click IDs (GCLID) automatically.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-600 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Match & Calculate</h3>
                <p className="text-white/70">
                  We sync ad spend from Facebook/Google APIs daily, match orders to campaigns, and calculate true ROAS for each ad.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-600 to-transparent"></div>
            </div>

            {/* Step 4 */}
            <div>
              <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Get AI Insights</h3>
                <p className="text-white/70">
                  Claude AI analyzes your data and tells you exactly what to do: which campaigns to pause, scale, or optimize.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Sections */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-orange-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Under the Hood</h2>
            <p className="text-xl text-white/70">
              Here's what makes AdWyse different from generic attribution tools
            </p>
          </div>

          <div className="space-y-12">
            {/* Attribution Tracking */}
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">Multi-Source Attribution</h3>
                  <p className="text-white/70 mb-4">
                    iOS 14 broke Facebook Pixel and Google Analytics tracking. AdWyse fixes it by using multiple attribution methods simultaneously.
                  </p>
                  <p className="text-white/70 mb-4">
                    We track:
                  </p>
                  <ul className="space-y-2 text-white/70">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>UTM Parameters:</strong> Campaign source, medium, campaign name, content, and term</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>FBCLID:</strong> Facebook Click ID that survives iOS 14 restrictions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>GCLID:</strong> Google Click ID for precise Google Ads attribution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Landing Site Referrer:</strong> Shopify's native tracking data</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Example Order Attribution</h4>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-white/80 text-sm font-mono">
                    Order #12345: $127.50<br/>
                    Source: facebook<br/>
                    Campaign: summer_sale_2025<br/>
                    FBCLID: IwAR3x...<br/>
                    Ad Spend: $8.40<br/>
                    <span className="text-green-400">ROAS: 15.2x</span>
                  </div>
                  <p className="text-orange-400 text-xs mt-3">^ Tracked automatically via Shopify webhook</p>
                </div>
              </div>
            </div>

            {/* ROAS Calculations */}
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">True ROAS Calculations</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Facebook's Broken ROAS</h4>
                      <p className="text-red-400 text-sm">Post-iOS 14</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">
                    Facebook Ads Manager shows inflated ROAS because it can't track iOS users. Merchants think campaigns are profitable when they're actually losing money.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">AdWyse's Real ROAS</h4>
                      <p className="text-green-400 text-sm">Server-Side Tracking</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">
                    We track orders on your Shopify server (not the customer's browser), so iOS 14 doesn't affect us. You see real revenue from real orders matched to exact ad spend.
                  </p>
                </div>
              </div>
              <div className="mt-6 bg-slate-800/50 rounded-xl p-6">
                <p className="text-white/70 text-sm">
                  <span className="text-white font-semibold">How we calculate ROAS:</span> We pull your daily ad spend from Facebook/Google APIs. Every Shopify order gets matched to a campaign. ROAS = Total Revenue / Total Ad Spend per campaign. Simple, accurate, profitable.
                </p>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-6">AI-Powered Insights</h3>
              <p className="text-white/70 mb-6">
                Most attribution tools just show you data. AdWyse uses Claude AI to tell you exactly what to do:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">🚨 Warnings</h4>
                  <div className="text-sm text-white/70 italic mb-2">"Campaign 'Spring Sale' is losing $47/day with 0.3x ROAS"</div>
                  <p className="text-white/60 text-xs">
                    → Action: Pause campaign immediately<br/>
                    → Impact: Save $1,410/month
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">🚀 Opportunities</h4>
                  <div className="text-sm text-white/70 italic mb-2">"Campaign 'Google Shopping' has 5.2x ROAS"</div>
                  <p className="text-white/60 text-xs">
                    → Action: Increase budget from $500 to $800<br/>
                    → Impact: +$1,560/month profit
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">💡 Recommendations</h4>
                  <div className="text-sm text-white/70 italic mb-2">"TikTok ads convert 40% better on weekends"</div>
                  <p className="text-white/60 text-xs">
                    → Action: Schedule ads Fri-Sun only<br/>
                    → Impact: 1.4x better ROAS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">Seamless Integration</h2>
            <p className="text-xl text-white/70">Works with the platforms you already use</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">S</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Shopify</h3>
              <p className="text-white/70">
                One-click connection. Webhooks configured automatically.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">f</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Facebook Ads</h3>
              <p className="text-white/70">
                OAuth integration pulls spend data automatically.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">G</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Google Ads</h3>
              <p className="text-white/70">
                OAuth integration syncs campaigns daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Know Which Ads Make Money?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Join Shopify merchants who track every dollar with AI-powered attribution. 7-day free trial, then $99/month.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              padding: '18px 48px',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer',
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
            Start Free Trial
          </button>
          <p className="text-white/60 text-sm mt-4">🎉 7-day free trial • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
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
