'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const shop = searchParams.get('shop');
  const chargeId = searchParams.get('charge_id');
  const storeId = searchParams.get('store_id');

  useEffect(() => {
    async function processBilling() {
      console.log('🔍 Billing Success Page - Received params:');
      console.log('  Shop:', shop);
      console.log('  Charge ID:', chargeId);
      console.log('  Store ID:', storeId);
      console.log('  Full URL:', window.location.href);

      if (!shop || !chargeId || !storeId) {
        console.error('❌ Missing billing parameters');
        console.error('  Missing shop:', !shop);
        console.error('  Missing chargeId:', !chargeId);
        console.error('  Missing storeId:', !storeId);

        // If we at least have shop, redirect to embedded dashboard
        if (shop) {
          const shopName = shop.replace('.myshopify.com', '');
          const redirectUrl = `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard?error=billing_params_missing`;
          console.log('🔄 Redirecting to (with shop):', redirectUrl);
          window.top!.location.href = redirectUrl;
        } else {
          console.log('🔄 Redirecting to (no shop):', '/dashboard?error=billing_params_missing');
          window.location.href = '/dashboard?error=billing_params_missing';
        }
        return;
      }

      try {
        // Call our billing callback API to process the charge
        const response = await fetch(`/api/billing/callback?shop=${shop}&charge_id=${chargeId}&store_id=${storeId}`);

        if (response.ok) {
          // Successfully processed - redirect to dashboard WITH shop parameter for embedded app
          const shopName = shop.replace('.myshopify.com', '');
          const dashboardUrl = `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard?billing=success`;
          console.log('✅ Billing processed, redirecting to:', dashboardUrl);
          window.top!.location.href = dashboardUrl;
        } else {
          console.error('Billing callback failed');
          const shopName = shop.replace('.myshopify.com', '');
          window.top!.location.href = `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard?error=billing_failed`;
        }
      } catch (error) {
        console.error('Error processing billing:', error);
        const shopName = shop!.replace('.myshopify.com', '');
        window.top!.location.href = `https://admin.shopify.com/store/${shopName}/apps/adwyse/dashboard?error=billing_error`;
      }
    }

    processBilling();
  }, [shop, chargeId, storeId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Processing your subscription...</p>
        <p className="text-sm text-white/60 mt-2">Please wait while we activate your plan</p>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
