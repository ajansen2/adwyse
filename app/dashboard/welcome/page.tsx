'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [storeName, setStoreName] = useState<string>('')

  useEffect(() => {
    try {
      // Get store name from localStorage if available
      const store = localStorage.getItem('shopify_store_domain')
      if (store) {
        setStoreName(store.replace('.myshopify.com', ''))
      }

      // Mark welcome as seen
      localStorage.setItem('welcome_seen', 'true')
    } catch (e) {
      // localStorage may not be available in embedded context
    }
  }, [])

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-12 shadow-2xl">
        {/* Celebration Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ARGORA</span>!
          </h1>
          {storeName && (
            <p className="text-xl text-white/70">
              Your store <span className="text-purple-400 font-semibold">{storeName}</span> is now connected
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
              <h3 className="text-lg font-semibold text-white mb-2">ARGORA is now monitoring your store</h3>
              <p className="text-white/70">
                AI-powered cart recovery is active and ready to recover abandoned carts automatically.
              </p>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">What happens next?</h2>
          <div className="space-y-3">
            {[
              { icon: '🤖', text: 'AI automatically detects abandoned carts in real-time' },
              { icon: '✉️', text: 'Personalized recovery emails are generated for each customer' },
              { icon: '⏰', text: 'Emails sent at 1hr, 24hr, and 72hr after abandonment' },
              { icon: '📊', text: 'Track recovered revenue and performance on your dashboard' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <span className="text-2xl">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Setup */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">Optional Setup (Recommended)</h3>
          <div className="space-y-2 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-purple-400">→</span>
              <span>Customize your brand voice so emails sound authentically you</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">→</span>
              <span>Review email timing and sequence settings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">→</span>
              <span>Test the AI with a sample abandoned cart</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={goToDashboard}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Go to Dashboard →
        </button>

        {/* Trial Info */}
        <div className="mt-6 text-center text-sm text-white/50">
          14-day free trial active • $29.99/month after trial<br />
          Questions? Email us at <a href="mailto:support@argora.ai" className="text-purple-400 hover:text-purple-300">support@argora.ai</a>
        </div>
      </div>
    </div>
  )
}
