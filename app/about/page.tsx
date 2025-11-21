'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
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
            <Link href="/about" className="text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
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
              About <span className="gradient-text">AdWyse</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              AI-powered ad attribution that helps Shopify merchants know exactly which ads make them money
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-12 mb-20">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">The Problem We Solve</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-bold gradient-text mb-4">70%</div>
                <h3 className="text-xl font-bold text-white mb-2">Broken Tracking</h3>
                <p className="text-white/70">
                  Apple's iOS 14 update destroyed Facebook and Google ad tracking. Merchants are flying blind, not knowing which ads actually work.
                </p>
              </div>
              <div>
                <div className="text-5xl font-bold gradient-text mb-4">$2.4B</div>
                <h3 className="text-xl font-bold text-white mb-2">Wasted Ad Spend</h3>
                <p className="text-white/70">
                  Shopify merchants waste billions annually on ads that don't convert because they can't track attribution accurately.
                </p>
              </div>
              <div>
                <div className="text-5xl font-bold gradient-text mb-4">$599</div>
                <h3 className="text-xl font-bold text-white mb-2">Expensive Solutions</h3>
                <p className="text-white/70">
                  Triple Whale and Polar Analytics charge $129-599/month for attribution tools that are too complex and overpriced for most merchants.
                </p>
              </div>
            </div>
          </div>

          {/* Adam's Story */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
                <div className="bg-slate-800/50 rounded-xl p-12 text-center">
                  <div className="w-48 h-48 rounded-full mx-auto mb-6 overflow-hidden">
                    <Image src="/profile2.png" alt="Adam - Founder" width={192} height={192} style={{ objectFit: 'cover' }} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Adam</h3>
                  <p className="text-orange-400 mb-4">Founder</p>
                  <div className="flex justify-center gap-4">
                    <a href="#" className="text-white/60 hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Why I Built AdWyse</h2>
              <p className="text-lg text-white/70 mb-4">
                Hi, I'm Adam. I built AdWyse to solve the biggest problem in e-commerce advertising: broken attribution tracking.
              </p>
              <p className="text-lg text-white/70 mb-4">
                After iOS 14, Facebook and Google's tracking became unreliable. Merchants started spending thousands on ads without knowing which ones actually drove sales. I watched businesses waste 30-40% of their ad budgets on campaigns that didn't work.
              </p>
              <p className="text-lg text-white/70 mb-4">
                Existing solutions like Triple Whale ($129-599/month) and Polar Analytics ($199-599/month) are too expensive and complex. Most Shopify merchants spending $1k-50k/month on ads can't justify those prices.
              </p>
              <p className="text-lg text-white/70">
                AdWyse tracks every order back to its source using UTM parameters and platform click IDs. But we don't just show data - Claude AI analyzes it and tells you exactly what to do: "Pause this campaign (losing $47/day)" or "Scale this one (5.2x ROAS)." All for $99/month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How AdWyse Works */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-orange-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              How <span className="gradient-text">AdWyse</span> Works
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Built with cutting-edge attribution technology and AI-powered insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Accurate Attribution</h3>
              <p className="text-white/70">
                Track orders using UTM parameters, Facebook Click IDs (FBCLID), and Google Click IDs (GCLID). Every sale gets matched to the exact ad that drove it.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Real ROAS Calculations</h3>
              <p className="text-white/70">
                We pull ad spend data from Facebook and Google APIs, match it with your Shopify orders, and calculate true Return on Ad Spend for each campaign.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-orange-500/50 transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Insights</h3>
              <p className="text-white/70">
                Claude AI analyzes your campaigns daily and generates actionable recommendations. Not just data - specific actions to take with estimated ROI impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now? */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-br from-orange-600/10 to-red-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6 text-center">Simple Pricing, Powerful Results</h2>
            <p className="text-xl text-white/70 mb-8 text-center max-w-3xl mx-auto">
              One price, unlimited tracking. Get the attribution insights you need without breaking the bank.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">$99/Month Flat Fee</h3>
                  <p className="text-white/70">Simple subscription. No setup fees, no hidden costs, no contracts. Cancel anytime. Compare to Triple Whale ($129-599/month) or Polar ($199-599/month).</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">2-Minute Setup</h3>
                  <p className="text-white/70">Install from Shopify App Store. Connect Facebook and Google Ads via OAuth. Start tracking orders immediately. No technical knowledge required.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">7-Day Free Trial</h3>
                  <p className="text-white/70">Try it risk-free. No credit card required. See exactly which ads are working (and which aren't) before you pay.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">15x+ ROI Typical</h3>
                  <p className="text-white/70">Most merchants save $1,500-3,000/month by cutting bad campaigns and scaling winners. That's 15-30x return on your $99 investment.</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  border: 'none',
                  padding: '16px 48px',
                  borderRadius: '12px',
                  fontSize: '18px',
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
          </div>
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
