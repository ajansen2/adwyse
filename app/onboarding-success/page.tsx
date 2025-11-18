// app/onboarding-success/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function OnboardingSuccessContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOnboardingComplete = async () => {
      try {
        // Get from URL params first (most reliable)
        const emailParam = searchParams.get('email');
        const subdomainParam = searchParams.get('subdomain');
        const fullNameParam = searchParams.get('fullName');

        // Get from localStorage as fallback
        const storedEmail = localStorage.getItem('user_email');
        const storedSubdomain = localStorage.getItem('dashboard_subdomain');
        const storedFullName = localStorage.getItem('user_full_name');

        // Set email
        const finalEmail = emailParam || storedEmail || '';
        setEmail(finalEmail);

        // Set dashboard URL
        const subdomain = subdomainParam || storedSubdomain || 'demo';
        const finalUrl = `https://deals.argora.ai/client/${subdomain}`;
        setDashboardUrl(finalUrl);

        // Validate email
        if (!finalEmail || finalEmail === 'your-email@example.com') {
          setStatus('error');
          setErrorMessage('No valid email provided. Please complete the onboarding form.');
          return;
        }

        console.log('Initiating checkout for:', finalEmail);
        setStatus('redirecting');

        // Call checkout API
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: finalEmail,
            subdomain: subdomain,
            fullName: fullNameParam || storedFullName || 'User',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        if (data.url) {
          // Send welcome email in background (don't wait for it)
          fetch('/api/emails/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: finalEmail,
              dashboardUrl: finalUrl,
            }),
          }).catch(err => console.error('Failed to send welcome email:', err));

          // Redirect to Stripe checkout
          console.log('Redirecting to Stripe:', data.url);
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned from API');
        }
      } catch (error) {
        console.error('Error in onboarding flow:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      }
    };

    // Automatically trigger checkout
    handleOnboardingComplete();
  }, [searchParams]);

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

        .floating {
          animation: float 6s ease-in-out infinite;
        }

        .pulse-icon {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-3xl w-full">
        {/* Status Display */}
        {status === 'error' ? (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-600/20 border-4 border-red-500 mb-8">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-xl text-white/70 mb-8">
              {errorMessage}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold glow-button"
              >
                Back to Onboarding
              </button>
              <a
                href="mailto:support@argora.ai"
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-full text-white font-semibold transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-4 border-purple-500 pulse-icon mb-8">
              <svg className="w-16 h-16 text-purple-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              Almost there! <span className="gradient-text">✨</span>
            </h1>
            <p className="text-xl text-white/70">
              {status === 'loading' ? 'Preparing your checkout...' : 'Redirecting you to checkout...'}
            </p>
            {email && (
              <p className="text-sm text-white/50 mt-4">
                Setting up for: {email}
              </p>
            )}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Complete Your Subscription</h2>
          <p className="text-white/70 text-center mb-8">
            Please wait while we redirect you to our secure checkout page...
          </p>

          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Dashboard Created</h3>
                <p className="text-white/60 text-sm">
                  Your personalized dashboard has been set up with your preferred settings and investment profile.
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
                <h3 className="text-white font-semibold mb-1">Data Sources Connected</h3>
                <p className="text-white/60 text-sm">
                  We've connected ATTOM Data, RentCast, and Claude AI to power your real-time market intelligence.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 pulse-icon">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Email Sent</h3>
                <p className="text-white/60 text-sm">
                  We're sending your unique dashboard access link to <span className="text-purple-400">{email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard URL Box */}
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <div className="text-white/60 mb-2 text-sm">Your Dashboard URL:</div>
            <div className="flex items-center justify-between gap-4">
              <code className="text-purple-400 text-lg font-mono break-all">{dashboardUrl}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dashboardUrl);
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm flex-shrink-0 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-white/40 text-xs mt-3">
              💡 Bookmark this URL for quick access to your dashboard
            </p>
          </div>

          {/* Email Check Notice */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-white/80 text-sm">
                <p className="font-semibold mb-2">Check Your Email</p>
                <p>We've sent a welcome email to <span className="text-blue-400">{email}</span> with:</p>
                <ul className="mt-2 space-y-1 ml-4 list-disc text-white/60">
                  <li>Your unique dashboard access link</li>
                  <li>Quick start guide</li>
                  <li>Video tutorials</li>
                  <li>Support contact information</li>
                </ul>
                <p className="mt-3 text-white/60">
                  Don't see it? Check your spam folder or <a href="mailto:support@argora.ai" className="text-purple-400 underline">contact support</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3 mb-6">
            <h3 className="text-white font-semibold mb-3">Quick Start Guide:</h3>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex-shrink-0">1</span>
              <span>Click the button below to access your dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex-shrink-0">2</span>
              <span>Add your first property for analysis</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex-shrink-0">3</span>
              <span>Review AI-powered insights and financial metrics</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex-shrink-0">4</span>
              <span>Build your portfolio and track performance</span>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center px-8 py-4 rounded-full font-semibold text-lg glow-button"
          >
            Access My Dashboard →
          </a>
        </div>

        {/* Support Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-white font-semibold">Need Help?</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Our support team is here to help you get started and answer any questions.
            </p>
            <a
              href="mailto:support@argora.ai"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              <span>support@argora.ai</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

          <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-white font-semibold">Documentation</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Explore our guides, tutorials, and best practices for real estate investing.
            </p>
            <a
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              <span>View Documentation</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-white/40 text-sm">
          <p>Thank you for choosing ARGORA DEALS</p>
          <p className="mt-2">We're excited to help you build wealth through real estate investing</p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <OnboardingSuccessContent />
    </Suspense>
  );
}
