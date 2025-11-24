/**
 * Setup script to create a test store and sample campaign data
 * Run with: npx tsx scripts/setup-test-store.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupTestStore() {
  console.log('🚀 Setting up test store...');

  // Create or get test store
  const { data: existingStore } = await supabase
    .from('stores')
    .select('*')
    .eq('shop_domain', 'argora-test-store.myshopify.com')
    .single();

  let storeId: string;

  if (existingStore) {
    console.log('✅ Found existing store:', existingStore.id);
    storeId = existingStore.id;
  } else {
    const { data: newStore, error } = await supabase
      .from('stores')
      .insert({
        shop_domain: 'argora-test-store.myshopify.com',
        store_name: 'Argora Test Store',
        email: 'test@argora.com',
        access_token: 'test_token',
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating store:', error);
      return;
    }

    console.log('✅ Created new store:', newStore.id);
    storeId = newStore.id;
  }

  // Create sample campaigns
  const campaigns = [
    {
      store_id: storeId,
      source: 'facebook',
      campaign_name: 'Black Friday Sale - Retargeting',
      ad_spend: 1250.00,
      impressions: 45000,
      clicks: 890,
      orders: 45,
      revenue: 3375.00,
      roas: 2.70,
    },
    {
      store_id: storeId,
      source: 'facebook',
      campaign_name: 'Holiday Collection - Cold Traffic',
      ad_spend: 2100.00,
      impressions: 120000,
      clicks: 1200,
      orders: 28,
      revenue: 2240.00,
      roas: 1.07,
    },
    {
      store_id: storeId,
      source: 'facebook',
      campaign_name: 'Bestsellers - Lookalike Audience',
      ad_spend: 850.00,
      impressions: 35000,
      clicks: 720,
      orders: 52,
      revenue: 4160.00,
      roas: 4.89,
    },
    {
      store_id: storeId,
      source: 'facebook',
      campaign_name: 'New Customer Acquisition',
      ad_spend: 1500.00,
      impressions: 80000,
      clicks: 950,
      orders: 18,
      revenue: 1440.00,
      roas: 0.96,
    },
  ];

  console.log('📊 Creating sample campaigns...');

  for (const campaign of campaigns) {
    const { error } = await supabase
      .from('campaigns')
      .upsert(campaign, { onConflict: 'store_id,source,campaign_name' });

    if (error) {
      console.error('❌ Error creating campaign:', error);
    } else {
      console.log(`✅ Created campaign: ${campaign.campaign_name}`);
    }
  }

  // Create sample orders
  console.log('📦 Creating sample orders...');

  const orders = [
    { total_price: 75.00, utm_source: 'facebook', utm_campaign: 'Black Friday Sale - Retargeting' },
    { total_price: 120.00, utm_source: 'facebook', utm_campaign: 'Bestsellers - Lookalike Audience' },
    { total_price: 80.00, utm_source: 'facebook', utm_campaign: 'Holiday Collection - Cold Traffic' },
    { total_price: 95.00, utm_source: 'facebook', utm_campaign: 'Black Friday Sale - Retargeting' },
    { total_price: 65.00, utm_source: 'facebook', utm_campaign: 'New Customer Acquisition' },
  ];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const { error } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        shopify_order_id: `test_order_${Date.now()}_${i}`,
        shopify_order_number: `#${1000 + i}`,
        customer_email: `customer${i}@test.com`,
        total_price: order.total_price,
        currency: 'USD',
        utm_source: order.utm_source,
        utm_campaign: order.utm_campaign,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (!error) {
      console.log(`✅ Created order #${1000 + i}`);
    }
  }

  console.log('\n🎉 Test store setup complete!');
  console.log('\nStore ID:', storeId);
  console.log('Shop Domain: argora-test-store.myshopify.com');
  console.log('\nYou can now:');
  console.log('1. Access dashboard: http://localhost:3000/dashboard?shop=argora-test-store.myshopify.com');
  console.log('2. Go to Settings to connect Facebook');
  console.log('3. Generate AI insights on the dashboard');
}

setupTestStore().catch(console.error);
