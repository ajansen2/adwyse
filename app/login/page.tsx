'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to OAuth install flow
    router.replace('/dashboard/connect-store');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to Shopify install...</div>
    </div>
  );
}
