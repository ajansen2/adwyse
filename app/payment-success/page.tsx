// app/payment-success/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Get session_id from URL params (Stripe redirect)
    const session = searchParams.get('session_id');
    if (session) {
      setSessionId(session);
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes checkmark {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }

        @keyframes pulse {
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

        .success-checkmark {
          animation: pulse 2s ease-in-out infinite;
        }

        .checkmark-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: checkmark 0.5s ease-in-out 0.3s forwards;
        }
      `}</style>

      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-4 border-green-500 success-checkmark mb-6">
            <svg className="w-16 h-16" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" stroke="rgb(34, 197, 94)" strokeWidth="2"/>
              <path
                className="checkmark-path"
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="3"
                strokeLinecap="round"
                d="M14 27 l7 7 l16 -16"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            Payment <span className="gradient-text">Successful!</span>
          </h1>
          <p className="text-xl text-white/70 mb-2">
            Welcome to ARGORA DEALS
          </p>
          <div className="text-3xl font-bold text-green-400 mb-2">
            $5,000.00 Paid
          </div>
          <p className="text-white/50">
            Transaction ID: {sessionId || '••••••••••••'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">What Happens Next?</h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Check Your Email</h3>
                <p className="text-white/60 text-sm">
                  We've sent your login credentials and welcome guide to your email. Check your inbox (and spam folder just in case).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Login to Your Dashboard</h3>
                <p className="text-white/60 text-sm">
                  Use the credentials from your email to login and access your personalized real estate investment dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Add Your First Property</h3>
                <p className="text-white/60 text-sm">
                  Start analyzing deals by adding your first property. Get instant AI-powered insights, financial metrics, and market data.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-3">What's Included in Your Plan:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-white/70">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited property analyses</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time market data (ATTOM & RentCast)</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI-powered deal insights and recommendations</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Portfolio tracking and performance monitoring</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority support from our team</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center px-8 py-4 rounded-full font-semibold text-lg glow-button"
          >
            Go to Login ({countdown}s) →
          </button>
          <p className="text-center text-white/50 text-sm mt-3">
            Redirecting automatically in {countdown} seconds...
          </p>
        </div>

        {/* Receipt Info */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-3 text-white/60 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="mb-2">
                <strong className="text-white">One-time setup fee:</strong> You've paid $5,000 to access the platform. A receipt has been sent to your email.
              </p>
              <p className="mb-2 text-white/70">
                After 30 days, we'll email you about our optional $1,000/month subscription to continue using the platform with ongoing updates and support.
              </p>
              <p>
                Need help? Contact us at <a href="mailto:support@argora.ai" className="text-purple-400 hover:text-purple-300 underline">support@argora.ai</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
