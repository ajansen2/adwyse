'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [storeName, setStoreName] = useState<string>('')

  useEffect(() => {
    try {
      const store = localStorage.getItem('shopify_store_domain')
      if (store) {
        setStoreName(store.replace('.myshopify.com', ''))
      }
      localStorage.setItem('welcome_seen', 'true')
    } catch (e) {
      // localStorage may not be available in embedded context
    }
  }, [])

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">AdWyse</span>!
          </h1>
          {storeName && (
            <p className="text-xl text-white/70">
              Your store <span className="text-orange-400 font-semibold">{storeName}</span> is now connected
            </p>
          )}
        </div>

        {/* Success Message */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">AdWyse is now tracking your store</h3>
              <p className="text-white/70">
                Ad attribution tracking is active. We'll start analyzing your order data and ad campaigns automatically.
              </p>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">What happens next?</h2>
          <div className="space-y-3">
            {[
              { icon: '1', text: 'Orders are tracked and attributed to ad campaigns in real-time' },
              { icon: '2', text: 'Connect your ad accounts (Meta, Google, TikTok) for spend data' },
              { icon: '3', text: 'Install the AdWyse pixel for multi-touch attribution' },
              { icon: '4', text: 'View campaign ROAS, cohort retention, and AI insights on your dashboard' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-sm font-bold flex-shrink-0">
                  {item.icon}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={goToDashboard}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Go to Dashboard
        </button>

        {/* Support Info */}
        <div className="mt-6 text-center text-sm text-white/50">
          7-day free trial active &middot; $99.99/month after trial<br />
          Questions? Email us at <a href="mailto:support@adwyse.ca" className="text-orange-400 hover:text-orange-300">support@adwyse.ca</a>
        </div>
      </div>
    </div>
  )
}
