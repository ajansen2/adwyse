'use client';

import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import {
  ArrowRight,
  Check,
  MousePointerClick,
  ShoppingBag,
  Calculator,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Store,
  BarChart3
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Simple Process
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              How{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse
              </span>{" "}
              Works
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              From ad click to revenue attribution in 4 simple steps
            </p>
          </div>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Store,
                title: "Install & Connect",
                description: "Install AdWyse from Shopify App Store. Connect Facebook Ads and Google Ads via OAuth. Setup takes 2 minutes."
              },
              {
                step: "02",
                icon: MousePointerClick,
                title: "Track Every Click",
                description: "When customers click your ads, we capture UTM parameters, Facebook Click IDs (FBCLID), and Google Click IDs (GCLID) automatically."
              },
              {
                step: "03",
                icon: Calculator,
                title: "Match & Calculate",
                description: "We sync ad spend from Facebook/Google APIs daily, match orders to campaigns, and calculate true ROAS for each ad."
              },
              {
                step: "04",
                icon: Sparkles,
                title: "Get AI Insights",
                description: "Claude AI analyzes your data and tells you exactly what to do: which campaigns to pause, scale, or optimize."
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 h-full hover:border-amber-500/30 transition-all">
                  <div className="text-6xl font-bold text-amber-500/10 absolute top-4 right-4">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-zinc-400">{item.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Under the Hood Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Under the Hood</h2>
            <p className="text-zinc-400 text-lg">
              Here's what makes AdWyse different from generic attribution tools
            </p>
          </div>

          {/* Multi-Source Attribution */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 mb-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Multi-Source Attribution</h3>
                <p className="text-zinc-400 mb-6">
                  Platform-reported conversions are unreliable. AdWyse fixes it by matching actual Shopify orders to your ad campaigns using multiple attribution methods.
                </p>
                <ul className="space-y-4">
                  {[
                    { label: "UTM Parameters", desc: "Campaign source, medium, campaign name, content, and term" },
                    { label: "FBCLID", desc: "Facebook Click ID for precise Meta attribution" },
                    { label: "GCLID", desc: "Google Click ID for precise Google Ads attribution" },
                    { label: "Landing Site Referrer", desc: "Shopify's native tracking data" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <span className="text-white font-medium">{item.label}:</span>{" "}
                        <span className="text-zinc-400">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                <h4 className="text-white font-semibold mb-4">Example Order Attribution</h4>
                <div className="rounded-xl bg-zinc-800 p-4 font-mono text-sm text-zinc-300 space-y-1">
                  <p>Order #12345: $127.50</p>
                  <p>Source: facebook</p>
                  <p>Campaign: summer_sale_2025</p>
                  <p>FBCLID: IwAR3x...</p>
                  <p>Ad Spend: $8.40</p>
                  <p className="text-green-400 font-semibold">ROAS: 15.2x</p>
                </div>
                <p className="text-amber-400 text-xs mt-4">^ Tracked automatically via Shopify webhook</p>
              </div>
            </div>
          </div>

          {/* True ROAS Calculations */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">True ROAS Calculations</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Facebook's Broken ROAS</h4>
                    <p className="text-red-400 text-sm">Unreliable Estimates</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm">
                  Facebook Ads Manager shows inflated ROAS because it can't track iOS users. Merchants think campaigns are profitable when they're actually losing money.
                </p>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">AdWyse's Real ROAS</h4>
                    <p className="text-green-400 text-sm">Server-Side Tracking</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm">
                  We track orders on your Shopify server (not the customer's browser), so privacy restrictions don't affect us. You see real revenue from real orders matched to exact ad spend.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center">
              <p className="text-zinc-400">
                <span className="text-white font-semibold">How we calculate ROAS:</span> We pull your daily ad spend from Facebook/Google APIs. Every Shopify order gets matched to a campaign. ROAS = Total Revenue / Total Ad Spend per campaign. Simple, accurate, profitable.
              </p>
            </div>
          </div>

          {/* AI-Powered Insights */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">AI-Powered Insights</h3>
            <p className="text-zinc-400 mb-8">
              Most attribution tools just show you data. AdWyse uses Claude AI to tell you exactly what to do:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: AlertTriangle,
                  iconColor: "text-red-400",
                  bgColor: "bg-red-500/20",
                  title: "Warnings",
                  example: '"Campaign \'Spring Sale\' is losing $47/day with 0.3x ROAS"',
                  action: "Pause campaign immediately",
                  impact: "Save $1,410/month"
                },
                {
                  icon: TrendingUp,
                  iconColor: "text-green-400",
                  bgColor: "bg-green-500/20",
                  title: "Opportunities",
                  example: '"Campaign \'Google Shopping\' has 5.2x ROAS"',
                  action: "Increase budget from $500 to $800",
                  impact: "+$1,560/month profit"
                },
                {
                  icon: Lightbulb,
                  iconColor: "text-amber-400",
                  bgColor: "bg-amber-500/20",
                  title: "Recommendations",
                  example: '"TikTok ads convert 40% better on weekends"',
                  action: "Schedule ads Fri-Sun only",
                  impact: "1.4x better ROAS"
                }
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <h4 className="text-lg font-semibold">{item.title}</h4>
                  </div>
                  <p className="text-zinc-400 text-sm italic mb-4">{item.example}</p>
                  <div className="space-y-1 text-xs text-zinc-500">
                    <p><span className="text-zinc-400">Action:</span> {item.action}</p>
                    <p><span className="text-zinc-400">Impact:</span> {item.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Seamless Integration</h2>
            <p className="text-zinc-400 text-lg">Works with the platforms you already use</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Shopify", color: "bg-green-500", desc: "One-click connection. Webhooks configured automatically." },
              { name: "Facebook", color: "bg-blue-500", desc: "OAuth integration pulls spend data automatically." },
              { name: "Google", color: "bg-red-500", desc: "OAuth integration syncs campaigns daily." },
              { name: "TikTok", color: "bg-zinc-700", desc: "Coming soon - track TikTok ad performance." }
            ].map((platform, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-center hover:border-amber-500/30 transition-all"
              >
                <div className={`w-16 h-16 ${platform.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl font-bold text-white">{platform.name[0]}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{platform.name}</h3>
                <p className="text-zinc-400 text-sm">{platform.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Know Which Ads Make Money?
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
            7-day free trial · $99/month · No credit card required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
