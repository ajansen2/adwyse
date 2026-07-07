'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Analytics page — redirects to the main dashboard which has all analytics.
 * The old analytics page was from a different app (cart recovery) and is not relevant to AdWyse.
 */
export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
        <div className="text-white text-xl">Redirecting to dashboard...</div>
      </div>
    </div>
  );
}
