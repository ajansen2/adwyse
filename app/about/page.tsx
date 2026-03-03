'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Navigation } from '@/components/ui/navigation';
import { Footer } from '@/components/ui/footer';
import { ArrowRight, Target, BarChart3, Cpu, Check } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Our Story
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                AdWyse
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              AI-powered ad attribution that helps Shopify merchants know exactly which ads make them money
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            The Problem We Solve
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stat: "70%",
                title: "Broken Tracking",
                description: "Privacy changes broke Facebook and Google ad tracking. Merchants are flying blind, not knowing which ads actually work."
              },
              {
                stat: "$2.4B",
                title: "Wasted Ad Spend",
                description: "Shopify merchants waste billions annually on ads that don't convert because they can't track attribution accurately."
              },
              {
                stat: "$599",
                title: "Expensive Solutions",
                description: "Triple Whale and Polar Analytics charge $129-599/month for attribution tools that are too complex and overpriced."
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-4">
                  {item.stat}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2">
                <div className="bg-zinc-900 rounded-2xl p-12 text-center">
                  <div className="w-40 h-40 rounded-full mx-auto mb-6 overflow-hidden border-4 border-amber-500/30">
                    <Image
                      src="/profile2.png"
                      alt="Adam - Founder"
                      width={160}
                      height={160}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Adam</h3>
                  <p className="text-amber-400 font-medium">Founder</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why I Built AdWyse
              </h2>
              <div className="space-y-4 text-zinc-400">
                <p>
                  Hi, I&apos;m Adam. I built AdWyse to solve the biggest problem in e-commerce advertising: broken attribution tracking.
                </p>
                <p>
                  Facebook and Google&apos;s conversion tracking became unreliable. Merchants started spending thousands on ads without knowing which ones actually drove sales. I watched businesses waste 30-40% of their ad budgets on campaigns that didn&apos;t work.
                </p>
                <p>
                  Existing solutions like Triple Whale ($129-599/month) and Polar Analytics ($199-599/month) are too expensive and complex. Most Shopify merchants spending $1k-50k/month on ads can&apos;t justify those prices.
                </p>
                <p>
                  AdWyse tracks every order back to its source using UTM parameters and platform click IDs. But we don&apos;t just show data - Claude AI analyzes it and tells you exactly what to do. All for $99/month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How AdWyse Works
            </h2>
            <p className="text-zinc-400 text-lg">
              Built with cutting-edge attribution technology and AI-powered insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Accurate Attribution",
                description: "Track orders using UTM parameters, Facebook Click IDs (FBCLID), and Google Click IDs (GCLID). Every sale gets matched to the exact ad."
              },
              {
                icon: BarChart3,
                title: "Real ROAS Calculations",
                description: "We pull ad spend data from Facebook and Google APIs, match it with your Shopify orders, and calculate true Return on Ad Spend."
              },
              {
                icon: Cpu,
                title: "AI-Powered Insights",
                description: "Claude AI analyzes your campaigns daily and generates actionable recommendations. Not just data - specific actions to take."
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 hover:border-amber-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
                Simple Pricing, Powerful Results
              </h2>
              <p className="text-zinc-400 text-center mb-8 max-w-2xl mx-auto">
                One price, unlimited tracking. Get the attribution insights you need without breaking the bank.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {[
                  {
                    title: "$99/Month Flat Fee",
                    description: "Compare to Triple Whale ($129-599/month) or Polar ($199-599/month)."
                  },
                  {
                    title: "2-Minute Setup",
                    description: "Install from Shopify App Store. Connect via OAuth. Start tracking immediately."
                  },
                  {
                    title: "7-Day Free Trial",
                    description: "Try it risk-free. No credit card required."
                  },
                  {
                    title: "15x+ ROI Typical",
                    description: "Most merchants save $1,500-3,000/month by cutting bad campaigns."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-zinc-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-semibold text-lg hover:shadow-lg hover:shadow-amber-500/25 transition"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-zinc-500 text-sm mt-4">
                  7-day free trial · No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
