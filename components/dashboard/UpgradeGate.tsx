'use client';

import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { navigateInApp } from '@/lib/shopify-app-bridge';

interface UpgradeGateProps {
  feature: string;
  description: string;
  bullets?: string[];
}

/**
 * Drop-in "upgrade required" screen for Pro-only pages.
 * Shows free users what they're missing + an upgrade button.
 */
export function UpgradeGate({ feature, description, bullets }: UpgradeGateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-3xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
          PRO FEATURE
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">{feature}</h1>
        <p className="text-white/70 text-lg mb-6">{description}</p>

        {bullets && bullets.length > 0 && (
          <ul className="text-left space-y-2 mb-8 max-w-md mx-auto">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => navigateInApp('/pricing')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-lg transition shadow-lg shadow-orange-500/30"
        >
          Upgrade to Pro — $99/mo
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-white/40 text-xs mt-4">
          7-day free trial · Cancel anytime · No credit card to start
        </p>
      </div>
    </div>
  );
}
