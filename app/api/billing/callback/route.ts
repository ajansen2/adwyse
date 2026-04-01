import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to build Shopify admin URL for embedded app redirect
function buildShopifyAdminUrl(shop: string, params?: Record<string, string>): string {
  const shopName = shop.replace('.myshopify.com', '');
  // Use SHOPIFY_API_KEY with fallback to hardcoded key for Adwyse
  const apiKey = process.env.SHOPIFY_API_KEY || '08fa8bc27e0e3ac857912c7e7ee289d0';
  const baseUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    return `${baseUrl}?${searchParams.toString()}`;
  }
  return baseUrl;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const chargeId = searchParams.get('charge_id');
    const storeId = searchParams.get('store_id');

    if (!shop || !chargeId || !storeId) {
      if (shop) {
        return NextResponse.redirect(buildShopifyAdminUrl(shop, { error: 'billing_invalid' }));
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
      return NextResponse.redirect(buildShopifyAdminUrl(shop, { error: 'store_not_found' }));
    }

    // Verify and activate the charge
    const chargeResponse = await fetch(
      `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': store.access_token,
        },
      }
    );

    if (!chargeResponse.ok) {
      console.error('Failed to fetch charge details');
      return NextResponse.redirect(buildShopifyAdminUrl(shop, { error: 'billing_fetch_failed' }));
    }

    const chargeData = await chargeResponse.json();
    const charge = chargeData.recurring_application_charge;

    console.log('📋 Charge status:', charge.status);

    // Handle accepted status - needs activation
    if (charge.status === 'accepted') {
      const activateResponse = await fetch(
        `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}/activate.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': store.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recurring_application_charge: {
              id: chargeId,
            },
          }),
        }
      );

      if (!activateResponse.ok) {
        console.error('❌ Failed to activate charge');
        return NextResponse.redirect(buildShopifyAdminUrl(shop, { error: 'billing_activation_failed' }));
      }

      console.log('✅ Billing charge activated');
    } else if (charge.status === 'active') {
      // Test charges are already active, no need to activate
      console.log('✅ Billing charge already active (test mode)');
    } else if (charge.status === 'declined') {
      console.log('❌ Merchant declined billing');

      // Update store status to trial/free
      await supabase
        .from('stores')
        .update({
          subscription_status: 'cancelled',
          billing_status: 'declined',
          subscription_tier: 'free',
        })
        .eq('id', storeId);

      return NextResponse.redirect(buildShopifyAdminUrl(shop, { billing: 'declined' }));
    } else {
      // Pending or other status
      return NextResponse.redirect(buildShopifyAdminUrl(shop, { billing: 'pending' }));
    }

    // Update store with billing info (for both accepted and active statuses)
    if (charge.status === 'accepted' || charge.status === 'active') {
      await supabase
        .from('stores')
        .update({
          subscription_status: 'active',
          billing_status: 'active',
          billing_charge_id: chargeId,
          subscription_tier: 'pro',
        })
        .eq('id', storeId);

      // Update merchant subscription tier
      await supabase
        .from('merchants')
        .update({
          subscription_tier: 'pro',
        })
        .eq('id', store.merchant_id);

      console.log('✅ Database updated with billing info');

      // Get merchant info
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, email')
        .eq('id', store.merchant_id)
        .single();

      if (merchant) {
        // For embedded apps, construct the proper Shopify admin URL
        const shopName = shop!.replace('.myshopify.com', '');
        const apiKey = process.env.SHOPIFY_API_KEY || '08fa8bc27e0e3ac857912c7e7ee289d0';
        const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;

        console.log('🔄 Redirecting to:', shopifyAdminUrl);
        console.log('📍 Shop:', shop);
        console.log('📍 Shop name:', shopName);

        const response = NextResponse.redirect(shopifyAdminUrl);

        // Store merchant_id and shop in cookies for easy access
        response.cookies.set('merchant_id', merchant.id, {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });

        response.cookies.set('shop_domain', shop!, {
          httpOnly: false, // Allow client-side access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });

        console.log('✅ Redirecting to dashboard with billing success');
        return response;
      }

      return NextResponse.redirect(buildShopifyAdminUrl(shop, { billing: 'success' }));
    }
  } catch (error) {
    console.error('Billing callback error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    if (shop) {
      return NextResponse.redirect(buildShopifyAdminUrl(shop, { error: 'billing_callback_failed' }));
    }
    return NextResponse.redirect(new URL('/dashboard?error=billing_callback_failed', request.url));
  }
}
