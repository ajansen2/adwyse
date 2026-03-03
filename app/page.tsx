'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HeroSection from '@/components/ui/hero-section'
import {
  Target,
  Cpu,
  BarChart3,
  Zap,
  Link2,
  DollarSign,
  ArrowRight,
  Check
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

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose AdWyse?
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Stop guessing which ads work. Know exactly where your revenue comes from.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Accurate Attribution",
                description: "Track every order back to its original ad source using UTM parameters, FBCLID, and GCLID.",
                color: "amber"
              },
              {
                icon: Cpu,
                title: "AI-Powered Insights",
                description: "Claude AI analyzes your campaigns daily and tells you exactly what to pause, scale, or optimize.",
                color: "purple"
              },
              {
                icon: BarChart3,
                title: "Real ROAS Calculations",
                description: "Match ad spend from Facebook/Google APIs with actual Shopify orders to see true profit.",
                color: "green"
              },
              {
                icon: Zap,
                title: "Multi-Platform Tracking",
                description: "Track Facebook, Google, TikTok, and more - all in one unified dashboard.",
                color: "blue"
              },
              {
                icon: Link2,
                title: "Seamless Integration",
                description: "2-minute setup. Connect Shopify, authorize ad accounts. We handle everything automatically.",
                color: "pink"
              },
              {
                icon: DollarSign,
                title: "Save Thousands Monthly",
                description: "Most merchants waste 30%+ on bad campaigns. Typical savings: $1,500-3,000/month.",
                color: "emerald"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              From ad click to revenue tracking in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Install & Connect",
                description: "Install from Shopify App Store. Connect Facebook & Google Ads via OAuth. Takes 2 minutes."
              },
              {
                step: "02",
                title: "Track Orders",
                description: "We capture UTM parameters and click IDs. Every order gets automatically attributed."
              },
              {
                step: "03",
                title: "Sync Ad Spend",
                description: "Daily ad spend from APIs matched with orders to calculate true ROAS per campaign."
              },
              {
                step: "04",
                title: "Get AI Insights",
                description: "Claude AI generates actionable insights: pause, scale, or optimize each campaign."
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-bold text-amber-500/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-zinc-400 text-lg">
              One price, unlimited tracking. No setup fees, no hidden costs.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent p-8 md:p-12">
              <div className="absolute top-6 right-6 px-3 py-1 bg-amber-500 rounded-full text-xs font-bold">
                BEST VALUE
              </div>

              <div className="mb-8">
                <div className="text-amber-400 font-semibold mb-2">Pro Plan</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="text-zinc-500 mt-2">Billed monthly · Cancel anytime</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited order tracking",
                  "Facebook Ads integration",
                  "Google Ads integration",
                  "TikTok Ads integration",
                  "AI-powered insights",
                  "Real ROAS calculations",
                  "Campaign comparison",
                  "Revenue attribution",
                  "7-day free trial"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    {feature}
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

            {/* ROI Calculator */}
            <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 text-center">
              <h3 className="font-semibold mb-2">Quick ROI Calculator</h3>
              <p className="text-zinc-400 text-sm mb-4">
                If you spend $10K/month on ads and waste just 15%:
              </p>
              <div className="text-3xl font-bold text-amber-400 mb-2">$1,500/month saved</div>
              <p className="text-zinc-400">
                That&apos;s <span className="text-amber-400 font-semibold">15x ROI</span> on your $99 investment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
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
            2-minute setup · $99/month · 7-day free trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="AdWyse" className="w-8 h-8" />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <a href="mailto:adam@adwyse.ca" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="text-center text-zinc-600 text-sm mt-8">
            © {new Date().getFullYear()} AdWyse - AI-Powered Ad Attribution for Shopify
          </div>
        </div>
      </footer>
    </div>
  )
}
