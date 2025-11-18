'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ExitIframeContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const redirectUri = searchParams.get('redirectUri');

  useEffect(() => {
    if (!shop || !redirectUri) {
      window.location.href = '/dashboard';
      return;
    }

    // Extract shop name from domain
    const shopName = shop.replace('.myshopify.com', '');

    // Construct the proper Shopify admin embedded app URL
    // This uses the Shopify admin path structure with just the app handle and relative path
    const appUrl = `https://admin.shopify.com/store/${shopName}/apps/argora-cart-recovery${redirectUri}`;

    // Use window.top to break out of iframe and redirect
    if (window.top) {
      window.top.location.href = appUrl;
    } else {
      window.location.href = appUrl;
    }
  }, [shop, redirectUri]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}

export default function ExitIframePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ExitIframeContent />
    </Suspense>
  );
}
