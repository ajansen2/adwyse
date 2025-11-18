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

    // Verify HMAC (Shopify security check) - try both DEV and PRODUCTION secrets
    const query = new URLSearchParams(searchParams.toString());
    query.delete('hmac');
    const message = Array.from(query.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('&');

    const secrets = [
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
    // Use PRODUCTION credentials (for App Store submission), fallback to DEV for local testing
    const apiKey = process.env.SHOPIFY_CLIENT_ID_PRODUCTION || process.env.SHOPIFY_CLIENT_ID_DEV;
    const apiSecret = process.env.SHOPIFY_API_SECRET_PRODUCTION || process.env.SHOPIFY_API_SECRET_DEV;

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

    let finalMerchantId = merchantId;

    // If no merchant ID (new App Store install), create merchant automatically
    if (!merchantId) {
      console.log('🆕 New merchant install - creating account automatically');

      const merchantEmail = shopInfo.email || `${shop.replace('.myshopify.com', '')}@shopify-placeholder.com`;

      // Check if user already exists by email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === merchantEmail);

      let userId: string;

      if (existingUser) {
        console.log('✅ User already exists, using existing account:', existingUser.id);
        userId = existingUser.id;
      } else {
        // Create Supabase user account using shop owner email
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: merchantEmail,
          email_confirm: true,
          user_metadata: {
            shop: shop,
            store_name: shopInfo.name,
          }
        });

        if (authError) {
          console.error('Failed to create user:', authError);
          return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
        }

        userId = authData.user.id;
        console.log('✅ Created new user:', userId);
      }

      // Check if merchant already exists for this user
      const { data: existingMerchant } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingMerchant) {
        console.log('✅ Merchant already exists, using existing merchant:', existingMerchant.id);
        finalMerchantId = existingMerchant.id;
      } else {
        // Create merchant record
        const { data: newMerchant, error: merchantError } = await supabase
          .from('merchants')
          .insert({
            user_id: userId,
            email: merchantEmail,
            full_name: shopInfo.shop_owner || shopInfo.name,
            company: shopInfo.name,
            subscription_tier: 'trial', // Start with trial, upgrade to pro after billing approval
            settings: {
              emails_enabled: true,
              first_email_delay: 1,    // 1 hour
              second_email_delay: 24,  // 24 hours
              third_email_delay: 48,   // 48 hours
            }
          })
          .select()
          .single();

        if (merchantError) {
          console.error('Failed to create merchant:', merchantError);
          return NextResponse.json({ error: 'Failed to create merchant account' }, { status: 500 });
        }

        finalMerchantId = newMerchant.id;
        console.log('✅ Created merchant:', finalMerchantId);
      }
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        merchant_id: finalMerchantId,
        platform: 'shopify',
        store_name: shopInfo.name || shop,
        store_url: `https://${shop}`,
        access_token: accessToken, // TODO: Encrypt this in production
        status: 'active',
        connected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (storeError) {
      console.error('Store creation error:', storeError);
      return NextResponse.json({ error: 'Failed to save store' }, { status: 500 });
    }

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

    // Create recurring application charge for billing ($99/month with 14-day trial)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;

    // Use test mode only for development stores (contains -test or when using DEV credentials explicitly)
    const isTestCharge = shop.includes('-test') || (apiKey === process.env.SHOPIFY_CLIENT_ID_DEV && !process.env.SHOPIFY_CLIENT_ID_PRODUCTION);

    // For embedded apps, use relative path in Shopify admin to avoid URL stacking
    // This redirects directly to our embedded dashboard after approval
    const shopName = shop.replace('.myshopify.com', '');
    const returnUrl = `https://admin.shopify.com/store/${shopName}/apps/argora-cart-recovery/dashboard?billing=success&shop=${shop}&store_id=${store.id}`;

    console.log('💰 Creating billing charge with return_url:', returnUrl);
    console.log('💰 Shop:', shop);
    console.log('💰 Store ID:', store.id);
    console.log('💰 Test charge:', isTestCharge);

    const chargeResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'Argora Cart Recovery - Pro Plan',
          price: 29.99,
          trial_days: 14,
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
      console.error('This is expected for development stores. Billing will work on production stores.');

      // Continue to dashboard without billing (can retry later)
      // Redirect to embedded app in Shopify admin
      const shopName = shop.replace('.myshopify.com', '');
      const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;

      console.log('✅ Installation complete, redirecting to embedded app:', shopifyAdminUrl);

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
      const apiKey = process.env.SHOPIFY_CLIENT_ID_PRODUCTION || process.env.SHOPIFY_CLIENT_ID_DEV;
      const shopifyAdminUrl = `https://admin.shopify.com/store/${shopName}/apps/${apiKey}`;
      return NextResponse.redirect(shopifyAdminUrl);
    }
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed', request.url));
  }
}
