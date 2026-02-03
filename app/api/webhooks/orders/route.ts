import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify Shopify webhook HMAC signature - supports multiple secrets
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const secrets = [
    process.env.SHOPIFY_API_SECRET,
    process.env.SHOPIFY_API_SECRET_PRODUCTION,
    process.env.SHOPIFY_API_SECRET_DEV,
  ].filter(Boolean);

  if (secrets.length === 0 || !hmacHeader) {
    console.log('❌ [HMAC] No secrets configured or no HMAC header');
    return false;
  }

  for (const secret of secrets) {
    const generatedHash = crypto
      .createHmac('sha256', secret!)
      .update(body, 'utf8')
      .digest('base64');

    try {
      if (crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmacHeader))) {
        console.log('✅ [HMAC] Signature verified');
        return true;
      }
    } catch {
      continue;
    }
  }

  console.log('❌ [HMAC] No matching secret found');
  return false;
}

// Orders webhook - track new orders for attribution
// This endpoint handles the OLD webhook URL for backwards compatibility
export async function POST(request: NextRequest) {
  console.log('📦 [ORDERS WEBHOOK] Request received at /api/webhooks/orders');

  try {
    const body = await request.text();
    console.log('📦 [ORDERS WEBHOOK] Body length:', body.length);
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const shopDomain = request.headers.get('x-shopify-shop-domain') || '';

    // Verify HMAC signature
    if (!verifyShopifyWebhook(body, hmacHeader)) {
      console.error('Invalid webhook signature for orders webhook');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const order = JSON.parse(body);
    console.log('Order webhook received:', {
      order_id: order.id,
      shop_domain: shopDomain,
      total: order.total_price,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the store
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single();

    if (!store) {
      console.error('Store not found for shop:', shopDomain);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Extract attribution data from order
    // Check landing_site, referring_site for UTM parameters
    let adSource = 'direct';
    let utmSource = null;
    let utmMedium = null;
    let utmCampaign = null;

    // Check landing site URL for UTM parameters
    const landingSite = order.landing_site || '';
    if (landingSite) {
      try {
        const url = new URL(landingSite, 'https://example.com');
        utmSource = url.searchParams.get('utm_source');
        utmMedium = url.searchParams.get('utm_medium');
        utmCampaign = url.searchParams.get('utm_campaign');

        // Determine ad source from UTM
        if (utmSource) {
          if (utmSource.toLowerCase().includes('facebook') || utmSource.toLowerCase().includes('fb')) {
            adSource = 'facebook';
          } else if (utmSource.toLowerCase().includes('google')) {
            adSource = 'google';
          } else if (utmSource.toLowerCase().includes('tiktok')) {
            adSource = 'tiktok';
          } else {
            adSource = utmSource;
          }
        }
      } catch (e) {
        console.error('Error parsing landing site URL:', e);
      }
    }

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('shopify_order_id', order.id.toString())
      .single();

    if (existingOrder) {
      console.log('Order already exists:', order.id);
      return NextResponse.json({ success: true, message: 'Order already tracked' });
    }

    // Insert the order
    const { error } = await supabase.from('orders').insert({
      store_id: store.id,
      shopify_order_id: order.id.toString(),
      order_number: order.order_number?.toString() || order.name,
      total_price: parseFloat(order.total_price) || 0,
      currency: order.currency || 'USD',
      customer_email: order.email || order.customer?.email,
      attributed_platform: adSource,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      order_created_at: order.created_at,
    });

    if (error) {
      console.error('Error inserting order:', error);
      return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
    }

    console.log('Order tracked successfully:', order.id, 'Source:', adSource);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing orders webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
