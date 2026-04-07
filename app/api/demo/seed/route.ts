import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Demo data generation helpers
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomDecimal(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(): string {
  const names = ['john', 'jane', 'mike', 'sarah', 'alex', 'emma', 'chris', 'olivia', 'david', 'sophia'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
  return `${randomChoice(names)}${randomBetween(100, 999)}@${randomChoice(domains)}`;
}

function generateVisitorId(): string {
  return `vis_${Math.random().toString(36).substring(2, 15)}`;
}

function generateSessionId(): string {
  return `sess_${Math.random().toString(36).substring(2, 15)}`;
}

// Product catalog for demo
const PRODUCTS = [
  { id: 'prod_001', title: 'Premium Widget Pro', price: 149.99, cost: 45.00, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' },
  { id: 'prod_002', title: 'Essential Gadget', price: 79.99, cost: 25.00, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' },
  { id: 'prod_003', title: 'Deluxe Bundle Pack', price: 299.99, cost: 89.00, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200' },
  { id: 'prod_004', title: 'Starter Kit', price: 49.99, cost: 15.00, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200' },
  { id: 'prod_005', title: 'Professional Suite', price: 499.99, cost: 150.00, image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200' },
];

// Campaign definitions with correct platforms
const CAMPAIGNS = [
  { name: 'Summer Sale 2024', platform: 'facebook' },
  { name: 'Retargeting - Cart Abandoners', platform: 'facebook' },
  { name: 'Lookalike - High Value Customers', platform: 'facebook' },
  { name: 'Brand Search', platform: 'google' },
  { name: 'Product Shopping', platform: 'google' },
  { name: 'TikTok Viral Campaign', platform: 'tiktok' },
  { name: 'TikTok Influencer Collab', platform: 'tiktok' },
];

// Creative templates
const CREATIVES = [
  { name: 'Video - Product Demo', type: 'video', format: '1080x1920' },
  { name: 'Image - Lifestyle Shot', type: 'image', format: '1080x1080' },
  { name: 'Carousel - Product Features', type: 'carousel', format: '1080x1080' },
  { name: 'Video - Customer Testimonial', type: 'video', format: '1920x1080' },
  { name: 'Image - Sale Banner', type: 'image', format: '1200x628' },
  { name: 'Video - Unboxing', type: 'video', format: '1080x1920' },
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const daysBack = parseInt(searchParams.get('days') || '60');
    const ordersCount = parseInt(searchParams.get('orders') || '150');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

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

    // Verify store exists
    const { data: store, error: storeError } = await supabase
      .from('adwyse_stores')
      .select('id, shop_domain')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const results = {
      adAccounts: 0,
      campaigns: 0,
      orders: 0,
      pixelEvents: 0,
      productCosts: 0,
      creatives: 0,
      touchpoints: 0,
    };

    // 1. Create Ad Accounts
    const adAccountsToCreate = [
      { platform: 'facebook', account_id: 'act_' + randomBetween(100000000, 999999999), account_name: 'Demo Facebook Ads' },
      { platform: 'google', account_id: 'customers/' + randomBetween(1000000000, 9999999999), account_name: 'Demo Google Ads' },
      { platform: 'tiktok', account_id: 'tt_' + randomBetween(10000000, 99999999), account_name: 'Demo TikTok Ads' },
    ];

    const adAccountMap: Record<string, string> = {};

    for (const account of adAccountsToCreate) {
      const { data, error } = await supabase
        .from('adwyse_ad_accounts')
        .upsert({
          store_id: storeId,
          ...account,
          access_token: 'demo_token_' + account.platform,
          is_connected: true,
          last_sync_at: new Date().toISOString(),
        }, { onConflict: 'store_id,platform,account_id' })
        .select('id, platform')
        .single();

      if (data) {
        adAccountMap[data.platform] = data.id;
        results.adAccounts++;
      }
    }

    // 2. Create Product Costs
    for (const product of PRODUCTS) {
      const { error } = await supabase
        .from('product_costs')
        .upsert({
          store_id: storeId,
          shopify_product_id: product.id,
          product_title: product.title,
          cost_per_unit: product.cost,
          currency: 'USD',
          source: 'demo',
        }, { onConflict: 'store_id,shopify_product_id,shopify_variant_id' });

      if (!error) results.productCosts++;
    }

    // 3. Create Campaigns with daily metrics - PROFITABLE ROAS (2.5x - 5x)
    const campaignRecords: { id: string; platform: string; name: string }[] = [];

    for (const campaign of CAMPAIGNS) {
      const adAccountId = adAccountMap[campaign.platform];
      if (!adAccountId) continue;

      const platformCampaignId = `demo_${campaign.platform}_${campaign.name.replace(/\s+/g, '_').toLowerCase()}`;

      // Generate daily data for each campaign
      for (let d = 0; d < daysBack; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];

        // Skip some days randomly for variety (10% chance)
        if (Math.random() < 0.1) continue;

        // More realistic spend: $20-150/day per campaign
        const spend = randomDecimal(20, 150);
        const impressions = randomBetween(2000, 20000);
        const clicks = Math.floor(impressions * randomDecimal(0.015, 0.04)); // 1.5-4% CTR

        // Calculate revenue to achieve 2.5x - 5x ROAS
        const targetRoas = randomDecimal(2.5, 5.0);
        const revenue = parseFloat((spend * targetRoas).toFixed(2));
        const conversions = Math.max(1, Math.floor(revenue / randomDecimal(80, 200)));

        const { data, error } = await supabase
          .from('adwyse_campaigns')
          .upsert({
            ad_account_id: adAccountId,
            store_id: storeId,
            platform_campaign_id: platformCampaignId,
            campaign_name: campaign.name,
            status: 'active',
            date: dateStr,
            spend,
            impressions,
            clicks,
            conversions,
            attributed_revenue: revenue,
            attributed_orders: conversions,
            roas: targetRoas,
          }, { onConflict: 'ad_account_id,platform_campaign_id,date' })
          .select('id, campaign_name')
          .single();

        if (data) {
          if (d === 0) {
            campaignRecords.push({ id: data.id, platform: campaign.platform, name: campaign.name });
          }
          results.campaigns++;
        }
      }
    }

    // 4. Create Ad Creatives - daily data for each creative
    for (const campaign of campaignRecords) {
      const adAccountId = adAccountMap[campaign.platform];
      if (!adAccountId) continue;

      // Create 2-4 creatives per campaign
      const numCreatives = randomBetween(2, 4);
      for (let c = 0; c < numCreatives; c++) {
        const creative = randomChoice(CREATIVES);
        const platformAdId = `demo_ad_${campaign.platform}_${c}_${randomBetween(10000, 99999)}`;
        const platformAdsetId = `demo_adset_${campaign.platform}_${randomBetween(1000, 9999)}`;

        // Create daily entries for each creative
        for (let d = 0; d < daysBack; d++) {
          const date = new Date();
          date.setDate(date.getDate() - d);
          const dateStr = date.toISOString().split('T')[0];

          // Skip some days randomly
          if (Math.random() < 0.15) continue;

          const spend = randomDecimal(10, 80);
          const targetRoas = randomDecimal(2.0, 6.0);
          const revenue = parseFloat((spend * targetRoas).toFixed(2));
          const impressions = randomBetween(1000, 15000);
          const clicks = Math.floor(impressions * randomDecimal(0.015, 0.04));

          const { error } = await supabase.from('ad_creatives').upsert({
            store_id: storeId,
            ad_account_id: adAccountId,
            platform: campaign.platform,
            platform_ad_id: platformAdId,
            platform_adset_id: platformAdsetId,
            platform_campaign_id: `demo_${campaign.platform}_${campaign.name.replace(/\s+/g, '_').toLowerCase()}`,
            ad_name: `${creative.name} - ${campaign.name}`,
            adset_name: `Adset ${c + 1} - ${campaign.name}`,
            campaign_name: campaign.name,
            creative_type: creative.type,
            thumbnail_url: PRODUCTS[c % PRODUCTS.length].image,
            status: randomChoice(['active', 'active', 'active', 'paused']),
            date: dateStr,
            spend,
            impressions,
            clicks,
            conversions: Math.max(1, Math.floor(revenue / randomDecimal(80, 200))),
            attributed_revenue: revenue,
            attributed_orders: Math.max(1, Math.floor(revenue / randomDecimal(80, 200))),
            roas: targetRoas,
          }, { onConflict: 'ad_account_id,platform_ad_id,date' });

          if (!error) results.creatives++;
        }
      }
    }

    // 5. Create Orders with proper attribution
    const customerEmails: string[] = [];
    const platforms = ['facebook', 'google', 'tiktok', 'organic', 'direct'];
    const platformWeights = [0.35, 0.25, 0.15, 0.15, 0.10]; // Distribution

    for (let i = 0; i < ordersCount; i++) {
      const daysAgo = randomBetween(0, daysBack);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);
      orderDate.setHours(randomBetween(8, 22), randomBetween(0, 59), randomBetween(0, 59));

      const sessionId = generateSessionId();
      const product = randomChoice(PRODUCTS);
      const quantity = randomBetween(1, 3);
      const totalPrice = parseFloat((product.price * quantity).toFixed(2));
      const cogs = parseFloat((product.cost * quantity).toFixed(2));

      // Weighted platform selection
      const rand = Math.random();
      let cumulative = 0;
      let platform = 'direct';
      for (let p = 0; p < platforms.length; p++) {
        cumulative += platformWeights[p];
        if (rand < cumulative) {
          platform = platforms[p];
          break;
        }
      }

      const hasFbclid = platform === 'facebook' ? `fb.1.${Date.now()}.${randomBetween(1000000000, 9999999999)}` : null;
      const hasGclid = platform === 'google' ? `Cj0KCQiA${Math.random().toString(36).substring(2, 15)}` : null;
      const hasTtclid = platform === 'tiktok' ? `tt_${Math.random().toString(36).substring(2, 15)}` : null;

      // Find matching campaign for this platform
      const matchingCampaign = campaignRecords.find(c => c.platform === platform);

      // Generate or reuse customer email (30% repeat customers)
      let customerEmail: string;
      if (customerEmails.length > 10 && Math.random() < 0.3) {
        customerEmail = randomChoice(customerEmails);
      } else {
        customerEmail = generateEmail();
        customerEmails.push(customerEmail);
      }

      const customerId = `cust_${customerEmail.split('@')[0]}_${randomBetween(1000, 9999)}`;

      const utmSource = platform !== 'direct' ? platform : null;
      const utmMedium = platform === 'facebook' || platform === 'tiktok' ? 'social' :
                        platform === 'google' ? 'cpc' :
                        platform === 'organic' ? 'organic' : null;
      const utmCampaign = matchingCampaign?.name || null;

      const { data: order, error: orderError } = await supabase
        .from('adwyse_orders')
        .insert({
          store_id: storeId,
          shopify_order_id: `demo_${Date.now()}_${i}`,
          order_number: `#${1000 + i}`,
          total_price: totalPrice,
          cogs: cogs,
          currency: 'USD',
          customer_email: customerEmail,
          customer_id: customerId,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          fbclid: hasFbclid,
          gclid: hasGclid,
          ttclid: hasTtclid,
          attributed_platform: platform,
          attributed_campaign_id: matchingCampaign?.id || null,
          attribution_confidence: platform === 'direct' ? 1.0 : randomDecimal(0.75, 0.98),
          order_created_at: orderDate.toISOString(),
        })
        .select('id')
        .single();

      if (order) {
        results.orders++;

        // Create line item
        await supabase.from('adwyse_order_line_items').insert({
          order_id: order.id,
          store_id: storeId,
          shopify_product_id: product.id,
          title: product.title,
          quantity,
          unit_price: product.price,
          unit_cost: product.cost,
        });

        // 6. Create Attribution Touchpoints for this order
        // Create 1-4 touchpoints per order (multi-touch attribution)
        const numTouchpoints = randomBetween(1, 4);
        const touchpointPlatforms = platform === 'direct'
          ? ['direct']
          : [platform, ...Array(numTouchpoints - 1).fill(null).map(() => randomChoice(['facebook', 'google', 'tiktok', 'organic']))];

        for (let t = 0; t < numTouchpoints; t++) {
          const tpDate = new Date(orderDate);
          tpDate.setDate(tpDate.getDate() - (numTouchpoints - t - 1) * randomBetween(1, 7));

          const tpPlatform = touchpointPlatforms[t] || platform;
          const tpCampaign = campaignRecords.find(c => c.platform === tpPlatform);

          // Determine touchpoint type based on platform
          const touchpointType = tpPlatform === 'direct' ? 'direct' :
                                  tpPlatform === 'organic' ? 'organic_visit' : 'ad_click';

          const { error } = await supabase.from('attribution_touchpoints').insert({
            store_id: storeId,
            customer_identifier: customerEmail,
            identifier_type: 'email',
            touchpoint_type: touchpointType,
            utm_source: tpPlatform !== 'direct' ? tpPlatform : null,
            utm_medium: tpPlatform === 'facebook' || tpPlatform === 'tiktok' ? 'social' :
                        tpPlatform === 'google' ? 'cpc' :
                        tpPlatform === 'organic' ? 'organic' : null,
            utm_campaign: tpCampaign?.name || null,
            fbclid: tpPlatform === 'facebook' ? `fb.1.${Date.now()}.${randomBetween(1000000000, 9999999999)}` : null,
            gclid: tpPlatform === 'google' ? `Cj0KCQiA${Math.random().toString(36).substring(2, 15)}` : null,
            ttclid: tpPlatform === 'tiktok' ? `tt_${Math.random().toString(36).substring(2, 15)}` : null,
            landing_page: `https://${store.shop_domain}/products/${product.id}`,
            referrer: tpPlatform === 'facebook' ? 'https://facebook.com' :
                      tpPlatform === 'google' ? 'https://google.com' :
                      tpPlatform === 'tiktok' ? 'https://tiktok.com' : null,
            session_id: sessionId,
            device_type: randomChoice(['desktop', 'mobile', 'mobile', 'tablet']),
            occurred_at: tpDate.toISOString(),
          });

          if (!error) results.touchpoints++;
        }
      }
    }

    // 7. Create Pixel Events (for funnel visualization)
    const totalVisitors = ordersCount * 5; // ~20% conversion rate

    for (let v = 0; v < totalVisitors; v++) {
      const visitorId = generateVisitorId();
      const sessionId = generateSessionId();
      const daysAgo = randomBetween(0, daysBack);
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - daysAgo);

      const device = randomChoice(['desktop', 'mobile', 'mobile', 'tablet']); // More mobile
      const browser = randomChoice(['Chrome', 'Safari', 'Firefox', 'Edge']);
      const os = device === 'mobile'
        ? randomChoice(['iOS', 'Android'])
        : randomChoice(['Windows', 'macOS', 'Linux']);

      const utmSource = randomChoice(['facebook', 'google', 'tiktok', 'instagram', null, null]);
      const utmMedium = utmSource ? (utmSource === 'google' ? 'cpc' : 'social') : null;
      const fbclid = utmSource === 'facebook' ? `fb.1.${Date.now()}.${randomBetween(1000000000, 9999999999)}` : null;
      const gclid = utmSource === 'google' ? `Cj0KCQiA${Math.random().toString(36).substring(2, 15)}` : null;

      // Funnel stages with realistic drop-off
      const stages: Array<{ type: string; dropRate: number }> = [
        { type: 'page_view', dropRate: 0 },      // 100% see page
        { type: 'add_to_cart', dropRate: 0.70 }, // 30% add to cart
        { type: 'begin_checkout', dropRate: 0.50 }, // 50% of those checkout
        { type: 'purchase', dropRate: 0.40 },    // 60% of those purchase
      ];

      const product = randomChoice(PRODUCTS);
      let continueJourney = true;

      for (let s = 0; s < stages.length && continueJourney; s++) {
        const stage = stages[s];

        // Check if visitor drops off
        if (s > 0 && Math.random() < stage.dropRate) {
          continueJourney = false;
          break;
        }

        const eventTime = new Date(baseDate);
        eventTime.setMinutes(eventTime.getMinutes() + s * randomBetween(1, 10));

        const eventData: Record<string, unknown> = {};
        if (stage.type !== 'page_view') {
          eventData.product_id = product.id;
          eventData.product_title = product.title;
          eventData.value = product.price;
        }
        if (stage.type === 'purchase') {
          eventData.order_id = `demo_pixel_${Date.now()}_${v}`;
        }

        const { error } = await supabase.from('pixel_events').insert({
          store_id: storeId,
          event_type: stage.type,
          event_data: eventData,
          visitor_id: visitorId,
          session_id: sessionId,
          customer_email: stage.type === 'purchase' ? generateEmail() : null,
          utm_source: utmSource,
          utm_medium: utmMedium,
          fbclid,
          gclid,
          page_url: `https://${store.shop_domain}/products/${product.id}`,
          page_title: product.title,
          device_type: device,
          browser,
          os,
          country: randomChoice(['US', 'US', 'US', 'CA', 'GB', 'AU']),
          client_timestamp: eventTime.toISOString(),
          created_at: eventTime.toISOString(),
        });

        if (!error) results.pixelEvents++;
      }
    }

    // Calculate summary stats
    const { data: summaryData } = await supabase
      .from('adwyse_orders')
      .select('total_price')
      .eq('store_id', storeId)
      .like('shopify_order_id', 'demo_%');

    const totalRevenue = summaryData?.reduce((sum, o) => sum + parseFloat(o.total_price), 0) || 0;

    const { data: spendData } = await supabase
      .from('adwyse_campaigns')
      .select('spend')
      .eq('store_id', storeId)
      .like('platform_campaign_id', 'demo_%');

    const totalSpend = spendData?.reduce((sum, c) => sum + parseFloat(c.spend), 0) || 0;

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      results,
      summary: {
        daysOfData: daysBack,
        totalRevenue: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        totalAdSpend: `$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        overallRoas: totalSpend > 0 ? `${(totalRevenue / totalSpend).toFixed(2)}x` : 'N/A',
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json({
      error: 'Failed to seed demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check demo data status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

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

    // Count demo data
    const [orders, campaigns, pixelEvents, adAccounts, creatives, touchpoints] = await Promise.all([
      supabase.from('adwyse_orders').select('id', { count: 'exact', head: true }).eq('store_id', storeId).like('shopify_order_id', 'demo_%'),
      supabase.from('adwyse_campaigns').select('id', { count: 'exact', head: true }).eq('store_id', storeId).like('platform_campaign_id', 'demo_%'),
      supabase.from('pixel_events').select('id', { count: 'exact', head: true }).eq('store_id', storeId).like('visitor_id', 'vis_%'),
      supabase.from('adwyse_ad_accounts').select('id', { count: 'exact', head: true }).eq('store_id', storeId).like('access_token', 'demo_%'),
      supabase.from('ad_creatives').select('id', { count: 'exact', head: true }).eq('store_id', storeId).like('creative_id', 'demo_%'),
      supabase.from('attribution_touchpoints').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    ]);

    return NextResponse.json({
      hasDemo: (orders.count || 0) > 0,
      counts: {
        orders: orders.count || 0,
        campaigns: campaigns.count || 0,
        pixelEvents: pixelEvents.count || 0,
        adAccounts: adAccounts.count || 0,
        creatives: creatives.count || 0,
        touchpoints: touchpoints.count || 0,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check demo status' }, { status: 500 });
  }
}

// DELETE endpoint to clear demo data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

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

    // Delete demo data (order matters due to foreign keys)
    await supabase.from('adwyse_order_line_items').delete().eq('store_id', storeId);
    await supabase.from('adwyse_orders').delete().eq('store_id', storeId).like('shopify_order_id', 'demo_%');
    await supabase.from('pixel_events').delete().eq('store_id', storeId).like('visitor_id', 'vis_%');
    await supabase.from('ad_creatives').delete().eq('store_id', storeId).like('creative_id', 'demo_%');
    await supabase.from('adwyse_campaigns').delete().eq('store_id', storeId).like('platform_campaign_id', 'demo_%');
    await supabase.from('adwyse_ad_accounts').delete().eq('store_id', storeId).like('access_token', 'demo_%');
    await supabase.from('product_costs').delete().eq('store_id', storeId).eq('source', 'demo');
    await supabase.from('attribution_touchpoints').delete().eq('store_id', storeId);

    return NextResponse.json({ success: true, message: 'Demo data cleared' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear demo data' }, { status: 500 });
  }
}
