import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Returns an HTML page that redirects window.top (breaks out of Shopify's iframe).
 * Required for embedded apps — NextResponse.redirect() stays inside the iframe
 * and Shopify's billing approval page never renders.
 */
function topLevelRedirectHTML(url: string, message: string = 'Redirecting...'): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${message}</title>
<style>body{background:#0a0a0a;color:white;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.loader{text-align:center}.spinner{width:40px;height:40px;border:3px solid #333;border-top:3px solid #8b5cf6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}</style>
</head>
<body><div class="loader"><div class="spinner"></div><p>${message}</p></div>
<script>if(window.top&&window.top!==window.self){window.top.location.href=${JSON.stringify(url)}}else{window.location.href=${JSON.stringify(url)}}</script>
</body></html>`;
}

// Helper to build Shopify admin URL for embedded app redirect
function buildShopifyAdminUrl(shop: string, params?: Record<string, string>): string {
  const shopName = shop.replace('.myshopify.com', '');
  const apiKey = process.env.SHOPIFY_API_KEY;
  const baseUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    return `${baseUrl}?${searchParams.toString()}`;
  }
  return baseUrl;
}

function htmlRedirect(url: string, message: string = 'Redirecting...'): NextResponse {
  return new NextResponse(
    topLevelRedirectHTML(url, message),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const chargeId = searchParams.get('charge_id');
    const storeId = searchParams.get('store_id');

    if (!shop || !storeId) {
      if (shop) {
        return htmlRedirect(buildShopifyAdminUrl(shop, { error: 'billing_invalid' }));
      }
      return NextResponse.redirect(new URL('/dashboard?error=billing_invalid', request.url));
    }

    // Get store from database to retrieve access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('Store not found:', storeError);
      return htmlRedirect(buildShopifyAdminUrl(shop, { error: 'store_not_found' }));
    }

    // Verify subscription status via GraphQL activeSubscriptions query
    const graphqlResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              currentAppInstallation {
                activeSubscriptions {
                  id
                  name
                  status
                  currentPeriodEnd
                  trialDays
                }
              }
            }
          `,
        }),
      }
    );

    if (!graphqlResponse.ok) {
      console.error('Failed to query activeSubscriptions via GraphQL');
      return htmlRedirect(buildShopifyAdminUrl(shop, { error: 'billing_fetch_failed' }));
    }

    const graphqlData = await graphqlResponse.json();

    if (graphqlData.errors) {
      console.error('GraphQL errors:', graphqlData.errors);
      return htmlRedirect(buildShopifyAdminUrl(shop, { error: 'billing_fetch_failed' }));
    }

    const activeSubscriptions = graphqlData.data?.currentAppInstallation?.activeSubscriptions || [];
    console.log('📋 Active subscriptions:', activeSubscriptions.length);

    const activeSub = activeSubscriptions.find(
      (s: { status: string }) => s.status === 'ACTIVE'
    );

    if (!activeSub) {
      // No active subscription — merchant declined or subscription not yet active
      console.log('❌ No active subscription found after billing callback');

      await supabase
        .from('stores')
        .update({
          subscription_status: 'cancelled',
          billing_status: 'declined',
          subscription_tier: 'free',
        })
        .eq('id', storeId);

      return htmlRedirect(
        buildShopifyAdminUrl(shop, { billing: 'declined' }),
        'Billing not activated. Redirecting...'
      );
    }

    // Active subscription found — update store
    console.log('✅ Active subscription found:', activeSub.id);

    await supabase
      .from('stores')
      .update({
        subscription_status: 'active',
        billing_status: 'active',
        billing_charge_id: chargeId || activeSub.id,
        subscription_tier: 'pro',
      })
      .eq('id', storeId);

    // Update merchant subscription tier
    if (store.merchant_id) {
      await supabase
        .from('merchants')
        .update({
          subscription_tier: 'pro',
        })
        .eq('id', store.merchant_id);
    }

    console.log('✅ Database updated with billing info');

    // Redirect back to dashboard inside Shopify admin
    const dashboardUrl = buildShopifyAdminUrl(shop, { billing: 'success' });
    console.log('🔄 Redirecting to:', dashboardUrl);

    return htmlRedirect(dashboardUrl, 'Billing activated! Loading AdWyse...');

  } catch (error) {
    console.error('Billing callback error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    if (shop) {
      return htmlRedirect(
        buildShopifyAdminUrl(shop, { error: 'billing_callback_failed' }),
        'Something went wrong. Redirecting...'
      );
    }
    return NextResponse.redirect(new URL('/dashboard?error=billing_callback_failed', request.url));
  }
}
