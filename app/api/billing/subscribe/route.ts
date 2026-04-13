import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/billing/subscribe?shop=xxx&plan=pro&billing_cycle=monthly
 *
 * Entry point for the upgrade flow from the pricing card.
 * Looks up the store, creates a Shopify billing subscription,
 * and redirects the merchant to Shopify's confirmation page.
 */
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');
    const plan = request.nextUrl.searchParams.get('plan') || 'pro';

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter. Please access this from within Shopify.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Look up store by shop domain
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, shop_domain, access_token')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (storeError || !store) {
      console.error('❌ [BILLING SUBSCRIBE] Store not found:', shop, storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!store.access_token || store.access_token === 'revoked') {
      console.error('❌ [BILLING SUBSCRIBE] No valid access token for store');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
      return NextResponse.redirect(
        `${appUrl}/dashboard?shop=${shop}&error=needs_reinstall`
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
    const isTestStore = shop.includes('-test') || shop.includes('development') || shop.includes('dev-');

    // Set price based on billing cycle
    const price = 99.99;
    const interval = 'EVERY_30_DAYS';

    // Check for existing active subscription
    const existingResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              currentAppInstallation {
                activeSubscriptions {
                  id
                  name
                  status
                }
              }
            }
          `,
        }),
      }
    );

    if (existingResponse.ok) {
      const existingData = await existingResponse.json();
      const activeSubscriptions = existingData.data?.currentAppInstallation?.activeSubscriptions || [];
      const active = activeSubscriptions.find((s: any) => s.status === 'ACTIVE');
      if (active) {
        // Already subscribed — redirect back to dashboard within the app
        console.log('✅ [BILLING SUBSCRIBE] Already has active subscription');
        await supabase
          .from('stores')
          .update({ subscription_status: 'active', billing_charge_id: active.id })
          .eq('id', store.id);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
        return NextResponse.redirect(
          `${appUrl}/dashboard?shop=${shop}&billing=already_active`
        );
      }
    }

    // Create Shopify billing subscription via GraphQL
    const returnUrl = `${appUrl}/api/billing/callback?shop=${shop}&store_id=${store.id}`;

    const chargeResponse = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation AppSubscriptionCreate($name: String!, $returnUrl: URL!, $trialDays: Int, $test: Boolean, $lineItems: [AppSubscriptionLineItemInput!]!) {
              appSubscriptionCreate(
                name: $name
                returnUrl: $returnUrl
                trialDays: $trialDays
                test: $test
                lineItems: $lineItems
              ) {
                appSubscription {
                  id
                  status
                }
                confirmationUrl
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            name: 'AdWyse Pro',
            returnUrl,
            trialDays: 7,
            test: isTestStore,
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    price: { amount: price, currencyCode: 'USD' },
                    interval,
                  },
                },
              },
            ],
          },
        }),
      }
    );

    const chargeData = await chargeResponse.json();
    console.log('💰 [BILLING SUBSCRIBE] GraphQL response:', JSON.stringify(chargeData, null, 2));

    if (chargeData.errors) {
      console.error('❌ [BILLING SUBSCRIBE] GraphQL errors:', chargeData.errors);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
      return NextResponse.redirect(
        `${appUrl}/dashboard?shop=${shop}&error=billing_failed`
      );
    }

    const userErrors = chargeData.data?.appSubscriptionCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.error('❌ [BILLING SUBSCRIBE] User errors:', userErrors);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
      return NextResponse.redirect(
        `${appUrl}/dashboard?shop=${shop}&error=billing_failed&message=${encodeURIComponent(userErrors[0].message)}`
      );
    }

    const confirmationUrl = chargeData.data?.appSubscriptionCreate?.confirmationUrl;
    if (!confirmationUrl) {
      console.error('❌ [BILLING SUBSCRIBE] No confirmation URL');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
      return NextResponse.redirect(
        `${appUrl}/dashboard?shop=${shop}&error=billing_no_url`
      );
    }

    // Redirect merchant to Shopify's billing confirmation page
    console.log('✅ [BILLING SUBSCRIBE] Redirecting to confirmation:', confirmationUrl);
    return NextResponse.redirect(confirmationUrl);

  } catch (error) {
    console.error('❌ [BILLING SUBSCRIBE] Error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    if (shop) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://adwyse.ca';
      return NextResponse.redirect(
        `${appUrl}/dashboard?shop=${shop}&error=billing_error`
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
