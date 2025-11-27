import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify Shopify webhook HMAC signature
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_API_SECRET || !hmacHeader) {
    return false;
  }

  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

// Orders webhook - track new orders for attribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
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
      order_total: parseFloat(order.total_price) || 0,
      customer_email: order.email || order.customer?.email,
      customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : null,
      ad_source: adSource,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      landing_page: landingSite,
      created_at: order.created_at,
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
