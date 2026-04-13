"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "1 ad account",
      "100 orders/month",
      "30 days data history",
      "Basic ROAS dashboard",
      "Conversion funnel",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For scaling stores",
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      "Everything in Free, plus:",
      "Unlimited ad accounts & orders",
      "AI Assistant — chat with your data",
      "Competitor Spy (live ad scraping)",
      "AI Creative Score (rank 0-100)",
      "Cohort retention analysis",
      "New vs Repeat ROAS",
      "Predictive Budget Optimizer",
      "Multi-touch attribution",
      "Server-side Conversions API",
      "Slack daily digest",
      "Email reports & alerts",
    ],
  },
];

function PricingCard() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [storeCount, setStoreCount] = useState(1);

  const handleUpgrade = () => {
    // Get shop param from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');

    if (selectedPlan === "free") {
      // Already on free, go to dashboard
      window.location.href = shop ? `/dashboard?shop=${shop}` : '/dashboard';
      return;
    }

    // Trigger Shopify billing flow
    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);
    params.set('plan', 'pro');
    params.set('billing_cycle', billingCycle);
    params.set('stores', storeCount.toString());
    window.location.href = `/api/billing/subscribe?${params.toString()}`;
  };

  return (
    <div className="w-full max-w-[450px] flex flex-col gap-6 p-5 px-4 sm:p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          Select a Plan
        </h2>

        {/* Billing Toggle */}
        <div className="bg-white/5 p-1 h-10 w-full rounded-xl ring-1 ring-white/10 flex">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`flex-1 h-full rounded-lg text-sm font-medium relative transition-colors duration-200 ${
              billingCycle === "monthly"
                ? "text-white bg-white/10 shadow-sm ring-1 ring-white/10"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`flex-1 h-full rounded-lg text-sm font-medium relative transition-colors duration-200 flex items-center justify-center gap-2 ${
              billingCycle === "yearly"
                ? "text-white bg-white/10 shadow-sm ring-1 ring-white/10"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Yearly
            <span className="bg-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white uppercase tracking-tight">
              20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="flex flex-col gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className="relative cursor-pointer"
            >
              <div
                className={`relative rounded-xl border transition-colors duration-200 ${
                  isSelected
                    ? "border-orange-500 border-2 bg-white/5"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                }`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* Radio button */}
                      <div className="mt-1 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected ? "border-orange-500" : "border-white/20"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-orange-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white leading-tight">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-white/50">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-medium text-white">
                        US${price}.00
                      </div>
                      <div className="text-xs text-white/40">
                        /{billingCycle === "monthly" ? "month" : "month, billed yearly"}
                      </div>
                    </div>
                  </div>

                  {/* Expanded features */}
                  {isSelected && (
                    <div className="mt-6 flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        {plan.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 text-sm text-white/80"
                          >
                            <Check className="w-4 h-4 text-orange-400 shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Stores counter (only for Pro) */}
                      {plan.id === "pro" && (
                        <>
                          <div className="h-px bg-white/10" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/5 shrink-0 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">
                                  Stores
                                </span>
                                <span className="text-xs text-white/40">
                                  {storeCount} store{storeCount > 1 ? 's' : ''} included
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStoreCount(Math.max(1, storeCount - 1));
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-white/50 hover:text-white active:scale-95"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm w-4 text-center tabular-nums text-white/80">
                                {storeCount}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStoreCount(storeCount + 1);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-white/50 hover:text-white active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total & CTA */}
      <div className="flex flex-col gap-3">
        {selectedPlan === "pro" && storeCount > 1 && (
          <div className="flex justify-between items-center text-sm text-white/60 px-1">
            <span>Total ({storeCount} stores)</span>
            <span className="text-white font-medium">
              US${(billingCycle === "monthly" ? 99 : 79) * storeCount}.00/{billingCycle === "monthly" ? "mo" : "mo"}
            </span>
          </div>
        )}
        <button
          onClick={handleUpgrade}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98]"
        >
          {selectedPlan === "free" ? "Continue with Free" : "Upgrade to Pro"}
        </button>
        <p className="text-center text-white/30 text-xs">
          {selectedPlan === "pro" ? "7-day free trial · Cancel anytime from Shopify" : "No credit card required"}
        </p>
      </div>
    </div>
  );
}

export default PricingCard;
