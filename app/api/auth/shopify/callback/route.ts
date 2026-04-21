import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Returns an HTML page that redirects window.top (breaks out of Shopify's iframe).
 * Required for embedded apps — NextResponse.redirect() stays inside the iframe
 * and Shopify's billing approval page never renders, causing the charge to expire.
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    // Basic validation
    if (!code || !shop) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // State validation is optional - App Store installs don't use our install endpoint
    // so they won't have state cookies. HMAC validation is sufficient for security.
    const storedState = request.cookies.get('shopify_oauth_state')?.value;
    const storedShop = request.cookies.get('shopify_oauth_shop')?.value;
    const merchantId = request.cookies.get('shopify_oauth_merchant_id')?.value; // Optional - for existing users

    if (storedState && state && state !== storedState) {
      // Only validate state if we have both and they don't match
      console.error('❌ State mismatch');
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    if (storedState && state && state === storedState) {
      console.log('✅ State validated (custom install)');
    } else {
      console.log('ℹ️  App Store install (skipping state validation, HMAC will be validated)');
    }

    // Verify shop matches if stored (security check for custom installs)
    if (storedShop && storedShop !== shop) {
      console.error('❌ Shop mismatch');
      return NextResponse.json({ error: 'Shop mismatch' }, { status: 400 });
    }

    // Verify HMAC (Shopify security check)
    const query = new URLSearchParams(searchParams.toString());
    query.delete('hmac');
    const message = Array.from(query.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    const secrets = [
      process.env.SHOPIFY_API_SECRET,
      process.env.SHOPIFY_API_SECRET_PRODUCTION,
      process.env.SHOPIFY_API_SECRET_DEV,
    ].filter(Boolean);

    let hmacValid = false;
    for (const secret of secrets) {
      const generatedHmac = crypto
        .createHmac('sha256', secret!)
        .update(message)
        .digest('hex');

      if (generatedHmac === hmac) {
        hmacValid = true;
        console.log('✅ HMAC validated successfully');
        break;
      }
    }

    if (!hmacValid) {
      console.error('❌ HMAC validation failed');
      return NextResponse.json({ error: 'HMAC validation failed' }, { status: 403 });
    }

    // Exchange code for access token
    const apiKey = process.env.SHOPIFY_API_KEY || process.env.SHOPIFY_CLIENT_ID_PRODUCTION || process.env.SHOPIFY_CLIENT_ID_DEV;
    const apiSecret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_API_SECRET_PRODUCTION || process.env.SHOPIFY_API_SECRET_DEV;

    console.log('🔑 Using API credentials:', apiKey ? (apiKey.substring(0, 8) + '...') : 'MISSING');

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('🔑 Token exchange result:', accessToken ? (accessToken.substring(0, 10) + '...') : 'EMPTY/MISSING');

    // Get shop details from Shopify
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!shopResponse.ok) {
      throw new Error('Failed to fetch shop details');
    }

    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;

    // Save store to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side operations
    );

    // AdWyse schema: Check if store already exists, create if not
    console.log('🏪 Checking for existing store:', shop);

    const { data: existingStore } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .maybeSingle();

    let store;

    if (existingStore) {
      console.log('✅ Store already exists, updating access token');

      // Update existing store with new access token and reset trial
      const { data: updatedStore, error: updateError } = await supabase
        .from('stores')
        .update({
          access_token: accessToken,
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Reset 7-day trial
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStore.id)
        .select()
        .single();

      if (updateError) {
        console.error('Store update error:', updateError);
        return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
      }

      store = updatedStore;
    } else {
      console.log('🆕 Creating new store');

      // Create new store (AdWyse schema: each store is its own merchant)
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          shop_domain: shop,
          shopify_store_id: shopInfo.id?.toString(),
          store_name: shopInfo.name || shop,
          email: shopInfo.email,
          access_token: accessToken,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (storeError) {
        console.error('Store creation error:', storeError);
        return NextResponse.json({ error: 'Failed to save store' }, { status: 500 });
      }

      store = newStore;
    }

    console.log('✅ Store ready:', store.id);

    // Register webhooks for abandoned carts
    // Now that we have protected customer data access, we can use checkouts/* webhooks
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`;

    console.log('🔧 Attempting to register webhooks for', shop);
    console.log('📍 Webhook URL:', webhookUrl);

    // Register carts/create webhook (when cart is created)
    const cartsCreateResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'carts/create',
          address: webhookUrl,
          format: 'json',
        },
      }),
    });

    const cartsCreateData = await cartsCreateResponse.json();
    if (!cartsCreateResponse.ok) {
      console.error('❌ Failed to register carts/create webhook:', cartsCreateData);
    } else {
      console.log('✅ carts/create webhook registered:', cartsCreateData.webhook?.id);
    }

    // Register carts/update webhook (when cart is updated)
    const cartsUpdateResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'carts/update',
          address: webhookUrl,
          format: 'json',
        },
      }),
    });

    const cartsUpdateData = await cartsUpdateResponse.json();
    if (!cartsUpdateResponse.ok) {
      console.error('❌ Failed to register carts/update webhook:', cartsUpdateData);
    } else {
      console.log('✅ carts/update webhook registered:', cartsUpdateData.webhook?.id);
    }

    // Register checkouts/create webhook (when checkout is created - captures email!)
    const checkoutsCreateResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'checkouts/create',
          address: webhookUrl,
          format: 'json',
        },
      }),
    });

    const checkoutsCreateData = await checkoutsCreateResponse.json();
    if (!checkoutsCreateResponse.ok) {
      console.error('❌ Failed to register checkouts/create webhook:', checkoutsCreateData);
    } else {
      console.log('✅ checkouts/create webhook registered:', checkoutsCreateData.webhook?.id);
    }

    // Register checkouts/update webhook (when checkout is updated/abandoned)
    const checkoutsUpdateResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'checkouts/update',
          address: webhookUrl,
          format: 'json',
        },
      }),
    });

    const checkoutsUpdateData = await checkoutsUpdateResponse.json();
    if (!checkoutsUpdateResponse.ok) {
      console.error('❌ Failed to register checkouts/update webhook:', checkoutsUpdateData);
    } else {
      console.log('✅ checkouts/update webhook registered:', checkoutsUpdateData.webhook?.id);
    }

    // Register app/uninstalled webhook (for cleanup when merchant uninstalls)
    const uninstallResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'app/uninstalled',
          address: `${webhookUrl}/uninstall`,
          format: 'json',
        },
      }),
    });

    const uninstallData = await uninstallResponse.json();
    if (!uninstallResponse.ok) {
      console.error('❌ Failed to register app/uninstalled webhook:', uninstallData);
    } else {
      console.log('✅ app/uninstalled webhook registered:', uninstallData.webhook?.id);
    }

    // Register orders/create webhook (to track recovered carts)
    const ordersResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'orders/create',
          address: `${webhookUrl}/orders`,
          format: 'json',
        },
      }),
    });

    const ordersData = await ordersResponse.json();
    if (!ordersResponse.ok) {
      console.error('❌ Failed to register orders/create webhook:', ordersData);
    } else {
      console.log('✅ orders/create webhook registered:', ordersData.webhook?.id);
    }

    // Register GDPR compliance webhooks (REQUIRED by Shopify)
    const complianceTopics = [
      'customers/data_request',
      'customers/redact',
      'shop/redact'
    ];

    for (const complianceTopic of complianceTopics) {
      const complianceResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic: complianceTopic,
            address: `${webhookUrl}/compliance`,
            format: 'json',
          },
        }),
      });

      const complianceData = await complianceResponse.json();
      if (!complianceResponse.ok) {
        console.error(`❌ Failed to register ${complianceTopic} webhook:`, complianceData);
      } else {
        console.log(`✅ ${complianceTopic} webhook registered:`, complianceData.webhook?.id);
      }
    }

    // Register customer event webhooks (REQUIRED for Built for Shopify - Ads & Analytics category)
    const customerTopics = [
      'customers/create',
      'customers/update',
      'customers/delete'
    ];

    for (const customerTopic of customerTopics) {
      const customerResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic: customerTopic,
            address: `${webhookUrl}/customers`,
            format: 'json',
          },
        }),
      });

      const customerData = await customerResponse.json();
      if (!customerResponse.ok) {
        // Check if already exists (not an error)
        if (customerResponse.status !== 409 && !JSON.stringify(customerData).includes('already exists')) {
          console.error(`❌ Failed to register ${customerTopic} webhook:`, customerData);
        } else {
          console.log(`⚠️ ${customerTopic} webhook already exists`);
        }
      } else {
        console.log(`✅ ${customerTopic} webhook registered:`, customerData.webhook?.id);
      }
    }

    // Register APP_SUBSCRIPTIONS_UPDATE webhook (for billing status changes)
    const subscriptionWebhookResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'app_subscriptions/update',
          address: `${webhookUrl}/subscription`,
          format: 'json',
        },
      }),
    });

    const subscriptionWebhookData = await subscriptionWebhookResponse.json();
    if (!subscriptionWebhookResponse.ok) {
      console.error('❌ Failed to register app_subscriptions/update webhook:', subscriptionWebhookData);
    } else {
      console.log('✅ app_subscriptions/update webhook registered:', subscriptionWebhookData.webhook?.id);
    }

    console.log('✅ Webhook registration process completed for', shop);

    // Don't force billing during install — merchant starts on free tier
    // They can upgrade to Pro ($99.99/mo) from the dashboard when ready
    const shopName = shop.replace('.myshopify.com', '');
    const clientId = process.env.SHOPIFY_API_KEY;
    const dashboardUrl = `https://admin.shopify.com/store/${shopName}/apps/${clientId}?shop=${shop}`;
    console.log('📍 Install complete, redirecting to dashboard (free tier):', dashboardUrl);
    return new NextResponse(
      topLevelRedirectHTML(dashboardUrl, 'Loading AdWyse...'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    // Redirect to Shopify admin app page on error (top-level for embedded apps)
    const shopParam = request.nextUrl.searchParams.get('shop');
    if (shopParam) {
      const shopName = shopParam.replace('.myshopify.com', '');
      const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${process.env.SHOPIFY_API_KEY}?error=oauth_failed`;
      return new NextResponse(
        topLevelRedirectHTML(shopifyAdminUrl, 'Redirecting...'),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
    return new NextResponse(
      topLevelRedirectHTML(new URL('/dashboard?error=oauth_failed', request.url).toString(), 'Redirecting...'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
