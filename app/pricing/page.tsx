'use client';

import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Simple Pricing
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Start Free,{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Scale When Ready
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Get started with our free plan. Upgrade to Pro when you need unlimited tracking and AI insights.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="relative z-10">
              <div className="mb-8">
                <div className="text-zinc-400 font-semibold mb-2">Free Plan</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="text-zinc-500 mt-2">Forever free · No credit card</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { text: "1 ad account connection", included: true },
                  { text: "100 orders tracked/month", included: true },
                  { text: "30 days data history", included: true },
                  { text: "Basic ROAS dashboard", included: true },
                  { text: "Facebook OR Google Ads", included: true },
                  { text: "AI-powered insights", included: false },
                  { text: "Email reports", included: false },
                  { text: "Custom alerts", included: false },
                ].map((feature, i) => (
                  <li key={i} className={`flex items-center gap-3 ${feature.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.included ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                      {feature.included ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <span className="w-2 h-0.5 bg-zinc-600 rounded" />
                      )}
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-4 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/5 transition flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent p-8">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute top-6 right-6 px-3 py-1 bg-amber-500 rounded-full text-xs font-bold text-zinc-900">
              BEST VALUE
            </div>

            <div className="relative z-10">
              <div className="mb-8">
                <div className="text-amber-400 font-semibold mb-2">Pro Plan</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="text-zinc-500 mt-2">7-day trial · Cancel anytime</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { text: "Unlimited ad accounts", included: true },
                  { text: "Unlimited orders tracked", included: true },
                  { text: "Full data history", included: true },
                  { text: "Advanced ROAS dashboard", included: true },
                  { text: "Facebook, Google & TikTok", included: true },
                  { text: "AI-powered insights", included: true, highlight: true },
                  { text: "Email reports", included: true, highlight: true },
                  { text: "Custom alerts", included: true, highlight: true },
                ].map((feature, i) => (
                  <li key={i} className={`flex items-center gap-3 ${feature.highlight ? 'text-amber-300' : 'text-zinc-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.highlight ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                      <Check className={`w-3 h-3 ${feature.highlight ? 'text-amber-400' : 'text-green-400'}`} />
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-amber-500/25 transition flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-zinc-500 text-sm mt-4">
                No credit card required for trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Compare & Save
            </h2>
            <p className="text-zinc-400 text-lg">
              See how AdWyse stacks up against enterprise alternatives
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-400">AdWyse Free</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-amber-400">AdWyse Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-500">Triple Whale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">Price</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-green-400">Free forever</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-amber-400">$99/mo</td>
                  <td className="px-6 py-4 text-center text-sm text-zinc-500">$129/mo</td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Ad Accounts</td>
                  <td className="px-6 py-4 text-center text-sm text-zinc-400">1</td>
                  <td className="px-6 py-4 text-center text-sm text-amber-400">Unlimited</td>
                  <td className="px-6 py-4 text-center text-sm text-zinc-500">Tiered</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">Orders/Month</td>
                  <td className="px-6 py-4 text-center text-sm text-zinc-400">100</td>
                  <td className="px-6 py-4 text-center text-sm text-amber-400">Unlimited</td>
                  <td className="px-6 py-4 text-center text-sm text-zinc-500">Tiered</td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">AI-Powered Insights</td>
                  <td className="px-6 py-4 text-center text-zinc-600">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-zinc-600">Limited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">Email Reports</td>
                  <td className="px-6 py-4 text-center text-zinc-600">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Setup Time</td>
                  <td className="px-6 py-4 text-center text-sm text-green-400">2 minutes</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-amber-400">2 minutes</td>
                  <td className="px-6 py-4 text-center text-sm text-zinc-500">30+ min</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Calculate Your ROI
              </h2>
              <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                If you spend $10,000/month on ads and waste just 15% on underperforming campaigns:
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                  <div className="text-4xl font-bold text-red-400 mb-2">$1,500</div>
                  <div className="text-zinc-400 text-sm">Wasted monthly</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                  <div className="text-4xl font-bold text-amber-400 mb-2">$99</div>
                  <div className="text-zinc-400 text-sm">AdWyse cost</div>
                </div>
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                  <div className="text-4xl font-bold text-green-400 mb-2">15x</div>
                  <div className="text-zinc-400 text-sm">Your ROI</div>
                </div>
              </div>

              <p className="text-zinc-400">
                Most merchants save <span className="text-amber-400 font-semibold">$1,500-3,000/month</span> by cutting bad campaigns
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What's included in the free plan?",
                a: "The free plan includes 1 ad account connection, 100 orders tracked per month, 30 days of data history, and basic ROAS calculations. Perfect for testing or small stores."
              },
              {
                q: "How does the Pro trial work?",
                a: "Install AdWyse and get 7 days of full Pro access with no credit card required. After the trial, you can subscribe to Pro or continue on the free plan."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes! No contracts, no commitments. Cancel from your Shopify admin whenever you want. You'll be moved to the free plan with limited features."
              },
              {
                q: "What ad platforms do you support?",
                a: "Facebook Ads, Google Ads, and TikTok Ads. Free plan supports 1 account from any platform. Pro supports unlimited accounts across all platforms."
              },
              {
                q: "What makes the AI insights special?",
                a: "Claude AI analyzes your campaign data and generates specific recommendations like 'pause campaign X' or 'increase budget on Y'. This is a Pro-only feature."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                    <p className="text-zinc-400">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Stop Wasting Ad Spend?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Join Shopify merchants who track every dollar with AI-powered attribution.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-amber-500/25 transition"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-zinc-500 text-sm mt-4">
            Free plan available · Pro at $99/month · No credit card required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
