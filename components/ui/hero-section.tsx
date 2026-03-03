"use client";

import { useState, Suspense, lazy } from "react";
import {
  ArrowRight,
  Play,
  Target,
  TrendingUp,
  Zap,
  BarChart3,
  ShoppingBag,
  DollarSign
} from "lucide-react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

// Platform logos as simple styled divs
const PLATFORMS = [
  { name: "Facebook Ads", color: "#1877F2" },
  { name: "Google Ads", color: "#4285F4" },
  { name: "TikTok Ads", color: "#000000" },
  { name: "Shopify", color: "#96BF48" },
  { name: "Instagram", color: "#E4405F" },
  { name: "Pinterest", color: "#BD081C" },
];

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-white sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium sm:text-xs">{label}</span>
  </div>
);

export default function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full min-h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Dithering Background */}
      <Suspense fallback={<div className="absolute inset-0 bg-zinc-900" />}>
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-30"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Dithering
            colorBack="#00000000"
            colorFront="#f59e0b"
            shape="warp"
            type="4x4"
            speed={isHovered ? 0.6 : 0.15}
            className="size-full"
            minPixelRatio={1}
          />
        </div>
      </Suspense>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-transparent to-zinc-950 z-[1]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 md:pt-40 md:pb-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">

          {/* Left Column - Main Content */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-8">

            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 backdrop-blur-md transition-colors hover:bg-amber-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  AI-Powered Attribution for Shopify
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in delay-200 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Know Which Ads
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Actually Make
              </span>
              <br />
              You Money
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300 max-w-xl text-lg text-zinc-400 leading-relaxed">
              Facebook and Google over-report conversions by up to 70%. AdWyse tracks every Shopify order back to its true source with AI-powered insights.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-4 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 hover:border-white/20"
              >
                <Play className="w-4 h-4 fill-current" />
                See How It Works
              </button>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in delay-500 flex items-center gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                2-minute setup
              </span>
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                $99/month flat
              </span>
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-500" />
                7-day free trial
              </span>
            </div>
          </div>

          {/* Right Column - Stats Card */}
          <div className="lg:col-span-5 space-y-6 lg:mt-12">

            {/* Main Stats Card */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 ring-1 ring-amber-500/30">
                    <Target className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-white">5.2x</div>
                    <div className="text-sm text-zinc-400">Average ROAS Improvement</div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Attribution Accuracy</span>
                    <span className="text-white font-medium">98%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/50">
                    <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-6" />

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="70%" label="Over-reporting" />
                  <StatItem value="$2.4B" label="Saved yearly" />
                  <StatItem value="<2min" label="Setup" />
                </div>

                {/* Tags */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE TRACKING
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <BarChart3 className="w-3 h-3 text-amber-500" />
                    AI INSIGHTS
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium tracking-wide text-zinc-300">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    REAL ROAS
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Marquee */}
            <div className="animate-fade-in delay-500 relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-6 backdrop-blur-xl">
              <h3 className="mb-4 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Integrates With</h3>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)"
                }}
              >
                <div className="animate-marquee flex gap-8 whitespace-nowrap px-4">
                  {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((platform, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 opacity-60 transition-all hover:opacity-100 cursor-default"
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {platform.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
