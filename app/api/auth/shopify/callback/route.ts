import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
    const apiKey = process.env.SHOPIFY_API_KEY || process.env.SHOPIFY_CLIENT_ID_PRODUCTION || process.env.SHOPIFY_CLIENT_ID_DEV || '08fa8bc27e0e3ac857912c7e7ee289d0';
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

    console.log('✅ Webhook registration process completed for', shop);

    // Create recurring application charge for billing ($99.99/month with 7-day trial)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;

    // Use test mode for development/partner stores
    // Partner test stores often have random names, so also check for non-standard patterns
    const isTestCharge = shop.includes('-test') ||
                         shop.includes('development') ||
                         shop.includes('dev-') ||
                         /^[a-z0-9]{6,8}-[a-z0-9]{2}\.myshopify\.com$/.test(shop); // Pattern like 2unilf-1m.myshopify.com

    // Return URL goes back to Shopify admin app page (same format as working apps)
    const shopName = shop.replace('.myshopify.com', '');
    const clientId = '08fa8bc27e0e3ac857912c7e7ee289d0';
    const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/${clientId}`;

    console.log('💰 Creating billing charge with return_url:', returnUrl);
    console.log('💰 Shop:', shop);
    console.log('💰 Store ID:', store.id);
    console.log('💰 Test charge:', isTestCharge);

    // First check for existing pending charges
    const existingChargesResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    console.log('💰 Checking existing charges...');

    if (existingChargesResponse.ok) {
      const existingCharges = await existingChargesResponse.json();
      console.log('💰 Existing charges:', JSON.stringify(existingCharges.recurring_application_charges?.map((c: any) => ({
        id: c.id,
        status: c.status,
        name: c.name
      }))));

      const pendingCharge = existingCharges.recurring_application_charges?.find(
        (c: any) => c.status === 'pending'
      );

      if (pendingCharge) {
        console.log('💰 Found existing pending charge, redirecting to confirmation');
        const response = NextResponse.redirect(pendingCharge.confirmation_url);
        response.cookies.delete('shopify_oauth_state');
        response.cookies.delete('shopify_oauth_merchant_id');
        response.cookies.delete('shopify_oauth_shop');
        return response;
      }

      // Note: Don't skip for active charges - always create new charge on fresh install
      // The old charge may be from a cancelled subscription
      console.log('💰 No pending charge found, will create new charge');
    } else {
      const errorText = await existingChargesResponse.text();
      console.log('⚠️ Could not fetch existing charges:', existingChargesResponse.status, errorText);
    }

    // Create new charge
    const chargeResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'AdWyse - Pro Plan',
          price: 99.99,
          trial_days: 7,
          return_url: returnUrl,
          test: isTestCharge, // Test mode for development stores
        }
      })
    });

    console.log(`💰 Creating ${isTestCharge ? 'TEST' : 'LIVE'} billing charge for ${shop}`);

    if (chargeResponse.ok) {
      const chargeData = await chargeResponse.json();
      const confirmationUrl = chargeData.recurring_application_charge.confirmation_url;

      console.log('✅ Billing charge created, redirecting to confirmation');

      // Clear OAuth cookies
      const response = NextResponse.redirect(confirmationUrl);
      response.cookies.delete('shopify_oauth_state');
      response.cookies.delete('shopify_oauth_merchant_id');
      response.cookies.delete('shopify_oauth_shop');

      return response;
    } else {
      const errorData = await chargeResponse.json().catch(() => null);
      console.error('❌ Failed to create billing charge:', chargeResponse.status, errorData);

      // If billing failed, try creating a TEST charge as fallback
      console.log('💰 Retrying with test: true...');
      const retryResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recurring_application_charge: {
            name: 'AdWyse - Pro Plan',
            price: 99.99,
            trial_days: 7,
            return_url: returnUrl,
            test: true, // Force test mode
          }
        })
      });

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const confirmationUrl = retryData.recurring_application_charge.confirmation_url;
        console.log('✅ Test billing charge created on retry, redirecting to confirmation');

        const response = NextResponse.redirect(confirmationUrl);
        response.cookies.delete('shopify_oauth_state');
        response.cookies.delete('shopify_oauth_merchant_id');
        response.cookies.delete('shopify_oauth_shop');
        return response;
      }

      const retryError = await retryResponse.json().catch(() => null);
      console.error('❌ Retry also failed:', retryResponse.status, retryError);

      // Only redirect to dashboard if all billing attempts fail
      const shopName = shop.replace('.myshopify.com', '');
      const appHandle = 'adwyse';
      const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${appHandle}?shop=${shop}&billing_error=true`;

      console.log('⚠️ All billing attempts failed, redirecting to dashboard with error flag');

      const response = NextResponse.redirect(shopifyAdminUrl);
      response.cookies.delete('shopify_oauth_state');
      response.cookies.delete('shopify_oauth_merchant_id');
      response.cookies.delete('shopify_oauth_shop');

      return response;
    }
  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    // Redirect to Shopify admin app page on error
    const shopParam = request.nextUrl.searchParams.get('shop');
    if (shopParam) {
      const shopName = shopParam.replace('.myshopify.com', '');
      const appHandle = 'adwyse';
      const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${appHandle}?shop=${shopParam}`;
      return NextResponse.redirect(shopifyAdminUrl);
    }
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
  }
}
