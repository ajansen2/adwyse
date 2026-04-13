'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileNav } from '@/components/dashboard/MobileNav';
import PricingCard from '@/components/ui/pricing-card';
import { Check, HelpCircle } from 'lucide-react';

export default function DashboardPricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar activePage="settings" />
      <MobileNav activePage="settings" />

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">
              Upgrade to{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse Pro
              </span>
            </h1>
            <p className="text-zinc-400 text-lg">
              AI assistant, competitor spy, cohort retention, predictive budget AI, and more — for $99/mo.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center mb-16">
            <PricingCard />
          </div>

          {/* Comparison Table */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-zinc-400">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-amber-400">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { feature: 'Price', free: 'Free forever', pro: '$99/mo' },
                    { feature: 'Ad Accounts', free: '1', pro: 'Unlimited' },
                    { feature: 'Orders/Month', free: '100', pro: 'Unlimited' },
                    { feature: 'Data History', free: '30 days', pro: 'Unlimited' },
                    { feature: 'ROAS Dashboard', free: true, pro: true },
                    { feature: 'Conversion Funnel', free: true, pro: true },
                    { feature: 'AI Assistant', free: false, pro: true },
                    { feature: 'Competitor Spy', free: false, pro: true },
                    { feature: 'AI Creative Score', free: false, pro: true },
                    { feature: 'Cohort Retention', free: false, pro: true },
                    { feature: 'NC-ROAS', free: false, pro: true },
                    { feature: 'Budget Optimizer', free: false, pro: true },
                    { feature: 'Multi-touch Attribution', free: false, pro: true },
                    { feature: 'Conversions API (CAPI)', free: false, pro: true },
                    { feature: 'Slack Daily Digest', free: false, pro: true },
                    { feature: 'Email Reports & Alerts', free: false, pro: true },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                      <td className="px-6 py-3 text-sm text-zinc-400">{row.feature}</td>
                      <td className="px-6 py-3 text-center text-sm">
                        {typeof row.free === 'boolean'
                          ? row.free
                            ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                            : <span className="text-zinc-600">—</span>
                          : <span className="text-zinc-400">{row.free}</span>
                        }
                      </td>
                      <td className="px-6 py-3 text-center text-sm">
                        {typeof row.pro === 'boolean'
                          ? row.pro
                            ? <Check className="w-4 h-4 text-green-400 mx-auto" />
                            : <span className="text-zinc-600">—</span>
                          : <span className="text-amber-400 font-medium">{row.pro}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
            <div className="space-y-4">
              {[
                { q: 'How does the 7-day trial work?', a: 'Install AdWyse and get 7 days of full Pro access. No credit card required up front. After the trial, subscribe to Pro or stay on the free plan.' },
                { q: 'Can I cancel anytime?', a: 'Yes. No contracts. Cancel from your Shopify admin and you\'ll move to the free plan.' },
                { q: 'What\'s the 100 orders/month limit?', a: 'Free plan tracks up to 100 orders per calendar month. The count resets on the 1st of each month. Pro has no limit.' },
                { q: 'What ad platforms do you support?', a: 'Facebook, Google, and TikTok Ads. Free plan supports 1 account from any platform. Pro supports unlimited.' },
              ].map((faq, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">{faq.q}</h3>
                      <p className="text-zinc-400 text-sm">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
