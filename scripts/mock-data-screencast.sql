-- Mock Data for AdWyse Screencast
-- Run this in Supabase SQL Editor
-- IMPORTANT: Replace 'YOUR_STORE_ID' with your actual store ID from the stores table

-- First, find your store ID by running:
-- SELECT id, shop_domain, store_name FROM stores;

-- Then replace the placeholder below:
DO $$
DECLARE
  v_store_id UUID;
  v_meta_account_id UUID;
  v_google_account_id UUID;
  v_tiktok_account_id UUID;
BEGIN
  -- Get the store ID (update this query if you have multiple stores)
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store found. Please install the app first.';
  END IF;

  RAISE NOTICE 'Using store ID: %', v_store_id;

  -- =====================================================
  -- CLEAR EXISTING MOCK DATA (optional - uncomment if needed)
  -- =====================================================
  -- DELETE FROM orders WHERE store_id = v_store_id;
  -- DELETE FROM adwyse_campaigns WHERE store_id = v_store_id;
  -- DELETE FROM ad_accounts WHERE store_id = v_store_id;

  -- =====================================================
  -- CREATE AD ACCOUNTS
  -- =====================================================

  -- Meta (Facebook) Ad Account
  INSERT INTO ad_accounts (id, store_id, platform, account_id, account_name, access_token, is_connected, last_sync_at, created_at)
  VALUES (
    gen_random_uuid(),
    v_store_id,
    'facebook',
    'act_123456789',
    'Demo Store - Meta Ads',
    'mock_token_meta',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '14 days'
  )
  ON CONFLICT (store_id, platform, account_id) DO UPDATE SET
    is_connected = true,
    last_sync_at = NOW() - INTERVAL '2 hours'
  RETURNING id INTO v_meta_account_id;

  -- Google Ad Account
  INSERT INTO ad_accounts (id, store_id, platform, account_id, account_name, access_token, is_connected, last_sync_at, created_at)
  VALUES (
    gen_random_uuid(),
    v_store_id,
    'google',
    '123-456-7890',
    'Demo Store - Google Ads',
    'mock_token_google',
    true,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '14 days'
  )
  ON CONFLICT (store_id, platform, account_id) DO UPDATE SET
    is_connected = true,
    last_sync_at = NOW() - INTERVAL '3 hours'
  RETURNING id INTO v_google_account_id;

  -- TikTok Ad Account
  INSERT INTO ad_accounts (id, store_id, platform, account_id, account_name, access_token, is_connected, last_sync_at, created_at)
  VALUES (
    gen_random_uuid(),
    v_store_id,
    'tiktok',
    '7123456789012345678',
    'Demo Store - TikTok Ads',
    'mock_token_tiktok',
    true,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '7 days'
  )
  ON CONFLICT (store_id, platform, account_id) DO UPDATE SET
    is_connected = true,
    last_sync_at = NOW() - INTERVAL '1 hour'
  RETURNING id INTO v_tiktok_account_id;

  -- =====================================================
  -- CREATE CAMPAIGNS WITH DAILY DATA (last 30 days)
  -- =====================================================

  -- Meta Campaign 1: Retargeting (High ROAS)
  FOR i IN 0..29 LOOP
    INSERT INTO adwyse_campaigns (
      store_id, ad_account_id, platform_campaign_id, campaign_name, status, date,
      spend, impressions, clicks, conversions, attributed_revenue, attributed_orders
    ) VALUES (
      v_store_id,
      v_meta_account_id,
      'meta_camp_retarget_001',
      'Retargeting - Cart Abandoners',
      'active',
      CURRENT_DATE - i,
      -- Spend varies between $45-85/day
      45 + (random() * 40)::numeric(10,2),
      -- Impressions 8000-15000
      8000 + (random() * 7000)::int,
      -- Clicks 150-300
      150 + (random() * 150)::int,
      -- Conversions 3-8
      3 + (random() * 5)::int,
      -- Revenue (high ROAS ~3.5x)
      (45 + (random() * 40)) * (3.2 + random() * 0.6),
      -- Orders 3-8
      3 + (random() * 5)::int
    ) ON CONFLICT (ad_account_id, platform_campaign_id, date) DO NOTHING;
  END LOOP;

  -- Meta Campaign 2: Prospecting (Medium ROAS)
  FOR i IN 0..29 LOOP
    INSERT INTO adwyse_campaigns (
      store_id, ad_account_id, platform_campaign_id, campaign_name, status, date,
      spend, impressions, clicks, conversions, attributed_revenue, attributed_orders
    ) VALUES (
      v_store_id,
      v_meta_account_id,
      'meta_camp_prospect_001',
      'Prospecting - Lookalike Audiences',
      'active',
      CURRENT_DATE - i,
      65 + (random() * 55)::numeric(10,2),
      15000 + (random() * 10000)::int,
      200 + (random() * 200)::int,
      2 + (random() * 4)::int,
      (65 + (random() * 55)) * (1.8 + random() * 0.5),
      2 + (random() * 4)::int
    ) ON CONFLICT (ad_account_id, platform_campaign_id, date) DO NOTHING;
  END LOOP;

  -- Google Campaign 1: Shopping (Good ROAS)
  FOR i IN 0..29 LOOP
    INSERT INTO adwyse_campaigns (
      store_id, ad_account_id, platform_campaign_id, campaign_name, status, date,
      spend, impressions, clicks, conversions, attributed_revenue, attributed_orders
    ) VALUES (
      v_store_id,
      v_google_account_id,
      'google_camp_shopping_001',
      'Shopping - Best Sellers',
      'active',
      CURRENT_DATE - i,
      55 + (random() * 45)::numeric(10,2),
      12000 + (random() * 8000)::int,
      180 + (random() * 120)::int,
      4 + (random() * 6)::int,
      (55 + (random() * 45)) * (2.8 + random() * 0.7),
      4 + (random() * 6)::int
    ) ON CONFLICT (ad_account_id, platform_campaign_id, date) DO NOTHING;
  END LOOP;

  -- Google Campaign 2: Search Brand (Excellent ROAS)
  FOR i IN 0..29 LOOP
    INSERT INTO adwyse_campaigns (
      store_id, ad_account_id, platform_campaign_id, campaign_name, status, date,
      spend, impressions, clicks, conversions, attributed_revenue, attributed_orders
    ) VALUES (
      v_store_id,
      v_google_account_id,
      'google_camp_brand_001',
      'Search - Brand Terms',
      'active',
      CURRENT_DATE - i,
      25 + (random() * 20)::numeric(10,2),
      3000 + (random() * 2000)::int,
      80 + (random() * 60)::int,
      2 + (random() * 4)::int,
      (25 + (random() * 20)) * (4.5 + random() * 1.0),
      2 + (random() * 4)::int
    ) ON CONFLICT (ad_account_id, platform_campaign_id, date) DO NOTHING;
  END LOOP;

  -- TikTok Campaign 1: Video Ads (Lower ROAS but growing)
  FOR i IN 0..29 LOOP
    INSERT INTO adwyse_campaigns (
      store_id, ad_account_id, platform_campaign_id, campaign_name, status, date,
      spend, impressions, clicks, conversions, attributed_revenue, attributed_orders
    ) VALUES (
      v_store_id,
      v_tiktok_account_id,
      'tiktok_camp_video_001',
      'Video Ads - Product Showcase',
      'active',
      CURRENT_DATE - i,
      35 + (random() * 30)::numeric(10,2),
      25000 + (random() * 20000)::int,
      300 + (random() * 250)::int,
      1 + (random() * 3)::int,
      (35 + (random() * 30)) * (1.4 + random() * 0.4),
      1 + (random() * 3)::int
    ) ON CONFLICT (ad_account_id, platform_campaign_id, date) DO NOTHING;
  END LOOP;

  -- =====================================================
  -- CREATE ORDERS (last 30 days, ~60 orders total)
  -- =====================================================

  -- Facebook attributed orders (25 orders)
  FOR i IN 1..25 LOOP
    INSERT INTO orders (
      id, store_id, shopify_order_id, shopify_order_number, customer_email,
      order_total, currency, ad_source, campaign_name,
      utm_source, utm_medium, utm_campaign, fbclid, created_at
    ) VALUES (
      gen_random_uuid(),
      v_store_id,
      'mock_fb_' || i || '_' || floor(random() * 1000000)::text,
      (1000 + i)::text,
      'customer' || i || '@example.com',
      -- Order total between $45 and $285
      45 + (random() * 240)::numeric(10,2),
      'USD',
      'facebook',
      CASE WHEN random() > 0.5 THEN 'Retargeting - Cart Abandoners' ELSE 'Prospecting - Lookalike Audiences' END,
      'facebook',
      'paid',
      CASE WHEN random() > 0.5 THEN 'retargeting_q1' ELSE 'prospecting_lal' END,
      'fb.' || floor(random() * 10000000000)::text,
      NOW() - (random() * 30)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour'
    ) ON CONFLICT (store_id, shopify_order_id) DO NOTHING;
  END LOOP;

  -- Google attributed orders (20 orders)
  FOR i IN 1..20 LOOP
    INSERT INTO orders (
      id, store_id, shopify_order_id, shopify_order_number, customer_email,
      order_total, currency, ad_source, campaign_name,
      utm_source, utm_medium, utm_campaign, gclid, created_at
    ) VALUES (
      gen_random_uuid(),
      v_store_id,
      'mock_google_' || i || '_' || floor(random() * 1000000)::text,
      (1100 + i)::text,
      'shopper' || i || '@gmail.com',
      55 + (random() * 195)::numeric(10,2),
      'USD',
      'google',
      CASE WHEN random() > 0.6 THEN 'Shopping - Best Sellers' ELSE 'Search - Brand Terms' END,
      'google',
      'cpc',
      CASE WHEN random() > 0.6 THEN 'shopping_bestsellers' ELSE 'brand_search' END,
      'CjwKCAjw' || floor(random() * 1000000)::text,
      NOW() - (random() * 30)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour'
    ) ON CONFLICT (store_id, shopify_order_id) DO NOTHING;
  END LOOP;

  -- TikTok attributed orders (8 orders)
  FOR i IN 1..8 LOOP
    INSERT INTO orders (
      id, store_id, shopify_order_id, shopify_order_number, customer_email,
      order_total, currency, ad_source, campaign_name,
      utm_source, utm_medium, utm_campaign, created_at
    ) VALUES (
      gen_random_uuid(),
      v_store_id,
      'mock_tiktok_' || i || '_' || floor(random() * 1000000)::text,
      (1200 + i)::text,
      'tiktoker' || i || '@email.com',
      35 + (random() * 165)::numeric(10,2),
      'USD',
      'tiktok',
      'Video Ads - Product Showcase',
      'tiktok',
      'paid',
      'video_showcase',
      NOW() - (random() * 30)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour'
    ) ON CONFLICT (store_id, shopify_order_id) DO NOTHING;
  END LOOP;

  -- Direct/Organic orders (12 orders)
  FOR i IN 1..12 LOOP
    INSERT INTO orders (
      id, store_id, shopify_order_id, shopify_order_number, customer_email,
      order_total, currency, ad_source, created_at
    ) VALUES (
      gen_random_uuid(),
      v_store_id,
      'mock_direct_' || i || '_' || floor(random() * 1000000)::text,
      (1300 + i)::text,
      'organic' || i || '@mail.com',
      40 + (random() * 180)::numeric(10,2),
      'USD',
      'direct',
      NOW() - (random() * 30)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour'
    ) ON CONFLICT (store_id, shopify_order_id) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Mock data created successfully!';
  RAISE NOTICE 'Created: 3 ad accounts, 5 campaigns (30 days each), ~65 orders';

END $$;

-- Verify the data
SELECT 'Ad Accounts' as table_name, COUNT(*) as count FROM ad_accounts
UNION ALL
SELECT 'Campaigns (records)' as table_name, COUNT(*) as count FROM adwyse_campaigns
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as count FROM orders;

-- Show campaign summary
SELECT
  campaign_name,
  SUM(spend)::numeric(10,2) as total_spend,
  SUM(attributed_revenue)::numeric(10,2) as total_revenue,
  (SUM(attributed_revenue) / NULLIF(SUM(spend), 0))::numeric(10,2) as roas
FROM adwyse_campaigns
GROUP BY campaign_name
ORDER BY total_spend DESC;
