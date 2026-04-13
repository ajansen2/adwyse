"use client";

import {
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const plans = [
  {
    id: "free",
    name: "Free",
    description: "getting started",
    price: 0,
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
    description: "scaling stores",
    price: 99.99,
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

const TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

function PricingCard() {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const handleUpgrade = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');

    if (selectedPlan === "free") {
      window.location.href = shop ? `/dashboard?shop=${shop}` : '/dashboard';
      return;
    }

    const params = new URLSearchParams();
    if (shop) params.set('shop', shop);
    params.set('plan', 'pro');
    window.location.href = `/api/billing/subscribe?${params.toString()}`;
  };

  return (
    <div className="w-full max-w-[450px] flex flex-col gap-6 p-5 px-4 sm:p-6 rounded-4xl sm:rounded-2xl border border-border bg-background shadow-sm transition-colors duration-300 not-prose">
      <div className="flex flex-col gap-4 mb-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Select a Plan
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className="relative cursor-pointer"
            >
              <div
                className={`relative rounded-xl bg-card border border-foreground/10 transition-colors duration-300 ${
                  isSelected ? "z-10 border-primary border-2" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isSelected
                              ? "border-primary"
                              : "border-muted-foreground/15"
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="w-4 h-4 rounded-full bg-primary"
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25,
                                  duration: 0.2,
                                }}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-foreground leading-tight">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-muted-foreground lowercase">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-medium text-foreground">
                        US${plan.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground/60">
                        /month
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.4,
                          ease: [0.32, 0.72, 0, 1],
                        }}
                        className="overflow-hidden w-full"
                      >
                        <div className="pt-6 flex flex-col gap-6">
                          <div className="flex flex-col gap-3.5">
                            {plan.features.map((feature, idx) => (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: idx * 0.05,
                                  duration: 0.3,
                                }}
                                key={idx}
                                className="flex items-center gap-3 text-sm text-foreground/80 "
                              >
                                <HugeiconsIcon
                                  icon={Tick02Icon}
                                  size={16}
                                  className="text-primary"
                                />
                                {feature}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="flex flex-col gap-3">
        <motion.button
          onClick={handleUpgrade}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25"
        >
          {selectedPlan === "free" ? "Continue with Free" : "Upgrade to Pro"}
        </motion.button>
        <p className="text-center text-muted-foreground/60 text-xs">
          {selectedPlan === "pro" ? "7-day free trial · Cancel anytime from Shopify" : "No credit card required"}
        </p>
      </div>
    </div>
  );
}

export default PricingCard;
