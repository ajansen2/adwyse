'use client';

import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';
import PricingCard from '@/components/ui/pricing-card';

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
              Triple Whale features.{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Half the price.
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              AI assistant, competitor spy, cohort retention, predictive budget AI, server-side tracking — everything serious Shopify merchants need, for $99/mo.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <PricingCard />
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
                  <td className="px-6 py-4 text-center text-sm text-zinc-500">$149-219/mo</td>
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
                  <td className="px-6 py-4 text-sm text-zinc-400">Real-time ROAS dashboard</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">AI Assistant (chat with your data)</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-xs text-zinc-500">Moby AI</td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Competitor Spy (live ad scraping)</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">AI Creative Score (rank 0-100)</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Cohort retention analysis</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">New vs Repeat ROAS (NC-ROAS)</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Predictive Budget Optimizer</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">Multi-touch attribution</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Server-side Conversions API (iOS14 fix)</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">Slack daily digest</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr className="bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm text-zinc-400">Email reports & creative fatigue alerts</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-green-400 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-zinc-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-zinc-400">Profit tracking (COGS) & Customer LTV</td>
                  <td className="px-6 py-4 text-center text-zinc-600">—</td>
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

          <p className="text-center text-zinc-500 text-xs mt-4">
            Same features. Half the price. Native Shopify install — no migration headaches.
          </p>
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
                a: "1 ad account connection, 100 orders/month, 30 days of data history, basic ROAS dashboard, and the conversion funnel. Perfect for testing or very small stores."
              },
              {
                q: "How is AdWyse different from Triple Whale?",
                a: "Same core features (multi-touch attribution, AI assistant, cohorts, NC-ROAS, CAPI, creative analysis) at $99/mo flat — Triple Whale starts at $149 and tiers up to $219+. Plus we add a live Competitor Spy that scrapes Meta Ad Library, which Triple Whale doesn't have. And our setup is 2 minutes vs their 30+."
              },
              {
                q: "What does the AI Assistant do?",
                a: "It's a chat box where you ask questions in plain English — 'What's my best campaign?', 'What should I scale?', 'Why did revenue drop yesterday?' — and get specific answers with real numbers from your data. Powered by Claude."
              },
              {
                q: "How does Competitor Spy work?",
                a: "Add any brand name and we pull their currently-running Facebook & Instagram ads from Meta's Ad Library in real-time. See their creatives, copy, formats, and how long each ad has been running. Cached 24h to keep it fast."
              },
              {
                q: "What is server-side Conversions API for?",
                a: "iOS14 and Safari ITP wiped out ~30% of pixel-based attribution. Our server-side CAPI integration sends purchase events directly from our servers to Meta, recovering that lost data. Most merchants see ROAS jump 15-30% after enabling it."
              },
              {
                q: "How does the Pro trial work?",
                a: "Install AdWyse and get 7 days of full Pro access. No credit card required. After the trial, subscribe to Pro or stay on the free plan."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. No contracts. Cancel from your Shopify admin and you'll move to the free plan with limited features."
              },
              {
                q: "What ad platforms do you support?",
                a: "Facebook, Google, and TikTok Ads. Free plan supports 1 account from any platform. Pro supports unlimited accounts across all platforms."
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
