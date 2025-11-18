// app/how-it-works/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ShopifyAppStoreBadge from '@/components/ShopifyAppStoreBadge';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
          background: linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2);
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
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }

        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Image src="/logo 3.png" alt="ARGORA" width={140} height={47} style={{ objectFit: 'contain' }} />
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
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-white mb-6">
              How <span className="gradient-text">ARGORA</span> Works
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Four simple steps to recover lost revenue from abandoned carts
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
              <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Connect Store</h3>
                <p className="text-white/70">
                  Connect your Shopify store in minutes. We set up webhooks to detect abandoned carts automatically.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI Generates Messages</h3>
                <p className="text-white/70">
                  AI analyzes each cart and creates personalized recovery messages based on the products, customer, and your brand voice.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Send Email Sequence</h3>
                <p className="text-white/70">
                  Automated recovery sequence: First email at 1hr, then follow-ups at 24hr and 72hr. Sequence stops automatically if cart is recovered.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-transparent"></div>
            </div>

            {/* Step 4 */}
            <div>
              <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Recover Revenue</h3>
                <p className="text-white/70">
                  Watch recovered orders come in. Track performance on your dashboard with real-time analytics on recovery rate, ROI, and revenue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Sections */}
      <section className="py-20 relative bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Under the Hood</h2>
            <p className="text-xl text-white/70">
              Here's what makes ARGORA different from generic cart recovery tools
            </p>
          </div>

          <div className="space-y-12">
            {/* AI Personalization */}
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">AI-Powered Personalization</h3>
                  <p className="text-white/70 mb-4">
                    Most cart recovery tools use the same generic templates for every customer. ARGORA uses AI to generate unique messages for each abandoned cart.
                  </p>
                  <p className="text-white/70 mb-4">
                    The AI considers:
                  </p>
                  <ul className="space-y-2 text-white/70">
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Products in the cart (features, price points)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Your brand voice and tone</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Customer browsing behavior</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Time of day and urgency level</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Example Message</h4>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-white/80 text-sm italic">
                    "Hey Sarah! 👋 Noticed you left the Nike Air Max 270 in your cart. They're flying off the shelves - only 3 left in your size (8.5). Want me to hold them for you? Complete your order in the next hour and get free shipping! - Team at SportStyle"
                  </div>
                  <p className="text-purple-400 text-xs mt-3">^ Personalized by AI based on cart contents, customer name, inventory, and brand voice</p>
                </div>
              </div>
            </div>

            {/* Multi-Channel Recovery */}
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">Multi-Channel Recovery Sequence</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">First Email (1 hour)</h4>
                      <p className="text-purple-400 text-sm">40-50% open rate</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">
                    Strike while the iron is hot. First email sent 1 hour after abandonment with AI-personalized product mentions and urgency.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Email (24/48/72 hr)</h4>
                      <p className="text-purple-400 text-sm">20-30% open rate</p>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">
                    Follow-up nurture sequence with product highlights, reviews, and incentives. Cost-effective for persistent recovery.
                  </p>
                </div>
              </div>
              <div className="mt-6 bg-slate-800/50 rounded-xl p-6">
                <p className="text-white/70 text-sm">
                  <span className="text-white font-semibold">Smart Sequencing:</span> Argora automatically stops the sequence if the customer completes their purchase, preventing annoying duplicate messages. Emails are personalized by AI for each cart.
                </p>
              </div>
            </div>

            {/* Analytics & Tracking */}
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
              <h3 className="text-3xl font-bold text-white mb-6">Real-Time Analytics Dashboard</h3>
              <p className="text-white/70 mb-6">
                Track every recovered dollar and measure ROI with precision:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Recovery Metrics</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li>• Total carts abandoned</li>
                    <li>• Recovery rate (%)</li>
                    <li>• Revenue recovered ($)</li>
                    <li>• Average cart value</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Channel Performance</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li>• Email open/click rates</li>
                    <li>• Best performing messages</li>
                    <li>• Email sequence attribution</li>
                    <li>• Time-to-recovery</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">ROI Tracking</h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li>• Email costs ($0.001/email)</li>
                    <li>• AI generation costs ($0.003/message)</li>
                    <li>• Total subscription value</li>
                    <li>• Net profit per recovery</li>
                  </ul>
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

          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-white">S</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Shopify</h3>
              <p className="text-white/70">
                One-click connection via Shopify App Store. Webhooks configured automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Stop Losing Revenue?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Install the first AI-powered cart recovery app for Shopify. 14-day free trial, $19.99/month after.
          </p>
          <div className="flex justify-center">
            <ShopifyAppStoreBadge
              variant="preferred"
              appUrl="https://apps.shopify.com/argora-cart-recovery"
              height={70}
            />
          </div>
          <p className="text-white/60 text-sm mt-4">🎉 Now Available on Shopify App Store!</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">ARGORA</div>
              <p className="text-white/60">AI-powered cart recovery for e-commerce</p>
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
              <p className="text-white/60">adam@argora.ai</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p>&copy; 2025 ARGORA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
