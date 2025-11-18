'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

function MerchantLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const supabase = getSupabaseClient()

  useEffect(() => {
    const loginMerchant = async () => {
      const merchantId = searchParams.get('merchant_id')
      const email = searchParams.get('email')

      if (!merchantId || !email) {
        setError('Missing merchant information')
        return
      }

      try {
        // Sign in the user with their email (passwordless)
        const { data, error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${window.location.origin}/dashboard/welcome?billing=success`,
          },
        })

        if (error) {
          console.error('Login error:', error)
          // Fallback - just redirect to welcome page
          router.push('/dashboard/welcome?billing=success')
        } else {
          // Redirect to welcome page
          router.push('/dashboard/welcome?billing=success&check_email=true')
        }
      } catch (err) {
        console.error('Login error:', err)
        router.push('/dashboard/welcome?billing=success')
      }
    }

    loginMerchant()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
        <div className="text-white text-xl">Setting up your account...</div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
      </div>
    </div>
  )
}

export default function MerchantLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    }>
      <MerchantLoginContent />
    </Suspense>
  )
}
