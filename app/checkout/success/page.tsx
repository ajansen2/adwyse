// app/checkout/success/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      router.push('/');
      return;
    }

    // Verify session (optional: call your backend to get session details)
    const verifySession = async () => {
      try {
        // You can add an API route to verify the session if needed
        // For now, we'll just show success
        setLoading(false);
      } catch (error) {
        console.error('Error verifying session:', error);
        setLoading(false);
      }
    };

    verifySession();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Verifying your payment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .gradient-text {
          background: linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient 3s ease infinite;
        }

        .glow-button {
          transition: all 0.3s ease;
        }

        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
        }

        .pulse-icon {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-3xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-600/20 to-blue-600/20 border-4 border-green-500 pulse-icon mb-8">
            <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            Payment Successful! <span className="gradient-text">🎉</span>
          </h1>
          <p className="text-xl text-white/70">
            Welcome to ARGORA DEALS Professional
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Your Subscription is Active</h2>

          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Payment Confirmed</h3>
                <p className="text-white/60 text-sm">
                  Your subscription is now active. You have full access to all features.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Full Access Unlocked</h3>
                <p className="text-white/60 text-sm">
                  Unlimited property analyses, AI insights, real-time market data, and portfolio tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Email Confirmation Sent</h3>
                <p className="text-white/60 text-sm">
                  Check your inbox for payment receipt and getting started guide.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">Your Subscription</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70">Plan:</span>
              <span className="text-white font-semibold">Professional</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70">Billing:</span>
              <span className="text-white font-semibold">$1,000/month</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Status:</span>
              <span className="text-green-400 font-semibold">Active</span>
            </div>
            <p className="text-white/40 text-xs mt-4">
              💡 Cancel anytime - prorated refunds available
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/onboarding')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center px-8 py-4 rounded-full font-semibold text-lg glow-button"
            >
              Start Analyzing Properties →
            </button>
            <button
              onClick={() => router.push('/account/billing')}
              className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-white rounded-full font-semibold transition-colors"
            >
              View Billing
            </button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-white font-semibold">Need Help Getting Started?</h3>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Our support team is here to help you make the most of ARGORA DEALS.
          </p>
          <div className="flex gap-4">
            <a
              href="mailto:support@argora.ai"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              <span>support@argora.ai</span>
            </a>
            <a
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              <span>Documentation</span>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-white/40 text-sm">
          <p>Thank you for choosing ARGORA DEALS</p>
          <p className="mt-2">Let's find your next profitable investment together</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
