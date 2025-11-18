// app/client/[subdomain]/page.tsx
import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import Link from 'next/link'
import ComprehensiveDashboard from '../../../components/ComprehensiveDashboard'

// Generate metadata for SEO
export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>
}): Promise<Metadata> {
  const resolvedParams = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, company')
    .eq('subdomain', resolvedParams.subdomain)
    .single()

  const title = profile
    ? `${profile.company || profile.full_name || 'Dashboard'} | ARGORA DEALS`
    : 'Dashboard | ARGORA DEALS'

  return {
    title,
    description: 'AI-powered real estate investment analysis dashboard',
  }
}

export default async function ClientSubdomainPage({
  params
}: {
  params: Promise<{ subdomain: string }>
}) {
  const resolvedParams = await params

  console.log('[Subdomain Route] Looking up subdomain:', resolvedParams.subdomain)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch profile by subdomain
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, subdomain, full_name, company, email')
    .eq('subdomain', resolvedParams.subdomain)
    .single()

  console.log('[Subdomain Route] Profile lookup result:', { profile, error })

  // If subdomain doesn't exist, show error page
  if (!profile) {
    const errorMessage = error?.message || 'Unknown error'
    const isNotFound = error?.code === 'PGRST116'

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold mb-4">Dashboard Not Found</h1>
          <p className="text-white/70 text-lg mb-4">
            No dashboard exists for subdomain: <span className="text-purple-400 font-mono">{resolvedParams.subdomain}</span>
          </p>

          {isNotFound && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 mb-8">
              <h3 className="text-yellow-300 font-semibold mb-2">Setup Required</h3>
              <p className="text-white/80 text-sm mb-4">
                This subdomain hasn't been set up yet. You need to create a profile with this subdomain in your database.
              </p>
              <details className="text-left">
                <summary className="cursor-pointer text-yellow-300 hover:text-yellow-200 transition-colors mb-2">
                  Show SQL Command
                </summary>
                <pre className="bg-black/50 p-4 rounded text-xs overflow-x-auto text-green-400">
{`-- Run this in Supabase SQL Editor:
UPDATE profiles
SET subdomain = '${resolvedParams.subdomain}'
WHERE email = 'your-email@example.com';

-- Or create new profile:
INSERT INTO profiles (id, email, full_name, subdomain)
VALUES (
  gen_random_uuid(),
  'your-email@example.com',
  'Your Name',
  '${resolvedParams.subdomain}'
);`}
                </pre>
              </details>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold hover:opacity-90 transition-opacity"
              >
                Go to Homepage
              </Link>
              <Link
                href="/demo"
                className="inline-block px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-full font-semibold transition-colors"
              >
                View Demo
              </Link>
            </div>
            <div className="pt-4">
              <a
                href="mailto:support@argora.ai"
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                Contact Support
              </a>
            </div>
            {!isNotFound && (
              <p className="text-xs text-white/40 mt-4">Error: {errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Dashboard exists - show the comprehensive dashboard
  return <ComprehensiveDashboard />
}
