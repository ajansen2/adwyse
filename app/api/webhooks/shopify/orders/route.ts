import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('💰 Order webhook received:', { topic, shop });

    // Verify webhook signature
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderData = JSON.parse(rawBody);

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get store by shop domain (AdWyse uses shop_domain column)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (storeError || !store) {
      console.log('⚠️  Store not found:', shop);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Extract attribution data from order
    const landingSite = orderData.landing_site || '';
    const landingSiteReferrer = orderData.landing_site_ref || orderData.referring_site || '';

    // Parse UTM parameters from landing_site
    const utmParams = extractUTMParameters(landingSite);

    // Extract FBCLID (Facebook Click ID) and GCLID (Google Click ID)
    const fbclid = extractParameterFromURL(landingSite, 'fbclid') ||
                   extractParameterFromURL(landingSiteReferrer, 'fbclid');
    const gclid = extractParameterFromURL(landingSite, 'gclid') ||
                  extractParameterFromURL(landingSiteReferrer, 'gclid');

    // Extract creative-level IDs for detailed attribution
    const fbAdId = extractParameterFromURL(landingSite, 'fb_ad_id') ||
                   extractParameterFromURL(landingSiteReferrer, 'fb_ad_id');
    const fbAdsetId = extractParameterFromURL(landingSite, 'fb_adset_id') ||
                      extractParameterFromURL(landingSiteReferrer, 'fb_adset_id');
    const googleCreativeId = extractParameterFromURL(landingSite, 'creative') ||
                             extractParameterFromURL(landingSiteReferrer, 'creative');
    const googleAdgroupId = extractParameterFromURL(landingSite, 'adgroupid') ||
                            extractParameterFromURL(landingSiteReferrer, 'adgroupid');
    const ttclid = extractParameterFromURL(landingSite, 'ttclid') ||
                   extractParameterFromURL(landingSiteReferrer, 'ttclid');
    const ttAdId = extractParameterFromURL(landingSite, 'tt_ad_id') ||
                   extractParameterFromURL(landingSiteReferrer, 'tt_ad_id');
    const ttAdgroupId = extractParameterFromURL(landingSite, 'tt_adgroup_id') ||
                        extractParameterFromURL(landingSiteReferrer, 'tt_adgroup_id');

    // Determine ad source
    const adSource = determineAdSource(utmParams, fbclid, gclid, landingSiteReferrer, ttclid);
    const campaignName = utmParams.utm_campaign || extractCampaignFromReferrer(landingSiteReferrer);

    // Calculate order total
    const orderTotal = parseFloat(orderData.total_price || '0');
    const customerEmail = orderData.customer?.email || orderData.email || null;

    console.log('📊 Attribution data:', {
      adSource,
      campaignName,
      fbclid: fbclid ? 'present' : 'none',
      gclid: gclid ? 'present' : 'none',
      ttclid: ttclid ? 'present' : 'none',
      fbAdId: fbAdId || 'none',
      utmSource: utmParams.utm_source,
      utmMedium: utmParams.utm_medium,
      orderTotal,
    });

    // Insert order into database
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        store_id: store.id,
        shopify_order_id: orderData.id.toString(),
        order_number: orderData.order_number?.toString() || orderData.name,
        customer_email: customerEmail,
        total_price: orderTotal,
        currency: orderData.currency || 'USD',

        // Attribution fields
        attributed_platform: adSource,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content: utmParams.utm_content,
        utm_term: utmParams.utm_term,
        fbclid: fbclid,
        gclid: gclid,
        ttclid: ttclid,

        // Creative-level attribution
        fb_ad_id: fbAdId,
        fb_adset_id: fbAdsetId,
        google_creative_id: googleCreativeId,
        google_adgroup_id: googleAdgroupId,
        tt_ad_id: ttAdId,
        tt_adgroup_id: ttAdgroupId,

        order_created_at: orderData.created_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Check if order already exists
      if (insertError.code === '23505') { // Unique constraint violation
        console.log('⚠️  Order already tracked:', orderData.id);
        return NextResponse.json({ success: true, message: 'Order already tracked' }, { status: 200 });
      }

      console.error('❌ Error inserting order:', insertError);
      return NextResponse.json({ error: 'Failed to insert order' }, { status: 500 });
    }

    console.log('✅ Order tracked with attribution:', {
      orderId: insertedOrder.id,
      shopifyOrderId: orderData.id,
      orderTotal,
      adSource,
      utmCampaign: utmParams.utm_campaign,
    });

    // If we have a campaign name and ad source, try to link to campaign
    if (utmParams.utm_campaign && adSource) {
      await linkOrderToCampaign(supabase, insertedOrder.id, store.id, utmParams.utm_campaign, adSource);
    }

    return NextResponse.json({
      success: true,
      orderId: insertedOrder.id,
      attribution: { adSource, utmCampaign: utmParams.utm_campaign }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Orders webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Extract UTM parameters from URL
function extractUTMParameters(url: string): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
} {
  return {
    utm_source: extractParameterFromURL(url, 'utm_source'),
    utm_medium: extractParameterFromURL(url, 'utm_medium'),
    utm_campaign: extractParameterFromURL(url, 'utm_campaign'),
    utm_content: extractParameterFromURL(url, 'utm_content'),
    utm_term: extractParameterFromURL(url, 'utm_term'),
  };
}

// Extract a specific parameter from URL
function extractParameterFromURL(url: string, paramName: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://example.com${url}`);
    return urlObj.searchParams.get(paramName);
  } catch {
    // Fallback regex if URL parsing fails
    const regex = new RegExp(`[?&]${paramName}=([^&#]*)`);
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

// Determine ad source from attribution data
function determineAdSource(
  utmParams: { utm_source: string | null; utm_medium: string | null },
  fbclid: string | null,
  gclid: string | null,
  referrer: string,
  ttclid?: string | null
): string {
  // Facebook
  if (fbclid || utmParams.utm_source?.toLowerCase().includes('facebook') ||
      utmParams.utm_source?.toLowerCase().includes('fb') ||
      utmParams.utm_source?.toLowerCase().includes('ig') ||
      utmParams.utm_source?.toLowerCase().includes('instagram')) {
    return 'facebook';
  }

  // Google
  if (gclid || utmParams.utm_source?.toLowerCase().includes('google')) {
    return 'google';
  }

  // TikTok
  if (ttclid ||
      utmParams.utm_source?.toLowerCase().includes('tiktok') ||
      utmParams.utm_source?.toLowerCase().includes('ttad')) {
    return 'tiktok';
  }

  // Referrer-based detection
  if (referrer) {
    const lowerReferrer = referrer.toLowerCase();
    if (lowerReferrer.includes('facebook.com') || lowerReferrer.includes('fb.com')) return 'facebook';
    if (lowerReferrer.includes('instagram.com')) return 'instagram';
    if (lowerReferrer.includes('google.com')) return 'google';
    if (lowerReferrer.includes('tiktok.com')) return 'tiktok';
  }

  // Check utm_medium for paid ads
  if (utmParams.utm_medium?.toLowerCase().includes('cpc') ||
      utmParams.utm_medium?.toLowerCase().includes('ppc') ||
      utmParams.utm_medium?.toLowerCase().includes('paid')) {
    return utmParams.utm_source || 'paid_ad';
  }

  // UTM source if available
  if (utmParams.utm_source) {
    return utmParams.utm_source.toLowerCase();
  }

  return 'direct';
}

// Extract campaign name from referrer if not in UTM
function extractCampaignFromReferrer(referrer: string): string | null {
  if (!referrer) return null;

  // Try to extract campaign from common ad platform URL patterns
  const campaignMatch = referrer.match(/campaign[_-]?(?:id|name)?=([^&]+)/i);
  return campaignMatch ? decodeURIComponent(campaignMatch[1]) : null;
}

// Link order to existing campaign or create new one
async function linkOrderToCampaign(
  supabase: any,
  orderId: string,
  storeId: string,
  campaignName: string,
  adSource: string
) {
  try {
    // Try to find existing campaign by name
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('store_id', storeId)
      .eq('name', campaignName)
      .eq('platform', adSource)
      .single();

    if (existingCampaign) {
      // Update order with campaign_id
      await supabase
        .from('orders')
        .update({ campaign_id: existingCampaign.id })
        .eq('id', orderId);

      console.log('✅ Linked order to existing campaign:', existingCampaign.id);
    } else {
      // Create new campaign placeholder (will be enriched later with ad spend data)
      const { data: newCampaign } = await supabase
        .from('campaigns')
        .insert({
          store_id: storeId,
          name: campaignName,
          platform: adSource,
          status: 'active',
          total_spend: 0, // Will be updated when syncing with ad platform
          total_revenue: 0,
          total_orders: 0,
        })
        .select()
        .single();

      if (newCampaign) {
        await supabase
          .from('orders')
          .update({ campaign_id: newCampaign.id })
          .eq('id', orderId);

        console.log('✅ Created new campaign and linked order:', newCampaign.id);
      }
    }
  } catch (error) {
    console.error('⚠️  Error linking order to campaign:', error);
    // Non-critical error, don't fail the webhook
  }
}

// Verify Shopify webhook signature
function verifyWebhook(data: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!secret) {
    console.error('❌ No Shopify API secret configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');

  return hash === hmac;
}
