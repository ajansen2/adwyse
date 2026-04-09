'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import HeroSection from '@/components/ui/hero-section'
import { Footer } from '@/components/ui/footer'
import {
  Target,
  Cpu,
  BarChart3,
  Zap,
  Link2,
  DollarSign,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Clock,
  MousePointerClick,
  Store,
  Calculator,
  Sparkles,
  ChevronRight,
  Users,
  LineChart,
  Layers,
  HelpCircle,
  BadgeCheck
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  // Redirect to dashboard if loaded as embedded app
  useEffect(() => {
    const isEmbedded = window.self !== window.top
    if (isEmbedded) {
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      if (shop) {
        window.location.href = `/dashboard?${urlParams.toString()}`
      } else {
        window.location.href = '/dashboard'
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="AdWyse" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-sm text-zinc-400 hover:text-white transition">
                About
              </Link>
              <a href="#features" className="text-sm text-zinc-400 hover:text-white transition">
                Features
              </a>
              <Link href="/how-it-works" className="text-sm text-zinc-400 hover:text-white transition">
                How It Works
              </Link>
              <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition">
                Pricing
              </a>
            </div>
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition"
            >
              Install App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Trust Bar */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm">Shopify Verified</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <BadgeCheck className="w-5 h-5 text-blue-400" />
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-sm">500+ Merchants</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">$2M+ Revenue Tracked</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
                The Problem
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              You're Wasting Money on Ads{" "}
              <span className="text-red-400">Right Now</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              iOS 14.5 broke Facebook tracking. Google's privacy changes made attribution unreliable.
              You're flying blind—and it's costing you thousands.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: "70%",
                label: "of conversions",
                title: "Go Untracked",
                description: "Privacy changes mean Facebook and Google can only see a fraction of your actual sales. You're making decisions with incomplete data.",
                icon: X,
                color: "red"
              },
              {
                stat: "$2.4B",
                label: "wasted annually",
                title: "On Bad Campaigns",
                description: "Shopify merchants waste billions on ads that don't convert because they can't see which campaigns actually drive revenue.",
                icon: DollarSign,
                color: "red"
              },
              {
                stat: "30%+",
                label: "of ad spend",
                title: "Is Thrown Away",
                description: "Without accurate attribution, you're probably spending thousands on campaigns that lose money. Most merchants have no idea.",
                icon: TrendingUp,
                color: "red"
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent p-8"
              >
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-red-400" />
                </div>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-red-400">{item.stat}</span>
                  <span className="text-zinc-500 text-sm ml-2">{item.label}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 mb-6">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-green-300">
                The Solution
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Server-Side Attribution That{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Actually Works
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              AdWyse tracks conversions on your Shopify server—not in the browser. Privacy restrictions don't affect us.
              You see real data, make smart decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Before/After Comparison */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4">
                <h3 className="font-semibold text-red-400 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Without AdWyse
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  "Facebook reports 50 conversions, Shopify shows 180 orders",
                  "ROAS looks great but your bank account disagrees",
                  "Can't tell which campaigns actually make money",
                  "Scaling campaigns that secretly lose money",
                  "No idea why certain weeks perform better"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-400" />
                    </div>
                    <span className="text-zinc-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-4">
                <h3 className="font-semibold text-green-400 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  With AdWyse
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  "Every Shopify order matched to the exact ad that drove it",
                  "Real ROAS calculated from actual revenue and spend",
                  "Dashboard shows which campaigns print money",
                  "AI tells you exactly what to pause and scale",
                  "Daily insights explain what's working and why"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-zinc-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Features
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Maximize ROAS
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Stop guessing which ads work. Know exactly where your revenue comes from.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Multi-Source Attribution",
                description: "Track orders using UTM parameters, FBCLID, GCLID, and landing page referrers. Every sale matched to the exact ad.",
                features: ["First-click attribution", "Last-click attribution", "UTM parameter tracking", "Platform click ID matching"]
              },
              {
                icon: Cpu,
                title: "AI-Powered Insights",
                description: "Claude AI analyzes your campaigns daily and generates specific, actionable recommendations.",
                features: ["Daily campaign analysis", "Budget recommendations", "Performance alerts", "Trend identification"]
              },
              {
                icon: BarChart3,
                title: "Real ROAS Calculations",
                description: "We pull actual spend from Facebook/Google APIs and match with Shopify revenue. True profit visibility.",
                features: ["Automatic spend sync", "Real-time calculations", "Campaign-level ROAS", "Ad set breakdown"]
              },
              {
                icon: Zap,
                title: "Multi-Platform Support",
                description: "Track Facebook, Google, TikTok, and more. All your ad data in one unified dashboard.",
                features: ["Facebook Ads", "Google Ads", "TikTok Ads (coming)", "Custom UTM sources"]
              },
              {
                icon: Link2,
                title: "2-Minute Setup",
                description: "Install from Shopify App Store, authorize your ad accounts via OAuth, and you're done.",
                features: ["One-click Shopify install", "OAuth integration", "Automatic webhooks", "No code required"]
              },
              {
                icon: LineChart,
                title: "Campaign Comparison",
                description: "Compare performance across platforms, time periods, and campaign types. Find your winners.",
                features: ["Side-by-side comparison", "Date range analysis", "Platform benchmarks", "Export to CSV"]
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-zinc-500">
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                How It Works
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From Install to Insights in{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                2 Minutes
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              No developers needed. No complex setup. Just connect and start tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Store,
                title: "Install from Shopify",
                description: "Click install from the Shopify App Store. Automatic OAuth handles permissions.",
                highlight: "One click"
              },
              {
                step: "02",
                icon: Link2,
                title: "Connect Ad Accounts",
                description: "Authorize Facebook and Google Ads. We securely sync your spend data via OAuth.",
                highlight: "30 seconds"
              },
              {
                step: "03",
                icon: MousePointerClick,
                title: "Track Automatically",
                description: "Every order is captured via Shopify webhooks. UTM and click IDs matched automatically.",
                highlight: "Zero effort"
              },
              {
                step: "04",
                icon: Sparkles,
                title: "Get AI Insights",
                description: "Claude AI analyzes your data daily. See exactly what to pause, scale, or optimize.",
                highlight: "Daily updates"
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative group"
              >
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 h-full hover:border-amber-500/30 transition-all">
                  <div className="absolute top-4 right-4 text-5xl font-bold text-amber-500/10">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 mb-4">
                    <span className="text-xs font-medium text-amber-400">{item.highlight}</span>
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

      {/* Competitor Comparison */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Compare
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Merchants Choose{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Enterprise-level attribution at a fraction of the cost
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-5 text-left text-sm font-semibold text-zinc-300">Feature</th>
                  <th className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 font-bold">AdWyse Free</span>
                      <span className="text-xs text-zinc-500 mt-1">$0/mo</span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-amber-400 font-bold">AdWyse Pro</span>
                      <span className="text-xs text-zinc-500 mt-1">$99/mo</span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-500 font-semibold">Triple Whale</span>
                      <span className="text-xs text-zinc-600 mt-1">$129-599/mo</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { feature: "Order Attribution", free: true, pro: true, tw: true },
                  { feature: "Ad Accounts", free: "1", pro: "Unlimited", tw: "Tiered" },
                  { feature: "Orders/Month", free: "100", pro: "Unlimited", tw: "Tiered" },
                  { feature: "AI-Powered Insights", free: false, pro: true, tw: "Limited" },
                  { feature: "Email Reports", free: false, pro: true, tw: true },
                  { feature: "Setup Time", free: "2 min", pro: "2 min", tw: "30+ min" },
                  { feature: "Price", free: "Free forever", pro: "$99/mo", tw: "$129-599/mo" }
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                    <td className="px-6 py-4 text-sm text-zinc-400">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.free === true ? (
                        <Check className="w-5 h-5 text-green-400 mx-auto" />
                      ) : row.free === false ? (
                        <X className="w-5 h-5 text-zinc-600 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-green-400">{row.free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.pro === true ? (
                        <Check className="w-5 h-5 text-green-400 mx-auto" />
                      ) : row.pro === false ? (
                        <X className="w-5 h-5 text-red-400 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-amber-400">{row.pro}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.tw === true ? (
                        <Check className="w-5 h-5 text-zinc-600 mx-auto" />
                      ) : row.tw === false ? (
                        <X className="w-5 h-5 text-zinc-600 mx-auto" />
                      ) : (
                        <span className="text-sm text-zinc-500">{row.tw}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Save $30-500/month compared to alternatives while getting AI-powered insights they don't offer.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Pricing
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Start Free,{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Scale When Ready
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Get started free. Upgrade to Pro for unlimited tracking and AI insights.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

                <ul className="space-y-3 mb-8">
                  {[
                    { text: "1 ad account", included: true },
                    { text: "100 orders/month", included: true },
                    { text: "30 days data history", included: true },
                    { text: "ROAS dashboard", included: true },
                    { text: "Conversion funnel", included: true },
                    { text: "AI Assistant", included: false },
                    { text: "Competitor Spy", included: false },
                    { text: "Cohorts & NC-ROAS", included: false },
                    { text: "Email reports & alerts", included: false },
                  ].map((feature, i) => (
                    <li key={i} className={`flex items-center gap-3 ${feature.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.included ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                        {feature.included ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <X className="w-3 h-3 text-zinc-600" />
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

                <ul className="space-y-3 mb-8">
                  {[
                    { text: "Everything in Free, plus:", highlight: false },
                    { text: "Unlimited ad accounts & orders", highlight: false },
                    { text: "AI Assistant — chat with your data", highlight: true },
                    { text: "Competitor Spy (live ad scraping)", highlight: true },
                    { text: "AI Creative Score", highlight: true },
                    { text: "Cohort retention analysis", highlight: true },
                    { text: "New vs Repeat ROAS", highlight: true },
                    { text: "Predictive Budget Optimizer", highlight: true },
                    { text: "Multi-touch attribution", highlight: false },
                    { text: "Server-side Conversions API", highlight: true },
                    { text: "Slack daily digest", highlight: false },
                    { text: "Email reports & alerts", highlight: false },
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
                  No credit card required
                </p>
              </div>
            </div>

            {/* ROI Calculator */}
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex-1">
                <h3 className="text-lg font-semibold mb-4">Calculate Your ROI</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  If you spend $10,000/month on ads and waste 15%:
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span className="text-zinc-400 text-sm">Monthly waste</span>
                    <span className="text-xl font-bold text-red-400">$1,500</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800">
                    <span className="text-zinc-400 text-sm">AdWyse cost</span>
                    <span className="text-xl font-bold text-white">$99</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="text-zinc-400 text-sm">Your ROI</span>
                    <span className="text-xl font-bold text-green-400">15x</span>
                  </div>
                </div>

                <p className="text-zinc-500 text-xs">
                  Most merchants save <span className="text-amber-400 font-semibold">$1,500-3,000/mo</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Money-Back Guarantee</h4>
                    <p className="text-zinc-400 text-xs">
                      30-day refund if you don't see value.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                FAQ
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does AdWyse track conversions differently than Facebook?",
                a: "Facebook tracks conversions in the browser, which gets blocked by iOS privacy settings. AdWyse tracks on your Shopify server using webhooks—we see every order regardless of browser settings. We match orders to ads using UTM parameters and click IDs (FBCLID, GCLID) that we capture when customers land on your site."
              },
              {
                q: "How accurate is the attribution?",
                a: "We capture 95%+ of attributed orders. The only orders we can't attribute are those where customers clear their cookies between clicking an ad and purchasing, or type your URL directly. For everything else, we match the exact ad that drove the sale."
              },
              {
                q: "What makes the AI insights different from other tools?",
                a: "Most tools just show you dashboards. AdWyse uses Claude AI to analyze your specific data daily and generate actionable recommendations. Not generic tips—specific actions like 'Pause Campaign X, it's lost $247 this week' or 'Scale Ad Set Y, it has 4.2x ROAS and room to grow.'"
              },
              {
                q: "How long does setup actually take?",
                a: "2-3 minutes. Install from Shopify App Store (one click), authorize Facebook/Google via OAuth (30 seconds each), and you're done. No code, no developers, no pixel configuration. Orders start tracking immediately."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, cancel anytime from your Shopify admin with one click. No contracts, no cancellation fees. Your data stays accessible until the end of your billing period."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-zinc-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-amber-500/5 to-transparent p-12 md:p-16 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Stop Wasting Money on Ads That Don't Convert
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
                Join 500+ Shopify merchants who track every dollar with AI-powered attribution.
                See exactly which ads make money—and which ones to cut.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-amber-500/25 transition"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-white/5 transition"
                >
                  See How It Works
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  7-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  2-minute setup
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
