# ProfitPulse - Shopify Profit Analytics App Blueprint

> Complete guide to building a $99/month Shopify Profit Analytics app using the AdWyse codebase as foundation.

---

## Table of Contents
1. [App Overview](#app-overview)
2. [Tech Stack](#tech-stack)
3. [Shopify Partner Dashboard Setup](#shopify-partner-dashboard-setup)
4. [Supabase Database Schema](#supabase-database-schema)
5. [Environment Variables](#environment-variables)
6. [File Structure](#file-structure)
7. [Core API Routes](#core-api-routes)
8. [OAuth Flow](#oauth-flow)
9. [Billing Integration](#billing-integration)
10. [Webhooks](#webhooks)
11. [Dashboard Pages](#dashboard-pages)
12. [Shopify App Review Requirements](#shopify-app-review-requirements)
13. [Deployment Checklist](#deployment-checklist)
14. [Post-Launch](#post-launch)

---

## App Overview

### What is ProfitPulse?
ProfitPulse shows Shopify merchants their TRUE profit per order, product, and day by tracking:
- Cost of Goods Sold (COGS)
- Shipping costs
- Shopify fees (2.9% + $0.30 per transaction)
- Payment processing fees
- Ad spend (Facebook, Google, TikTok)
- Returns/refunds

### Value Proposition
"Stop guessing your profits. Know exactly how much you make on every order."

### Pricing
- $99/month with 7-day free trial
- No usage limits
- All features included

### Target Market
- Shopify merchants doing $10k-$500k/month
- Currently using spreadsheets or guessing profits
- Competitors: Triple Whale ($129-599/mo), BeProfit ($25-150/mo)

---

## Tech Stack

Same as AdWyse:
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS
- **Shopify**: App Bridge CDN, REST Admin API
- **AI**: Claude API (for profit insights)

---

## Shopify Partner Dashboard Setup

### 1. Create New App
1. Go to https://partners.shopify.com
2. Apps → Create app → Create app manually
3. App name: "ProfitPulse"

### 2. App Setup Configuration
```
App URL: https://profitpulse.app
Allowed redirection URL(s):
  - https://profitpulse.app/api/auth/shopify/callback
  - https://profitpulse.app/api/billing/callback

Embedded app: Yes
App Proxy: Not needed
```

### 3. API Access Scopes (IMPORTANT)
Request ONLY what you need:
```
read_orders          - Required for order/profit data
read_products        - Required for COGS per product
read_customers       - Optional for customer LTV
read_inventory       - Optional for inventory costs
```

### 4. App Pricing (Partner Dashboard → App Setup → Pricing)
**CRITICAL**: Set to "Manual pricing" NOT "Managed pricing"
- This allows you to use the Billing API
- Managed pricing causes 403 errors

Configure:
- Price: $99.00 USD / month
- Trial: 7 days
- Usage charges: None

### 5. Compliance Webhooks (GDPR)
Set these URLs in Partner Dashboard → App Setup → Compliance webhooks:
```
Customer data request: https://profitpulse.app/api/webhooks/customers/data-request
Customer data erasure: https://profitpulse.app/api/webhooks/customers/redact
Shop data erasure: https://profitpulse.app/api/webhooks/shop/redact
```

---

## Supabase Database Schema

### Create Tables

```sql
-- Stores table (main table linking Shopify stores)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT UNIQUE NOT NULL,
  store_name TEXT,
  email TEXT,
  access_token TEXT NOT NULL,
  scope TEXT,
  subscription_status TEXT DEFAULT 'trial',
  billing_charge_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (for COGS tracking)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT,
  title TEXT,
  sku TEXT,
  cost_per_item DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  handling_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, shopify_variant_id)
);

-- Orders table (synced from Shopify)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_order_id TEXT NOT NULL,
  order_number TEXT,
  customer_email TEXT,
  subtotal_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  total_shipping DECIMAL(10,2),
  total_discounts DECIMAL(10,2),
  currency TEXT,
  financial_status TEXT,
  fulfillment_status TEXT,
  -- Calculated costs
  total_cogs DECIMAL(10,2) DEFAULT 0,
  total_shipping_cost DECIMAL(10,2) DEFAULT 0,
  payment_processing_fee DECIMAL(10,2) DEFAULT 0,
  shopify_fee DECIMAL(10,2) DEFAULT 0,
  -- Profit calculations
  gross_profit DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  -- Attribution
  attributed_platform TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ad_cost DECIMAL(10,2) DEFAULT 0,
  -- Timestamps
  order_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, shopify_order_id)
);

-- Order line items
CREATE TABLE order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_line_item_id TEXT NOT NULL,
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  title TEXT,
  quantity INTEGER,
  price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  cost_per_item DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  profit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad spend tracking (daily aggregates per platform/campaign)
CREATE TABLE ad_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL, -- 'facebook', 'google', 'tiktok'
  campaign_id TEXT,
  campaign_name TEXT,
  ad_set_id TEXT,
  ad_set_name TEXT,
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, date, platform, campaign_id)
);

-- Ad platform connections
CREATE TABLE ad_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'google', 'tiktok'
  account_id TEXT,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, platform)
);

-- Store settings
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  default_cogs_percentage DECIMAL(5,2) DEFAULT 30, -- Default 30% if no COGS set
  default_shipping_cost DECIMAL(10,2) DEFAULT 0,
  payment_processing_rate DECIMAL(5,4) DEFAULT 0.029, -- 2.9%
  payment_processing_fixed DECIMAL(10,2) DEFAULT 0.30, -- $0.30
  shopify_plan TEXT DEFAULT 'basic', -- basic, shopify, advanced
  shopify_fee_rate DECIMAL(5,4) DEFAULT 0.02, -- 2% for basic
  include_taxes_in_revenue BOOLEAN DEFAULT false,
  include_shipping_in_revenue BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights (profit optimization recommendations)
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  insight_type TEXT, -- 'profit_alert', 'optimization', 'weekly_summary'
  title TEXT,
  content TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_order_created_at ON orders(order_created_at);
CREATE INDEX idx_order_line_items_order_id ON order_line_items(order_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_ad_spend_store_date ON ad_spend(store_id, date);
```

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- For service role (API routes), RLS is bypassed
-- For client-side, you'd add policies based on auth
```

---

## Environment Variables

### Vercel Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Shopify App (from Partner Dashboard)
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_API_SECRET=your_api_secret
NEXT_PUBLIC_SHOPIFY_API_KEY=your_client_id

# App URL
NEXT_PUBLIC_APP_URL=https://profitpulse.app

# AI (for insights)
ANTHROPIC_API_KEY=sk-ant-...

# Ad Platforms (optional - for ad spend sync)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Local Development (.env.local)
Same as above but with dev credentials and:
```env
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
```

---

## File Structure

```
profitpulse/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with App Bridge script
│   ├── dashboard/
│   │   ├── page.tsx               # Main profit dashboard
│   │   ├── orders/page.tsx        # Orders with profit breakdown
│   │   ├── products/page.tsx      # Product COGS management
│   │   ├── analytics/page.tsx     # Charts and trends
│   │   └── settings/page.tsx      # Store settings, ad connections
│   └── api/
│       ├── auth/
│       │   └── shopify/
│       │       ├── install/route.ts    # OAuth start
│       │       └── callback/route.ts   # OAuth callback + billing
│       ├── billing/
│       │   ├── create/route.ts         # Create billing charge
│       │   └── callback/route.ts       # Billing approval callback
│       ├── stores/
│       │   └── lookup/route.ts         # Get store by shop domain
│       ├── orders/
│       │   ├── list/route.ts           # List orders with profit
│       │   ├── sync/route.ts           # Sync orders from Shopify
│       │   └── calculate/route.ts      # Recalculate profits
│       ├── products/
│       │   ├── list/route.ts           # List products
│       │   ├── sync/route.ts           # Sync from Shopify
│       │   └── update-cogs/route.ts    # Update COGS
│       ├── analytics/
│       │   ├── summary/route.ts        # Dashboard summary stats
│       │   ├── trends/route.ts         # Profit trends over time
│       │   └── by-product/route.ts     # Profit by product
│       ├── insights/
│       │   ├── generate/route.ts       # Generate AI insights
│       │   └── list/route.ts           # Get insights
│       ├── sync/
│       │   ├── facebook/route.ts       # Sync Facebook ad spend
│       │   └── google/route.ts         # Sync Google ad spend
│       └── webhooks/
│           ├── shopify/
│           │   ├── orders/route.ts     # Order create/update webhook
│           │   └── uninstall/route.ts  # App uninstall webhook
│           └── customers/
│               ├── data-request/route.ts
│               └── redact/route.ts
├── lib/
│   ├── supabase-client.ts
│   ├── supabase-server.ts
│   ├── shopify-app-bridge.ts
│   └── profit-calculator.ts        # Profit calculation logic
├── shopify.app.profitpulse.toml    # Shopify CLI config
└── package.json
```

---

## Core API Routes

### 1. OAuth Install (`/api/auth/shopify/install/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Validate shop format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return NextResponse.json({ error: 'Invalid shop format' }, { status: 400 });
  }

  const state = crypto.randomBytes(32).toString('hex');
  const scopes = 'read_orders,read_products';
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`;

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  // Return HTML that redirects (handles iframe breakout)
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${authUrl}">
      </head>
      <body>
        <script>
          if (window.top) {
            window.top.location.href = "${authUrl}";
          } else {
            window.location.href = "${authUrl}";
          }
        </script>
      </body>
    </html>
  `;

  const response = new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });

  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600
  });

  return response;
}
```

### 2. OAuth Callback (`/api/auth/shopify/callback/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const hmac = searchParams.get('hmac');

  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Validate HMAC
  const secret = process.env.SHOPIFY_API_SECRET!;
  const params = new URLSearchParams(searchParams);
  params.delete('hmac');
  params.sort();
  const message = params.toString();
  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  if (generatedHmac !== hmac) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 403 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
  }

  const { access_token, scope } = await tokenResponse.json();

  // Get shop info
  const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': access_token },
  });
  const shopData = await shopResponse.json();

  // Save to Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: store, error } = await supabase
    .from('stores')
    .upsert({
      shop_domain: shop,
      store_name: shopData.shop.name,
      email: shopData.shop.email,
      access_token,
      scope,
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      currency: shopData.shop.currency,
      timezone: shopData.shop.iana_timezone,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'shop_domain',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save store:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Create default settings
  await supabase
    .from('store_settings')
    .upsert({
      store_id: store.id,
    }, {
      onConflict: 'store_id',
    });

  // Register webhooks
  const webhooks = [
    { topic: 'orders/create', address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders` },
    { topic: 'orders/updated', address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders` },
    { topic: 'app/uninstalled', address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/uninstall` },
  ];

  for (const webhook of webhooks) {
    await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webhook }),
    });
  }

  // Create billing charge
  const isTestStore = shop.includes('-test') || shop.includes('development');
  const shopName = shop.replace('.myshopify.com', '');
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_CLIENT_ID}`;

  const chargeResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': access_token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recurring_application_charge: {
        name: 'ProfitPulse - Pro Plan',
        price: 99.99,
        trial_days: 7,
        return_url: returnUrl,
        // IMPORTANT: Only include test flag for dev stores
        ...(isTestStore && { test: true }),
      }
    })
  });

  if (chargeResponse.ok) {
    const chargeData = await chargeResponse.json();
    const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;
    return NextResponse.redirect(confirmationUrl);
  }

  // If billing failed, redirect to app
  return NextResponse.redirect(`https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_CLIENT_ID}?billing_error=true`);
}
```

### 3. Billing Create (`/api/billing/create/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { storeId, shop } = await request.json();

  if (!storeId || !shop) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error || !store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const accessToken = store.access_token;

  if (!accessToken || accessToken === 'revoked') {
    return NextResponse.json({ error: 'OAuth required', needsOAuth: true }, { status: 401 });
  }

  // Check existing charges
  const existingResponse = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
    { headers: { 'X-Shopify-Access-Token': accessToken } }
  );

  if (existingResponse.status === 401 || existingResponse.status === 403) {
    return NextResponse.json({ error: 'OAuth required', needsOAuth: true }, { status: 401 });
  }

  if (existingResponse.ok) {
    const charges = await existingResponse.json();

    // Already active
    const active = charges.recurring_application_charges?.find((c: any) => c.status === 'active');
    if (active) {
      await supabase
        .from('stores')
        .update({ subscription_status: 'active', billing_charge_id: active.id.toString() })
        .eq('id', storeId);
      return NextResponse.json({ status: 'active' });
    }

    // Has pending
    const pending = charges.recurring_application_charges?.find((c: any) => c.status === 'pending');
    if (pending) {
      return NextResponse.json({ status: 'pending', confirmationUrl: pending.confirmation_url });
    }
  }

  // Create new charge
  const isTestStore = shop.includes('-test') || shop.includes('development');
  const shopName = shop.replace('.myshopify.com', '');
  const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_CLIENT_ID}`;

  const chargeResponse = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'ProfitPulse - Pro Plan',
          price: 99.99,
          trial_days: 7,
          return_url: returnUrl,
          ...(isTestStore && { test: true }),
        },
      }),
    }
  );

  if (!chargeResponse.ok) {
    const error = await chargeResponse.json().catch(() => null);
    if (chargeResponse.status === 401 || chargeResponse.status === 403) {
      return NextResponse.json({ error: 'OAuth required', needsOAuth: true }, { status: 401 });
    }
    return NextResponse.json({ error: 'Billing failed', details: error }, { status: 500 });
  }

  const chargeData = await chargeResponse.json();
  return NextResponse.json({
    status: 'created',
    confirmationUrl: chargeData.recurring_application_charge.confirmation_url
  });
}
```

### 4. Orders Webhook (`/api/webhooks/shopify/orders/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const shop = request.headers.get('x-shopify-shop-domain');
  const topic = request.headers.get('x-shopify-topic');

  // Validate HMAC
  const secret = process.env.SHOPIFY_API_SECRET!;
  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  if (generatedHmac !== hmac) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const order = JSON.parse(body);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('shop_domain', shop)
    .single();

  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Get store settings for fee calculations
  const { data: settings } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', store.id)
    .single();

  const processingRate = settings?.payment_processing_rate || 0.029;
  const processingFixed = settings?.payment_processing_fixed || 0.30;
  const shopifyFeeRate = settings?.shopify_fee_rate || 0.02;
  const defaultCogsPercent = settings?.default_cogs_percentage || 30;

  // Calculate fees
  const totalPrice = parseFloat(order.total_price) || 0;
  const paymentFee = (totalPrice * processingRate) + processingFixed;
  const shopifyFee = totalPrice * shopifyFeeRate;

  // Extract attribution from landing_site or note_attributes
  let utmSource = null, utmMedium = null, utmCampaign = null, platform = 'direct';

  if (order.landing_site) {
    const url = new URL(order.landing_site, 'https://example.com');
    utmSource = url.searchParams.get('utm_source');
    utmMedium = url.searchParams.get('utm_medium');
    utmCampaign = url.searchParams.get('utm_campaign');

    if (url.searchParams.get('fbclid')) platform = 'facebook';
    else if (url.searchParams.get('gclid')) platform = 'google';
    else if (url.searchParams.get('ttclid')) platform = 'tiktok';
    else if (utmSource) platform = utmSource.toLowerCase();
  }

  // Calculate COGS from line items
  let totalCogs = 0;
  const lineItemsToInsert = [];

  for (const item of order.line_items || []) {
    // Get product COGS from our database
    const { data: product } = await supabase
      .from('products')
      .select('cost_per_item')
      .eq('store_id', store.id)
      .eq('shopify_variant_id', item.variant_id?.toString())
      .single();

    const costPerItem = product?.cost_per_item || (parseFloat(item.price) * (defaultCogsPercent / 100));
    const itemTotalCost = costPerItem * item.quantity;
    totalCogs += itemTotalCost;

    lineItemsToInsert.push({
      store_id: store.id,
      shopify_line_item_id: item.id.toString(),
      shopify_product_id: item.product_id?.toString(),
      shopify_variant_id: item.variant_id?.toString(),
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      total_price: parseFloat(item.price) * item.quantity,
      cost_per_item: costPerItem,
      total_cost: itemTotalCost,
      profit: (parseFloat(item.price) * item.quantity) - itemTotalCost,
    });
  }

  // Calculate profits
  const revenue = totalPrice;
  const grossProfit = revenue - totalCogs;
  const netProfit = grossProfit - paymentFee - shopifyFee;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Upsert order
  const { data: savedOrder, error: orderError } = await supabase
    .from('orders')
    .upsert({
      store_id: store.id,
      shopify_order_id: order.id.toString(),
      order_number: order.order_number?.toString() || order.name,
      customer_email: order.email,
      subtotal_price: parseFloat(order.subtotal_price) || 0,
      total_price: totalPrice,
      total_tax: parseFloat(order.total_tax) || 0,
      total_shipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount) || 0,
      total_discounts: parseFloat(order.total_discounts) || 0,
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_cogs: totalCogs,
      payment_processing_fee: paymentFee,
      shopify_fee: shopifyFee,
      gross_profit: grossProfit,
      net_profit: netProfit,
      profit_margin: profitMargin,
      attributed_platform: platform,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      order_created_at: order.created_at,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'store_id,shopify_order_id',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Failed to save order:', orderError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Delete old line items and insert new ones
  await supabase
    .from('order_line_items')
    .delete()
    .eq('order_id', savedOrder.id);

  if (lineItemsToInsert.length > 0) {
    await supabase
      .from('order_line_items')
      .insert(lineItemsToInsert.map(item => ({ ...item, order_id: savedOrder.id })));
  }

  return NextResponse.json({ success: true });
}
```

### 5. Uninstall Webhook (`/api/webhooks/shopify/uninstall/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const shop = request.headers.get('x-shopify-shop-domain');

  // Validate HMAC
  const secret = process.env.SHOPIFY_API_SECRET!;
  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  if (generatedHmac !== hmac) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Mark store as uninstalled (don't delete data - they might reinstall)
  await supabase
    .from('stores')
    .update({
      access_token: 'revoked',
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('shop_domain', shop);

  return NextResponse.json({ success: true });
}
```

### 6. GDPR Compliance Webhooks

```typescript
// /api/webhooks/customers/data-request/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Log the request - you have 30 days to respond
  console.log('Customer data request received');
  // In production: queue a job to compile customer data
  return NextResponse.json({ success: true });
}

// /api/webhooks/customers/redact/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Delete customer data from your database
  // body.customer.email, body.customer.id
  return NextResponse.json({ success: true });
}

// /api/webhooks/shop/redact/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Delete all shop data (48 hours after uninstall)
  // body.shop_domain
  return NextResponse.json({ success: true });
}
```

### 7. Store Lookup (`/api/stores/lookup/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('shop_domain', shop)
    .single();

  if (error || !store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Return as merchant format for dashboard compatibility
  return NextResponse.json({
    merchant: {
      id: store.id,
      email: store.email,
      full_name: store.store_name,
      company: store.store_name,
      subscription_tier: store.subscription_status === 'active' ? 'pro' : 'trial',
    },
    store: {
      id: store.id,
      store_name: store.store_name,
      shop_domain: store.shop_domain,
      email: store.email,
      subscription_status: store.subscription_status,
      trial_ends_at: store.trial_ends_at,
      store_url: `https://${store.shop_domain}`,
      shopify_domain: store.shop_domain,
      status: 'active',
    }
  });
}
```

### 8. Analytics Summary (`/api/analytics/summary/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('store_id');
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

  if (!storeId) {
    return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_price, total_cogs, gross_profit, net_profit, profit_margin, attributed_platform')
    .eq('store_id', storeId)
    .gte('order_created_at', startDate.toISOString());

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Calculate summary stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalCogs = orders.reduce((sum, o) => sum + (o.total_cogs || 0), 0);
  const totalGrossProfit = orders.reduce((sum, o) => sum + (o.gross_profit || 0), 0);
  const totalNetProfit = orders.reduce((sum, o) => sum + (o.net_profit || 0), 0);
  const avgProfitMargin = totalOrders > 0
    ? orders.reduce((sum, o) => sum + (o.profit_margin || 0), 0) / totalOrders
    : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get ad spend for the period
  const { data: adSpend } = await supabase
    .from('ad_spend')
    .select('spend')
    .eq('store_id', storeId)
    .gte('date', startDate.toISOString().split('T')[0]);

  const totalAdSpend = adSpend?.reduce((sum, a) => sum + (a.spend || 0), 0) || 0;
  const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  const profitAfterAds = totalNetProfit - totalAdSpend;

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    totalCogs,
    totalGrossProfit,
    totalNetProfit,
    avgProfitMargin,
    avgOrderValue,
    totalAdSpend,
    roas,
    profitAfterAds,
  });
}
```

---

## Shopify CLI Configuration

### `shopify.app.profitpulse.toml`

```toml
client_id = "YOUR_CLIENT_ID"
name = "ProfitPulse"
application_url = "https://profitpulse.app"
embedded = true

[build]
include_config_on_deploy = true

[access_scopes]
scopes = "read_orders,read_products"
use_legacy_install_flow = false

[auth]
redirect_urls = [
  "https://profitpulse.app/api/auth/shopify/callback",
  "https://profitpulse.app/api/billing/callback"
]

[webhooks]
api_version = "2024-01"

  [[webhooks.subscriptions]]
  topics = ["orders/create", "orders/updated"]
  uri = "/api/webhooks/shopify/orders"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "/api/webhooks/shopify/uninstall"

[pos]
embedded = false
```

---

## Shopify App Review Requirements

### Automated Checks (Must Pass)
1. **App loads in iframe** - Use `embedded = true` in toml
2. **HTTPS everywhere** - Vercel handles this
3. **Valid OAuth flow** - Code above handles this
4. **Webhooks respond with 200** - Always return 200 quickly
5. **GDPR webhooks configured** - Set in Partner Dashboard
6. **No console errors** - Test thoroughly
7. **App Bridge loaded from CDN** - Add to layout.tsx

### Manual Review Requirements
1. **Billing redirect works** - User must see Shopify billing page after install
2. **Scopes justified** - Only request what you need
3. **Privacy policy** - Create /privacy page
4. **Support contact** - Provide email
5. **App functionality works** - Reviewer will test features

### App Bridge CDN (Add to `layout.tsx`)

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Common Review Rejections & Fixes

| Rejection | Fix |
|-----------|-----|
| "Billing doesn't redirect" | Use managed install flow, billing/create endpoint, App Bridge redirect |
| "App doesn't load" | Check CORS, App Bridge CDN, `embedded = true` |
| "Invalid scopes" | Only request read_orders, read_products |
| "Missing privacy policy" | Create /privacy page |
| "Test flag set" | Remove `test: true` for production stores |

---

## Deployment Checklist

### Before First Deploy
- [ ] Create Shopify Partner app
- [ ] Set up Supabase project
- [ ] Create all database tables
- [ ] Configure Vercel project
- [ ] Add all environment variables
- [ ] Set app pricing to "Manual"
- [ ] Configure GDPR webhook URLs

### Before Submitting for Review
- [ ] Test OAuth flow end-to-end
- [ ] Test billing approval flow
- [ ] Test webhooks (orders, uninstall)
- [ ] Create privacy policy page
- [ ] Create terms of service page
- [ ] Test on real test store (partner test store)
- [ ] Remove all `test: true` flags for production
- [ ] Verify GDPR webhooks respond with 200
- [ ] Check browser console for errors
- [ ] Deploy Shopify CLI config: `shopify app deploy`

### After Approval
- [ ] Announce on social media
- [ ] Set up customer support email
- [ ] Monitor Vercel logs for errors
- [ ] Set up error alerting (Sentry)

---

## Post-Launch

### Key Metrics to Track
- New installs per day
- Trial → Paid conversion rate
- Churn rate
- Support tickets
- Feature requests

### Future Features
- CSV import for historical orders
- Bulk COGS upload
- Inventory cost tracking
- Multi-currency support
- Slack/email alerts for low-profit orders
- Competitor price comparison

---

## Quick Start Commands

```bash
# Clone AdWyse and rename
cp -r adwyse profitpulse
cd profitpulse

# Update package.json name
# Update all branding/references

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in values

# Run locally with ngrok
ngrok http 3000
# Update NEXT_PUBLIC_APP_URL in .env.local

# Deploy to Vercel
vercel

# Deploy Shopify config
shopify app deploy
```

---

## Support

For questions about this blueprint, the core patterns are proven from AdWyse which passed Shopify review.

Key files to reference from AdWyse:
- `/app/api/auth/shopify/callback/route.ts` - Full OAuth + billing flow
- `/app/api/billing/create/route.ts` - Billing charge creation
- `/app/dashboard/page.tsx` - Embedded dashboard with billing check
- `/lib/shopify-app-bridge.ts` - App Bridge utilities

Good luck with ProfitPulse! 🚀
